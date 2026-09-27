from dataclasses import dataclass
from enum import StrEnum
from typing import Protocol


class MediaCapability(StrEnum):
    SEARCH = "search"
    METADATA = "metadata"
    PLAYBACK = "playback"
    SUBTITLES = "subtitles"


@dataclass(frozen=True)
class ProviderDescriptor:
    id: str
    languages: tuple[str, ...]
    capabilities: frozenset[MediaCapability]


class MediaProvider(Protocol):
    descriptor: ProviderDescriptor


PROVIDERS = {
    "youtube": ProviderDescriptor("youtube", ("*",), frozenset(MediaCapability)),
    "zdf": ProviderDescriptor("zdf", ("de",), frozenset({MediaCapability.SEARCH, MediaCapability.METADATA, MediaCapability.PLAYBACK})),
    "ard": ProviderDescriptor("ard", ("de",), frozenset({MediaCapability.SEARCH, MediaCapability.METADATA, MediaCapability.PLAYBACK})),
    "arte": ProviderDescriptor("arte", ("de", "fr"), frozenset({MediaCapability.SEARCH, MediaCapability.METADATA, MediaCapability.PLAYBACK})),
}


def provider_catalog() -> list[dict]:
    return [{
        "id": p.id,
        "languages": p.languages,
        "capabilities": sorted(cap.value for cap in p.capabilities),
    } for p in PROVIDERS.values()]
