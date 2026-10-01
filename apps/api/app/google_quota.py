from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

from google.auth import default as google_auth_default
from google.auth.exceptions import DefaultCredentialsError
from google.auth.transport.requests import AuthorizedSession


MONITORING_SCOPE = "https://www.googleapis.com/auth/monitoring.read"
MONITORING_API = "https://monitoring.googleapis.com/v3"

QUOTA_METRICS = [
    ("requests", "quota/generate_content_free_tier_requests"),
    ("input_tokens", "quota/generate_content_free_tier_input_token_count"),
    ("requests", "quota/generate_requests_per_model"),
    ("input_tokens", "quota/generate_content_paid_tier_input_token_count"),
    ("requests", "quota/generate_content_paid_tier_2_requests"),
    ("input_tokens", "quota/generate_content_paid_tier_2_input_token_count"),
    ("requests", "quota/generate_content_paid_tier_3_requests"),
    ("input_tokens", "quota/generate_content_paid_tier_3_input_token_count"),
]


def _model_matches(label: str | None, model: str) -> bool:
    value = str(label or "").strip()
    if not value:
        return True
    return value == model or value.endswith("/" + model)


def _series_value(series: dict[str, Any], *, sum_points: bool) -> float:
    values = []
    for point in series.get("points") or []:
        raw = (point.get("value") or {}).get("int64Value")
        if raw is None:
            raw = (point.get("value") or {}).get("doubleValue")
        if raw is None:
            continue
        try:
            values.append(float(raw))
        except (TypeError, ValueError):
            continue
    if not values:
        return 0.0
    return sum(values) if sum_points else values[0]


def _window_start(limit_name: str, now: datetime) -> datetime:
    name = limit_name.lower()
    if "day" in name:
        pacific = ZoneInfo("America/Los_Angeles")
        now_pt = now.astimezone(pacific)
        return now_pt.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)
    if "hour" in name:
        return now - timedelta(hours=1)
    if "minute" in name:
        return now - timedelta(minutes=1)
    return now - timedelta(days=1)


def _time_series(
    session: AuthorizedSession,
    project_id: str,
    *,
    metric_type: str,
    start: datetime,
    end: datetime,
) -> list[dict[str, Any]]:
    params = {
        "filter": f'metric.type="{metric_type}"',
        "interval.startTime": start.isoformat().replace("+00:00", "Z"),
        "interval.endTime": end.isoformat().replace("+00:00", "Z"),
        "view": "FULL",
        "pageSize": 1000,
    }
    response = session.get(
        f"{MONITORING_API}/projects/{project_id}/timeSeries",
        params=params,
        timeout=20,
    )
    response.raise_for_status()
    return response.json().get("timeSeries") or []


def fetch_gemini_quota(project_id: str, model: str) -> dict[str, Any]:
    project_id = str(project_id or "").strip()
    if not project_id:
        return {
            "status": "not_configured",
            "project_id": None,
            "model": model,
            "limits": [],
            "note": "GOOGLE_CLOUD_PROJECT is not configured.",
        }

    try:
        credentials, detected_project = google_auth_default(scopes=[MONITORING_SCOPE])
    except DefaultCredentialsError as exc:
        return {
            "status": "not_authorized",
            "project_id": project_id,
            "model": model,
            "limits": [],
            "note": f"Google Cloud Monitoring credentials are unavailable: {exc}",
        }

    effective_project = project_id or detected_project
    session = AuthorizedSession(credentials)
    now = datetime.now(timezone.utc)
    limits: list[dict[str, Any]] = []
    errors: list[str] = []

    for kind, base_metric in QUOTA_METRICS:
        limit_type = f"generativelanguage.googleapis.com/{base_metric}/limit"
        usage_type = f"generativelanguage.googleapis.com/{base_metric}/usage"
        try:
            limit_series = _time_series(
                session,
                effective_project,
                metric_type=limit_type,
                start=now - timedelta(minutes=10),
                end=now,
            )
        except Exception as exc:
            errors.append(f"{base_metric}: {exc}")
            continue

        for series in limit_series:
            labels = (series.get("metric") or {}).get("labels") or {}
            if not _model_matches(labels.get("model"), model):
                continue
            limit_name = str(labels.get("limit_name") or "quota")
            limit_value = _series_value(series, sum_points=False)
            if limit_value <= 0:
                continue

            start = _window_start(limit_name, now)
            try:
                usage_series = _time_series(
                    session,
                    effective_project,
                    metric_type=usage_type,
                    start=start,
                    end=now,
                )
            except Exception as exc:
                errors.append(f"{base_metric}/{limit_name}: {exc}")
                usage_series = []

            usage_value = 0.0
            for usage in usage_series:
                usage_labels = (usage.get("metric") or {}).get("labels") or {}
                if str(usage_labels.get("limit_name") or "") != limit_name:
                    continue
                if not _model_matches(usage_labels.get("model"), model):
                    continue
                usage_value += _series_value(usage, sum_points=True)

            remaining = max(0.0, limit_value - usage_value)
            limits.append({
                "kind": kind,
                "metric": base_metric,
                "limit_name": limit_name,
                "model": labels.get("model") or model,
                "limit": int(limit_value),
                "used": int(usage_value),
                "remaining": int(remaining),
                "window_start": start.isoformat(),
                "window_end": now.isoformat(),
            })

    unique: dict[tuple[str, str], dict[str, Any]] = {}
    for item in limits:
        unique[(item["metric"], item["limit_name"])] = item
    limits = list(unique.values())

    if limits:
        return {
            "status": "available",
            "project_id": effective_project,
            "model": model,
            "limits": limits,
            "note": "Cloud Monitoring quota metrics can lag by roughly 1-3 minutes.",
        }
    return {
        "status": "unavailable",
        "project_id": effective_project,
        "model": model,
        "limits": [],
        "note": (
            "No matching Gemini quota time series were returned. "
            "Cloud Monitoring may not be enabled yet, the credentials may lack monitoring.timeSeries.list, "
            "or quota metrics may not have been emitted for this project/model."
        ),
        "errors": errors[:5],
    }
