import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

type Profile = {
  id: string;
  source_language: string;
  target_language: string;
  level?: string | null;
};

type Source = {
  provider: string;
  source_type: string;
  external_id: string;
  url?: string | null;
  title?: string | null;
};

type Encounter = {
  id: string;
  surface_form: string;
  sentence: string;
  media_timestamp_ms?: number | null;
  media_end_timestamp_ms?: number | null;
  encountered_at: string;
  context?: Record<string, unknown>;
  source?: Source | null;
};

type LearningItem = {
  id: string;
  canonical_form: string;
  canonical_key: string;
  category: string;
  language_specific_type?: string | null;
  status: string;
  translations: { language: string; meaning: string }[];
  examples: Encounter[];
  encounters: Encounter[];
  merged_ids?: string[];
};

type IndexedToken = {
  i: number;
  surface?: string;
  text?: string;
  lemma?: string;
  pos?: string;
  morphology?: Record<string, unknown>;
  contextual_meaning_tr?: string;
  dictionary_meanings_tr?: string[];
  lexical_form?: {
    article?: string;
    singular?: string;
    plural?: string;
  } | null;
  usage_notes?: { kind?: string; label?: string; explanation_tr?: string }[];
};

type IndexedExpression = {
  type?: string;
  surface?: string;
  canonical?: string;
  contextual_meaning_tr?: string;
  grammar_hint?: string;
  token_indices?: number[];
  highlight_parts?: string[];
  highlight_exclude_parts?: string[];
};

type IndexedSegment = {
  index: number;
  text: string;
  sentence_translation?: string;
  tokens: IndexedToken[];
  expressions: IndexedExpression[];
  analysis_source?: string;
};

type ContentIndexResult = {
  cached?: boolean;
  analyzer_provider?: string | null;
  analyzer_model?: string | null;
  segments?: IndexedSegment[];
};

type ReaderDiagnosticState = {
  text: string;
  sentence_count: number;
  segment_count: number;
  provider: string;
  model: string;
  busy: boolean;
  error: string;
  active: { segmentIndex: number; tokenIndex: number } | null;
  segments: IndexedSegment[];
};

function downloadJsonFile(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function seconds(ms?: number | null) {
  return Math.max(0, Math.floor((ms || 0) / 1000));
}

function clock(ms?: number | null) {
  const total = seconds(ms);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function youtubeWatchUrl(encounter: Encounter) {
  const source = encounter.source;
  if (!source || source.provider !== "youtube") return source?.url || "#";
  const t = seconds(encounter.media_timestamp_ms);
  return `https://www.youtube.com/watch?v=${encodeURIComponent(source.external_id)}&t=${t}s`;
}

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  setPlaybackRate?: (rate: number) => void;
  setOption?: (module: string, option: string, value: unknown) => void;
  destroy: () => void;
};

type YTPlayerEvent = { target: YTPlayer };
type YTStateEvent = { data: number; target: YTPlayer };

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string;
          playerVars: Record<string, number | string>;
          events: {
            onReady: (event: YTPlayerEvent) => void;
            onStateChange: (event: YTStateEvent) => void;
          };
        },
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<void>((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };

    if (!document.getElementById("youtube-iframe-api")) {
      const script = document.createElement("script");
      script.id = "youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

function segmentClock(milliseconds: number) {
  const safe = Math.max(0, milliseconds);
  const totalSeconds = safe / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds - minutes * 60;
  return `${minutes}:${secs.toFixed(1).padStart(4, "0")}`;
}

function SentencePlayer({
  encounter,
  onComplete,
  repeatCount = 1,
}: {
  encounter: Encounter;
  onComplete?: () => void;
  repeatCount?: number;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const completedRef = useRef(false);
  const completedPlaysRef = useRef(0);
  const completionTimerRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const source = encounter.source;
  const startMs = Math.max(0, encounter.media_timestamp_ms || 0);
  const rawEndMs = encounter.media_end_timestamp_ms || startMs + 5000;
  const endMs = Math.max(startMs + 500, rawEndMs);
  const durationMs = endMs - startMs;
  const freezeAtMs = Math.max(startMs, endMs - 120);

  useEffect(() => {
    if (!mountRef.current || !source || source.provider !== "youtube") return;

    completedRef.current = false;
    completedPlaysRef.current = 0;
    let cancelled = false;
    let timer: number | undefined;

    loadYouTubeApi().then(() => {
      if (cancelled || !mountRef.current || !window.YT) return;

      const player = new window.YT.Player(mountRef.current, {
        videoId: source.external_id,
        playerVars: {
          controls: 0,
          cc_load_policy: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          playsinline: 1,
          rel: 0,
          start: Math.floor(startMs / 1000),
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            playerRef.current = event.target;
            // The review player must show the exact subtitle sentence saved by
            // the extension, not YouTube's own captions. YouTube captions can
            // differ from the extension transcript for the same audio moment.
            event.target.setOption?.("captions", "track", {});
            event.target.seekTo(startMs / 1000, true);
            event.target.setPlaybackRate?.(playbackRate);
            setPositionMs(0);
            setReady(true);
            event.target.playVideo();
          },
          onStateChange: (event) => {
            if (!window.YT) return;
            setPlaying(event.data === window.YT.PlayerState.PLAYING);
          },
        },
      });

      timer = window.setInterval(() => {
        const active = playerRef.current;
        if (!active) return;
        const absoluteMs = active.getCurrentTime() * 1000;

        if (absoluteMs >= freezeAtMs) {
          active.seekTo(freezeAtMs / 1000, true);
          active.pauseVideo();
          setPlaying(false);
          setPositionMs(durationMs);

          if (!completedRef.current) {
            completedRef.current = true;
            completedPlaysRef.current += 1;

            if (completedPlaysRef.current < repeatCount) {
              completionTimerRef.current = window.setTimeout(() => {
                completedRef.current = false;
                active.seekTo(startMs / 1000, true);
                setPositionMs(0);
                active.playVideo();
              }, 450);
            } else if (onComplete) {
              completionTimerRef.current = window.setTimeout(onComplete, 450);
            }
          }
          return;
        }

        if (absoluteMs < startMs - 100) {
          active.seekTo(startMs / 1000, true);
          setPositionMs(0);
          return;
        }

        setPositionMs(Math.min(durationMs, Math.max(0, absoluteMs - startMs)));
      }, 80);
    });

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearInterval(timer);
      if (completionTimerRef.current !== null) window.clearTimeout(completionTimerRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [source?.external_id, source?.provider, startMs, endMs, freezeAtMs, durationMs, onComplete, repeatCount, playbackRate]);

  function changePlaybackRate(rate: number) {
    setPlaybackRate(rate);
    playerRef.current?.setPlaybackRate?.(rate);
  }

  function seek(relativeMs: number) {
    const next = Math.min(durationMs, Math.max(0, relativeMs));
    const absolute = Math.min(freezeAtMs, startMs + next);
    playerRef.current?.seekTo(absolute / 1000, true);
    setPositionMs(next);
  }

  function togglePlayback() {
    const player = playerRef.current;
    if (!player) return;

    if (playing) {
      player.pauseVideo();
      return;
    }

    if (positionMs >= durationMs - 150) {
      completedRef.current = false;
      completedPlaysRef.current = 0;
      if (completionTimerRef.current !== null) {
        window.clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;
      }
      player.seekTo(startMs / 1000, true);
      setPositionMs(0);
    }
    player.playVideo();
  }

  if (!source || source.provider !== "youtube") return null;

  return <div className="sentence-player">
    <div className="video-stage">
      <div ref={mountRef} className="youtube-mount" />
      <div className="sentence-overlay">{encounter.sentence}</div>
    </div>
    <div className="playback-rate-control" aria-label="Oynatma hızı">
      <span>Hız</span>
      {[0.5, 0.75, 1].map(rate =>
        <button
          key={rate}
          className={playbackRate === rate ? "active" : ""}
          onClick={() => changePlaybackRate(rate)}
          disabled={!ready}
        >
          {rate}×
        </button>
      )}
    </div>
    <div className="segment-controls">
      <button onClick={() => seek(positionMs - 1000)} disabled={!ready} title="1 saniye geri">−1s</button>
      <button className="play-toggle" onClick={togglePlayback} disabled={!ready}>
        {playing ? "❚❚" : positionMs >= durationMs - 150 ? "↻" : "▶"}
      </button>
      <button onClick={() => seek(positionMs + 1000)} disabled={!ready} title="1 saniye ileri">+1s</button>
      <span className="segment-time">{segmentClock(positionMs)} / {segmentClock(durationMs)}</span>
      <input
        className="segment-slider"
        type="range"
        min="0"
        max={durationMs}
        step="50"
        value={Math.min(positionMs, durationMs)}
        onChange={event => seek(Number(event.target.value))}
        disabled={!ready}
        aria-label="Cümle içinde ileri geri sar"
      />
    </div>
  </div>;
}

function examplePlaybackEncounter(encounter: Encounter) {
  const startMs = Math.max(0, encounter.media_timestamp_ms || 0);
  const rawEndMs = Math.max(startMs + 500, encounter.media_end_timestamp_ms || startMs + 5000);
  if (rawEndMs - startMs <= 10000) return encounter;

  return {
    ...encounter,
    media_timestamp_ms: Math.max(startMs, rawEndMs - 10000),
    media_end_timestamp_ms: rawEndMs,
  };
}

function playlistEncounters(encounters: Encounter[]) {
  const selected: Encounter[] = [];
  const seenVideos = new Set<string>();

  for (const encounter of encounters) {
    if (encounter.source?.provider !== "youtube" || !encounter.source.external_id) continue;
    if (seenVideos.has(encounter.source.external_id)) continue;
    seenVideos.add(encounter.source.external_id);
    selected.push(encounter);
    if (selected.length === 6) break;
  }

  return selected;
}

function ExamplePlaylist({ item, onClose }: { item: LearningItem; onClose: () => void }) {
  const examples = useMemo(() => playlistEncounters(item.examples), [item.examples]);
  const [index, setIndex] = useState(0);
  const [repeatCount, setRepeatCount] = useState(1);

  useEffect(() => {
    if (index >= examples.length) setIndex(0);
  }, [examples.length, index]);

  const current = examples[index];
  const playbackCurrent = current ? examplePlaybackEncounter(current) : null;
  if (!current) return <div className="example-playlist empty-playlist">
    <span>Henüz oynatılabilir YouTube örneği yok.</span>
    <button onClick={onClose}>Kapat</button>
  </div>;

  return <div className="example-playlist">
    <div className="playlist-head">
      <div>
        <span className="playlist-kicker">ÖRNEKLERİ DİNLE</span>
        <strong>{item.canonical_form}</strong>
        <small>{index + 1} / {examples.length} · farklı YouTube videoları</small>
      </div>
      <button className="playlist-close" onClick={onClose}>Kapat</button>
    </div>

    <div className="repeat-control">
      <span>Her örnek</span>
      {[1, 2, 3].map(count =>
        <button
          key={count}
          className={repeatCount === count ? "active" : ""}
          onClick={() => setRepeatCount(count)}
        >
          {count}×
        </button>
      )}
      <small>kez oynat, sonra otomatik sonraki videoya geç</small>
    </div>

    {playbackCurrent && <SentencePlayer
      encounter={playbackCurrent}
      repeatCount={repeatCount}
      onComplete={index < examples.length - 1 ? () => setIndex(value => value + 1) : undefined}
    />}

    <div className="playlist-nav">
      <button onClick={() => setIndex(value => Math.max(0, value - 1))} disabled={index === 0}>← Önceki</button>
      <div className="playlist-dots">
        {examples.map((encounter, exampleIndex) =>
          <button
            key={encounter.id}
            className={exampleIndex === index ? "active" : ""}
            onClick={() => setIndex(exampleIndex)}
            aria-label={`Örnek ${exampleIndex + 1}`}
          />
        )}
      </div>
      <button onClick={() => setIndex(value => Math.min(examples.length - 1, value + 1))} disabled={index === examples.length - 1}>Sonraki →</button>
    </div>
  </div>;
}


function splitReaderSentences(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  if ("Segmenter" in Intl) {
    try {
      const SegmenterCtor = Intl.Segmenter as unknown as new (
        locale: string,
        options: { granularity: "sentence" },
      ) => { segment: (value: string) => Iterable<{ segment: string }> };
      return [...new SegmenterCtor("de", { granularity: "sentence" }).segment(normalized)]
        .map(part => part.segment.trim())
        .filter(Boolean);
    } catch {
      // Fall through to punctuation-based splitting.
    }
  }
  return normalized.match(/[^.!?…]+(?:[.!?…]+|$)/g)?.map(part => part.trim()).filter(Boolean) || [normalized];
}

function readerTextId(text: string) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return "web-reader:" + (hash >>> 0).toString(16);
}

function tokenLabel(token: IndexedToken) {
  return token.surface || token.text || token.lemma || "";
}

function expressionMembers(expression: IndexedExpression) {
  return new Set(expression.token_indices || []);
}

function learningMeaning(item: LearningItem) {
  return item.translations.find(translation => translation.language === "tr")?.meaning
    || item.translations[0]?.meaning
    || "";
}

function encounterContextualMeaning(encounter?: Encounter | null) {
  const value = encounter?.context?.contextual_meaning_tr;
  return typeof value === "string" ? value.trim() : "";
}

function encounterDictionaryMeanings(encounter?: Encounter | null) {
  const value = encounter?.context?.dictionary_meanings_tr;
  return Array.isArray(value) ? value.map(item => String(item).trim()).filter(Boolean) : [];
}

function itemContextualMeaning(item: LearningItem) {
  for (const encounter of validEncounters(item)) {
    const meaning = encounterContextualMeaning(encounter);
    if (meaning) return meaning;
  }
  return learningMeaning(item);
}

function alternateMeanings(item: LearningItem, encounter?: Encounter | null) {
  const primary = (encounter ? encounterContextualMeaning(encounter) : itemContextualMeaning(item))
    .toLocaleLowerCase("tr-TR");
  const values = [
    ...encounterDictionaryMeanings(encounter),
    ...item.translations.map(translation => translation.meaning),
  ].map(value => value.trim()).filter(Boolean);
  return [...new Set(values)].filter(value => value.toLocaleLowerCase("tr-TR") !== primary);
}

function itemStatus(item?: LearningItem | null) {
  return item?.status === "learned" || item?.status === "known" ? "learned" : "learning";
}

function itemKindLabel(item: LearningItem) {
  const type = (item.language_specific_type || "").toUpperCase();
  if (type.includes("VERB")) return "FİİL";
  if (type.includes("NOUN")) return "İSİM";
  if (type.includes("ADJECTIVE")) return "SIFAT";
  if (item.category === "expression") return "KALIP";
  return "KELİME";
}

function sourceKind(encounter: Encounter) {
  const provider = (encounter.source?.provider || "").toLowerCase();
  const sourceType = (encounter.source?.source_type || "").toLowerCase();
  if (provider === "youtube") return "youtube";
  if (provider === "zdf" || sourceType === "video") return "video";
  return "text";
}

function sourceLabel(encounter: Encounter) {
  const kind = sourceKind(encounter);
  if (kind === "youtube") return "YouTube";
  if (kind === "video") return encounter.source?.provider?.toUpperCase() || "Video";
  if (encounter.source?.provider === "web-app") return "Metin";
  if (encounter.source?.provider === "web") return "Web";
  return encounter.source?.provider || "Metin";
}

function sourceActionLabel(encounter: Encounter) {
  return sourceKind(encounter) === "text" ? "Metni aç ↗" : "Videoda aç ↗";
}

function matchingTerms(item: LearningItem, encounter: Encounter) {
  return [encounter.surface_form, item.canonical_form]
    .map(value => String(value || "").trim())
    .filter(Boolean);
}

function encounterMatchesItem(item: LearningItem, encounter: Encounter) {
  const context = encounter.context || {};
  if (context.derived_from === "indexed-content") return true;
  const sentence = encounter.sentence.toLocaleLowerCase("de-DE");
  return matchingTerms(item, encounter).some(term =>
    sentence.includes(term.toLocaleLowerCase("de-DE"))
  );
}

function validEncounters(item: LearningItem) {
  const matching = item.encounters.filter(encounter => encounterMatchesItem(item, encounter));
  return matching.length ? matching : item.encounters.filter(encounter =>
    Boolean(encounterContextualMeaning(encounter))
  );
}

function mergeLearningItems(items: LearningItem[]) {
  const groups = new Map<string, LearningItem[]>();
  for (const item of items) {
    const key = [
      item.category === "expression" ? "expression" : "word",
      item.canonical_form.trim().toLocaleLowerCase("de-DE"),
    ].join(":");
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }

  return [...groups.values()].map(group => {
    if (group.length === 1) return { ...group[0], merged_ids: [group[0].id] };

    const primary = group[0];
    const encounterMap = new Map<string, Encounter>();
    const exampleMap = new Map<string, Encounter>();
    const translationMap = new Map<string, { language: string; meaning: string }>();

    for (const item of group) {
      for (const encounter of item.encounters) {
        const key = [
          encounter.source?.provider || "",
          encounter.source?.external_id || "",
          encounter.sentence,
          encounter.media_timestamp_ms ?? "",
        ].join("|");
        if (!encounterMap.has(key) || encounterContextualMeaning(encounter)) {
          encounterMap.set(key, encounter);
        }
      }
      for (const example of item.examples) {
        const key = [example.source?.external_id || "", example.sentence].join("|");
        if (!exampleMap.has(key)) exampleMap.set(key, example);
      }
      for (const translation of item.translations) {
        const key = translation.language + ":" + translation.meaning.trim().toLocaleLowerCase("tr-TR");
        if (!translationMap.has(key)) translationMap.set(key, translation);
      }
    }

    return {
      ...primary,
      status: group.some(item => itemStatus(item) === "learned") ? "learned" : primary.status,
      language_specific_type: group.find(item => item.language_specific_type)?.language_specific_type
        || primary.language_specific_type,
      translations: [...translationMap.values()],
      encounters: [...encounterMap.values()],
      examples: [...exampleMap.values()],
      merged_ids: group.map(item => item.id),
    };
  });
}

function HighlightedSentence({ sentence, terms }: { sentence: string; terms: string[] }) {
  const lower = sentence.toLocaleLowerCase("de-DE");
  const matches = terms
    .map(term => {
      const index = lower.indexOf(term.toLocaleLowerCase("de-DE"));
      return { term, index };
    })
    .filter(match => match.index >= 0)
    .sort((left, right) => left.index - right.index || right.term.length - left.term.length);
  const match = matches[0];
  if (!match) return <>{sentence}</>;
  const before = sentence.slice(0, match.index);
  const hit = sentence.slice(match.index, match.index + match.term.length);
  const after = sentence.slice(match.index + match.term.length);
  return <>{before}<mark className="learning-highlight">{hit}</mark>{after}</>;
}

async function persistLearningStatus(
  profileId: string,
  target: {
    kind: "word" | "expression";
    key: string;
    label: string;
    meaning: string;
    surface: string;
    languageSpecificType?: string | null;
  },
  status: "learning" | "learned",
  encounter?: {
    sentence: string;
    externalId: string;
    segmentIndex: number;
  },
) {
  if (!profileId) throw new Error("Önce bir öğrenme profili seç.");
  const response = await fetch(apiBase + "/api/v1/learning-items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile_id: profileId,
      canonical_form: target.label,
      canonical_key: target.key.toLocaleLowerCase("de-DE"),
      category: target.kind,
      language_specific_type: target.languageSpecificType || null,
      status,
      meaning: target.meaning || null,
      meaning_language: target.meaning ? "tr" : null,
      metadata: { source: "web-app", saved: status === "learning" },
    }),
  });
  if (!response.ok) throw new Error("Öğrenme durumu kaydedilemedi.");
  const item = await response.json() as LearningItem;

  if (encounter?.sentence) {
    const encounterResponse = await fetch(apiBase + "/api/v1/encounters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        learning_item_id: item.id,
        surface_form: target.surface,
        sentence: encounter.sentence,
        provider: "web-app",
        source_type: "text",
        external_id: encounter.externalId,
        url: window.location.href,
        title: "Web metin analizi",
        media_timestamp_ms: null,
        media_end_timestamp_ms: null,
        context: { segment_index: encounter.segmentIndex, source: "semantic-reader" },
      }),
    });
    if (!encounterResponse.ok) throw new Error("Kelime kaydedildi fakat karşılaşma kaydedilemedi.");
  }

  return item;
}

function SemanticReader({
  profileId,
  items,
  onItemsChanged,
  onDiagnosticState,
}: {
  profileId: string;
  items: LearningItem[];
  onItemsChanged: () => Promise<void>;
  onDiagnosticState?: (state: ReaderDiagnosticState) => void;
}) {
  const [text, setText] = useState("");
  const [segments, setSegments] = useState<IndexedSegment[]>([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState<"learning" | "learned" | "">("");
  const [error, setError] = useState("");
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [active, setActive] = useState<{ segmentIndex: number; tokenIndex: number } | null>(null);

  useEffect(() => {
    onDiagnosticState?.({
      text,
      sentence_count: splitReaderSentences(text).length,
      segment_count: segments.length,
      provider,
      model,
      busy,
      error,
      active,
      segments,
    });
  }, [active, busy, error, model, onDiagnosticState, provider, segments, text]);

  const activeSegment = active ? segments.find(segment => segment.index === active.segmentIndex) || null : null;
  const activeToken = activeSegment?.tokens.find(token => token.i === active?.tokenIndex) || null;
  const linkedExpressions = activeSegment && activeToken
    ? (activeSegment.expressions || [])
        .filter(expression => expressionMembers(expression).has(activeToken.i))
        .sort((left, right) => (left.token_indices?.length || 0) - (right.token_indices?.length || 0))
    : [];
  const primaryExpression = linkedExpressions[0] || null;
  const primaryMembers = primaryExpression ? expressionMembers(primaryExpression) : new Set<number>();

  const learnTarget = activeToken ? {
    kind: (primaryExpression ? "expression" : "word") as "word" | "expression",
    key: primaryExpression?.canonical || activeToken.lemma || tokenLabel(activeToken),
    label: primaryExpression?.canonical || activeToken.lexical_form?.singular || activeToken.lemma || tokenLabel(activeToken),
    meaning: primaryExpression?.contextual_meaning_tr
      || activeToken.contextual_meaning_tr
      || activeToken.dictionary_meanings_tr?.[0]
      || "",
    surface: primaryExpression?.surface || tokenLabel(activeToken),
    languageSpecificType: primaryExpression?.type || activeToken.pos || null,
  } : null;

  const existingTarget = learnTarget
    ? items.find(item =>
        item.category === learnTarget.kind
        && item.canonical_key.toLocaleLowerCase("de-DE") === learnTarget.key.toLocaleLowerCase("de-DE")
      ) || null
    : null;

  async function analyzeText() {
    const sentences = splitReaderSentences(text);
    if (!sentences.length) return;
    setBusy(true);
    setError("");
    setActive(null);
    try {
      const payload = {
        provider: "web-app",
        source_type: "text",
        external_id: readerTextId(text),
        title: "Web metin analizi",
        source_language: "de",
        target_language: "tr",
        segments: sentences.map((sentence, index) => ({
          index,
          text: sentence,
          start_ms: index * 1000,
          end_ms: index * 1000 + 900,
        })),
        metadata: { source: "apps/web", purpose: "semantic-reader" },
      };
      const response = await fetch(apiBase + "/api/v1/content-index/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Metin analiz edilemedi.");
      }
      const result = await response.json() as ContentIndexResult;
      setSegments(result.segments || []);
      setProvider(result.analyzer_provider || "");
      setModel(result.analyzer_model || "");
    } catch (reason) {
      setSegments([]);
      setError(reason instanceof Error ? reason.message : "Metin analiz edilemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function saveActive(status: "learning" | "learned") {
    if (!learnTarget || !activeSegment) return;
    setSaving(status);
    setError("");
    try {
      await persistLearningStatus(profileId, learnTarget, status, {
        sentence: activeSegment.text,
        externalId: readerTextId(text),
        segmentIndex: activeSegment.index,
      });
      await onItemsChanged();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Kayıt başarısız.");
    } finally {
      setSaving("");
    }
  }

  return <div className="reader-page">
    <header className="page-head">
      <div>
        <p className="eyebrow">SEMANTİK OKUMA</p>
        <h1>Metin Analizi</h1>
        <p className="subtitle">
          Almanca metni cümle ve kelime listesine ayırmak yerine, cümlede birlikte anlam taşıyan yapılara göre incele.
        </p>
      </div>
    </header>

    <section className="reader-input-card">
      <textarea
        value={text}
        onChange={event => setText(event.target.value)}
        placeholder="Buraya Almanca bir metin yapıştır…"
        rows={8}
      />
      <div className="reader-input-actions">
        <span>{splitReaderSentences(text).length} cümle</span>
        <button className="reader-analyze" onClick={analyzeText} disabled={busy || !text.trim()}>
          {busy ? "AI analiz ediyor…" : "AI ile analiz et"}
        </button>
      </div>
    </section>

    {error && <div className="reader-error">{error}</div>}

    {segments.length > 0 && <div className="reader-result-head">
      <div>
        <strong>{segments.length} cümle</strong>
        <span>{provider || "AI"}{model ? " · " + model : ""}</span>
      </div>
      <small>Kelimenin üzerine gel: önce kelime anlamı, sonra bağlı anlam grubu ve yapılar gösterilir.</small>
    </div>}

    <section className="reader-segments">
      {segments.map(segment => <article className="reader-sentence" key={segment.index}>
        <div className="reader-sentence-number">{segment.index + 1}</div>
        <div className="reader-sentence-body">
          <div className="reader-token-line">
            {segment.tokens.map(token => {
              const selected = active?.segmentIndex === segment.index && active.tokenIndex === token.i;
              const grouped = active?.segmentIndex === segment.index && primaryMembers.has(token.i);
              const punctuation = /^[^\p{L}\p{N}]+$/u.test(tokenLabel(token));
              return <span
                key={token.i}
                className={[
                  "reader-token",
                  selected ? "selected" : "",
                  grouped ? "grouped" : "",
                  punctuation ? "punctuation" : "",
                ].filter(Boolean).join(" ")}
                onMouseEnter={() => !punctuation && setActive({ segmentIndex: segment.index, tokenIndex: token.i })}
                onFocus={() => !punctuation && setActive({ segmentIndex: segment.index, tokenIndex: token.i })}
                tabIndex={punctuation ? -1 : 0}
              >
                {tokenLabel(token)}
              </span>;
            })}
          </div>
          {segment.sentence_translation && <div className="reader-translation">{segment.sentence_translation}</div>}

          {active?.segmentIndex === segment.index && activeToken && <div className="reader-popover">
            <div className="reader-word-head">
              <div>
                <strong>
                  {activeToken.lexical_form?.article ? activeToken.lexical_form.article + " " : ""}
                  {activeToken.lexical_form?.singular || activeToken.lemma || tokenLabel(activeToken)}
                </strong>
                <span>{activeToken.pos || "Kelime"}</span>
              </div>
              {segment.analysis_source === "ai" && <em>AI</em>}
            </div>

            <div className="reader-word-meaning">
              {activeToken.contextual_meaning_tr || activeToken.dictionary_meanings_tr?.[0] || "Türkçe anlam bulunamadı."}
            </div>

            {activeToken.lexical_form?.plural && <div className="reader-detail">
              <b>Çoğul:</b> die {activeToken.lexical_form.plural}
            </div>}

            {(activeToken.dictionary_meanings_tr || []).filter(meaning =>
              meaning !== activeToken.contextual_meaning_tr
            ).length > 0 && <div className="reader-detail">
              <b>Diğer yaygın anlam:</b>{" "}
              {(activeToken.dictionary_meanings_tr || []).filter(meaning =>
                meaning !== activeToken.contextual_meaning_tr
              ).join(", ")}
            </div>}

            {linkedExpressions.length > 0 && <div className="reader-expression-stack">
              {linkedExpressions.map((expression, expressionIndex) => <div className="reader-expression" key={
                (expression.canonical || expression.surface || "expression") + ":" + expressionIndex
              }>
                <div className="reader-expression-kicker">
                  {expressionIndex === 0 ? "BAĞLI ANLAM GRUBU" : "İÇ YAPI / BAĞLI YAPI"}
                </div>
                <strong>{expression.surface || expression.canonical}</strong>
                {expression.contextual_meaning_tr && <p>{expression.contextual_meaning_tr}</p>}
                {expression.canonical && expression.canonical !== expression.surface && <div className="reader-detail">
                  <b>Yapı:</b> {expression.canonical}
                </div>}
                {expression.grammar_hint && <div className="reader-detail">
                  <b>Gramer:</b> {expression.grammar_hint}
                </div>}
              </div>)}
            </div>}

            {linkedExpressions.length === 0 && <div className="reader-no-expression">
              Bu kelime için bağlı bir anlam grubu bulunmadı.
            </div>}

            {learnTarget && <div className="reader-learn-actions">
              <button
                className={existingTarget && itemStatus(existingTarget) === "learning" ? "active" : ""}
                disabled={!profileId || Boolean(saving)}
                onClick={() => saveActive("learning")}
              >
                {saving === "learning" ? "Kaydediliyor…" : "☆ Öğreniyorum"}
              </button>
              <button
                className={"known " + (existingTarget && itemStatus(existingTarget) === "learned" ? "active" : "")}
                disabled={!profileId || Boolean(saving)}
                onClick={() => saveActive("learned")}
              >
                {saving === "learned" ? "Kaydediliyor…" : "✓ Biliyorum"}
              </button>
              {existingTarget && <span>
                Kayıtlı · {itemStatus(existingTarget) === "learned" ? "Biliyorum" : "Öğreniyorum"}
              </span>}
            </div>}
          </div>}
        </div>
      </article>)}
    </section>
  </div>;
}

function EncountersPage({
  items,
  playingEncounter,
  onTogglePlay,
}: {
  items: LearningItem[];
  playingEncounter: string | null;
  onTogglePlay: (id: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => items.flatMap(item =>
    item.encounters.map(encounter => ({ item, encounter }))
  ).sort((left, right) =>
    new Date(right.encounter.encountered_at).getTime() - new Date(left.encounter.encountered_at).getTime()
  ), [items]);
  const needle = query.trim().toLocaleLowerCase("de-DE");
  const filtered = needle ? rows.filter(({ item, encounter }) =>
    (item.canonical_form + " " + learningMeaning(item) + " " + encounter.sentence + " " + (encounter.source?.title || ""))
      .toLocaleLowerCase("de-DE").includes(needle)
  ) : rows;

  return <div>
    <header className="page-head">
      <div>
        <p className="eyebrow">GERÇEK BAĞLAMLAR</p>
        <h1>Karşılaşmalar</h1>
        <p className="subtitle">Kaydettiğin kelime ve kalıpların videolarda ve metinlerde karşılaştığın gerçek cümlelerini tek yerde gör.</p>
      </div>
    </header>
    <section className="toolbar">
      <input placeholder="Kelime, kaynak veya cümlede ara…" value={query} onChange={event => setQuery(event.target.value)} />
      <span>{filtered.length} karşılaşma</span>
    </section>
    {filtered.length === 0 && <div className="empty">Henüz eşleşen bir karşılaşma yok.</div>}
    <section className="encounter-library">
      {filtered.map(({ item, encounter }) => {
        const isYouTube = encounter.source?.provider === "youtube";
        const isPlaying = playingEncounter === encounter.id;
        return <article className="encounter-library-card" key={encounter.id}>
          <div className="encounter-library-head">
            <div>
              <span className={"kind " + item.category}>{itemKindLabel(item)}</span>
              <strong>{item.canonical_form}</strong>
              <small>{encounterContextualMeaning(encounter) || itemContextualMeaning(item) || "Anlam henüz yok"}</small>
            </div>
            <span className={"learning-status " + itemStatus(item)}>
              {itemStatus(item) === "learned" ? "Biliyorum" : "Öğreniyorum"}
            </span>
          </div>
          <div className="source-row">
            <span className="source-pill">{sourceLabel(encounter)}</span>
            <strong>{encounter.source?.title || encounter.source?.url || "Kaynak"}</strong>
            {sourceKind(encounter) !== "text" && encounter.media_timestamp_ms != null && <span className="timestamp">{clock(encounter.media_timestamp_ms)}</span>}
          </div>
          <blockquote>{encounter.sentence}</blockquote>
          <div className="actions">
            {isYouTube && <button className="primary" onClick={() => onTogglePlay(isPlaying ? null : encounter.id)}>
              {isPlaying ? "Durdur" : "▶ Cümleyi dinle"}
            </button>}
            {encounter.source?.url && <a href={sourceKind(encounter) === "text" ? encounter.source.url : youtubeWatchUrl(encounter)} target="_blank" rel="noreferrer">{sourceActionLabel(encounter)}</a>}
          </div>
          {isPlaying && isYouTube && <SentencePlayer encounter={encounter} />}
        </article>;
      })}
    </section>
  </div>;
}

function ReviewPage({
  profileId,
  items,
  onItemsChanged,
}: {
  profileId: string;
  items: LearningItem[];
  onItemsChanged: () => Promise<void>;
}) {
  const reviewItems = useMemo(() => items.filter(item => item.status !== "archived"), [items]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (index >= reviewItems.length) setIndex(0);
  }, [index, reviewItems.length]);

  const item = reviewItems[index] || null;
  const example = item
    ? [...item.encounters, ...item.examples].find(encounter => {
        const sentence = encounter.sentence.toLocaleLowerCase("de-DE");
        const surface = (encounter.surface_form || "").toLocaleLowerCase("de-DE").trim();
        const canonical = item.canonical_form.toLocaleLowerCase("de-DE").trim();
        return Boolean(
          (surface && sentence.includes(surface))
          || (canonical && sentence.includes(canonical))
        );
      }) || null
    : null;

  const reviewMeaning = item
    ? (encounterContextualMeaning(example) || itemContextualMeaning(item) || "Anlam henüz yok")
    : "";
  const reviewOtherMeanings = item ? alternateMeanings(item, example) : [];

  async function mark(status: "learning" | "learned") {
    if (!item) return;
    setBusy(true);
    try {
      await persistLearningStatus(profileId, {
        kind: item.category === "expression" ? "expression" : "word",
        key: item.canonical_key,
        label: item.canonical_form,
        meaning: learningMeaning(item),
        surface: item.canonical_form,
        languageSpecificType: item.language_specific_type,
      }, status);
      await onItemsChanged();
      setRevealed(false);
      setIndex(current => reviewItems.length ? (current + 1) % reviewItems.length : 0);
    } finally {
      setBusy(false);
    }
  }

  return <div>
    <header className="page-head">
      <div>
        <p className="eyebrow">AKTİF TEKRAR</p>
        <h1>Tekrar</h1>
        <p className="subtitle">Kelimeyi önce hatırlamaya çalış; sonra anlamı ve gerçek örnek cümleyi açıp durumunu güncelle.</p>
      </div>
    </header>
    {!item && <div className="empty">Tekrar edilecek bir öğe yok.</div>}
    {item && <section className="review-card">
      <div className="review-progress">{index + 1} / {reviewItems.length}</div>
      <span className={"kind " + item.category}>{item.category === "expression" ? "KALIP" : "KELİME"}</span>
      <h2>{item.canonical_form}</h2>
      {!revealed ? <button className="review-reveal" onClick={() => setRevealed(true)}>Anlamı göster</button> : <>
        <div className="review-answer">{reviewMeaning}</div>
        {reviewOtherMeanings.length > 0 && <details className="review-other-meanings">
          <summary>Diğer anlamlar</summary>
          <div>{reviewOtherMeanings.join(" · ")}</div>
        </details>}
        {example && <blockquote>{example.sentence}</blockquote>}
        <div className="review-actions">
          <button disabled={busy} onClick={() => mark("learning")}>↻ Tekrar et</button>
          <button className="known" disabled={busy} onClick={() => mark("learned")}>✓ Biliyorum</button>
        </div>
      </>}
      <div className="review-nav">
        <button onClick={() => { setRevealed(false); setIndex(current => Math.max(0, current - 1)); }} disabled={index === 0}>← Önceki</button>
        <button onClick={() => { setRevealed(false); setIndex(current => Math.min(reviewItems.length - 1, current + 1)); }} disabled={index >= reviewItems.length - 1}>Sonraki →</button>
      </div>
    </section>}
  </div>;
}


function LearningItemDetailPage({
  item,
  playingEncounter,
  onTogglePlay,
  onBack,
}: {
  item: LearningItem;
  playingEncounter: string | null;
  onTogglePlay: (id: string | null) => void;
  onBack: () => void;
}) {
  const primaryMeaning = itemContextualMeaning(item) || "Anlam henüz yok";
  const otherMeanings = alternateMeanings(item);
  const encounters = validEncounters(item);
  const textEncounters = encounters.filter(encounter => sourceKind(encounter) === "text");
  const videoEncounters = encounters.filter(encounter => sourceKind(encounter) !== "text");

  return <div className="item-detail-page">
    <button className="detail-back" onClick={onBack}>← Kelimelerim</button>
    <header className="detail-hero">
      <div>
        <span className={"kind " + item.category}>{itemKindLabel(item)}</span>
        <h1>{item.canonical_form}</h1>
        <p className="detail-primary-meaning">{primaryMeaning}</p>
        <div className="detail-meta">
          <span className={"learning-status " + itemStatus(item)}>
            {itemStatus(item) === "learned" ? "Biliyorum" : "Öğreniyorum"}
          </span>
          {item.language_specific_type && <span>{item.language_specific_type}</span>}
          <span>{item.encounters.length} karşılaşma</span>
        </div>
      </div>
    </header>

    {otherMeanings.length > 0 && <section className="detail-section">
      <h2>Diğer anlamlar</h2>
      <div className="meaning-chips">
        {otherMeanings.map(meaning => <span key={meaning}>{meaning}</span>)}
      </div>
    </section>}

    <section className="detail-section">
      <div className="detail-section-head">
        <div>
          <p className="eyebrow">BAĞLAM</p>
          <h2>Metinde geçtiği yerler</h2>
        </div>
        <span>{textEncounters.length}</span>
      </div>
      {textEncounters.length === 0
        ? <div className="detail-empty">Bu öğe için kayıtlı metin karşılaşması yok.</div>
        : <div className="detail-context-list">
            {textEncounters.map(encounter => <article className="context-card text-context" key={encounter.id}>
              <div className="source-row">
                <span className="source-pill">{sourceLabel(encounter)}</span>
                <strong>{encounter.source?.title || encounter.source?.url || "Metin kaynağı"}</strong>
              </div>
              <p className="context-sentence">
                <HighlightedSentence sentence={encounter.sentence} terms={matchingTerms(item, encounter)} />
              </p>
              {encounterContextualMeaning(encounter) && <p className="context-meaning">
                {encounterContextualMeaning(encounter)}
              </p>}
              {encounter.source?.url && <div className="actions">
                <a href={encounter.source.url} target="_blank" rel="noreferrer">{sourceActionLabel(encounter)}</a>
              </div>}
            </article>)}
          </div>}
    </section>

    <section className="detail-section">
      <div className="detail-section-head">
        <div>
          <p className="eyebrow">DİNLEME</p>
          <h2>Videoda geçtiği yerler</h2>
        </div>
        <span>{videoEncounters.length}</span>
      </div>
      {videoEncounters.length === 0
        ? <div className="detail-empty">Bu öğe için kayıtlı video karşılaşması yok.</div>
        : <div className="detail-context-list">
            {videoEncounters.map(encounter => {
              const isYouTube = encounter.source?.provider === "youtube";
              const isPlaying = playingEncounter === encounter.id;
              return <article className="context-card video-context" key={encounter.id}>
                <div className="source-row">
                  <span className="source-pill">{sourceLabel(encounter)}</span>
                  <strong>{encounter.source?.title || encounter.source?.url || "Video"}</strong>
                  {encounter.media_timestamp_ms != null && <span className="timestamp">{clock(encounter.media_timestamp_ms)}</span>}
                </div>
                <p className="context-sentence">
                  <HighlightedSentence sentence={encounter.sentence} terms={matchingTerms(item, encounter)} />
                </p>
                {encounterContextualMeaning(encounter) && <p className="context-meaning">
                  {encounterContextualMeaning(encounter)}
                </p>}
                <div className="actions">
                  {isYouTube && <button className="primary" onClick={() => onTogglePlay(isPlaying ? null : encounter.id)}>
                    {isPlaying ? "Durdur" : "▶ Cümleyi oynat"}
                  </button>}
                  {encounter.source?.url && <a href={youtubeWatchUrl(encounter)} target="_blank" rel="noreferrer">{sourceActionLabel(encounter)}</a>}
                </div>
                {isPlaying && isYouTube && <SentencePlayer encounter={encounter} />}
              </article>;
            })}
          </div>}
    </section>
  </div>;
}

function App() {
  const [status, setStatus] = useState("bağlanıyor");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [items, setItems] = useState<LearningItem[]>([]);
  const [query, setQuery] = useState("");
  const [playingEncounter, setPlayingEncounter] = useState<string | null>(null);
  const [playlistItemId, setPlaylistItemId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"words" | "reader" | "encounters" | "review">("words");
  const [statusFilter, setStatusFilter] = useState<"all" | "learning" | "learned">("all");
  const [kindFilter, setKindFilter] = useState<"all" | "word" | "expression">("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [readerDiagnostic, setReaderDiagnostic] = useState<ReaderDiagnosticState | null>(null);

  useEffect(() => {
    fetch(apiBase + "/health")
      .then(r => r.json())
      .then(() => setStatus("çalışıyor"))
      .catch(() => setStatus("erişilemiyor"));

    fetch(apiBase + "/api/v1/profiles")
      .then(r => {
        if (!r.ok) throw new Error("profiles");
        return r.json();
      })
      .then(data => {
        const next = (data.profiles || []) as Profile[];
        setProfiles(next);
        const saved = localStorage.getItem("learningProfileId");
        const selected = next.find(profile => profile.id === saved)?.id || next[0]?.id || "";
        setProfileId(selected);
        if (selected) localStorage.setItem("learningProfileId", selected);
      })
      .catch(() => setProfiles([]));
  }, []);

  async function refreshItems() {
    if (!profileId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    localStorage.setItem("learningProfileId", profileId);
    try {
      const response = await fetch(apiBase + "/api/v1/learning-items?profile_id=" + encodeURIComponent(profileId));
      if (!response.ok) throw new Error("learning-items");
      const data = await response.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshItems();
  }, [profileId]);

  async function removeLearningItem(item: LearningItem) {
    const confirmed = window.confirm(`"${item.canonical_form}" ve buna ait tüm karşılaşmalar silinsin mi?`);
    if (!confirmed) return;

    const ids = item.merged_ids?.length ? item.merged_ids : [item.id];
    setDeletingItemId(item.id);
    try {
      for (const id of ids) {
        const response = await fetch(apiBase + "/api/v1/learning-items/" + encodeURIComponent(id), {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("delete failed");
      }
      setItems(current => current.filter(existing => !ids.includes(existing.id)));
      if (playingEncounter && item.encounters.some(encounter => encounter.id === playingEncounter)) {
        setPlayingEncounter(null);
      }
      if (selectedItemId && ids.includes(selectedItemId)) setSelectedItemId(null);
    } catch {
      window.alert("Kelime silinemedi. Platform API bağlantısını kontrol et.");
    } finally {
      setDeletingItemId(null);
    }
  }

  function exportWebDiagnostic() {
    const diagnosticItems = mergeLearningItems(items);
    const enrichedItems = diagnosticItems.map(item => {
      const valid = validEncounters(item);
      const validIds = new Set(valid.map(encounter => encounter.id));
      return {
        id: item.id,
        merged_ids: item.merged_ids || [item.id],
        canonical_form: item.canonical_form,
        canonical_key: item.canonical_key,
        category: item.category,
        language_specific_type: item.language_specific_type || null,
        status: item.status,
        derived_status: itemStatus(item),
        primary_meaning_tr: itemContextualMeaning(item) || null,
        alternate_meanings_tr: alternateMeanings(item),
        translations: item.translations,
        encounter_counts: {
          total_raw: item.encounters.length,
          valid: valid.length,
          text: valid.filter(encounter => sourceKind(encounter) === "text").length,
          video: valid.filter(encounter => sourceKind(encounter) !== "text").length,
        },
        valid_encounters: valid,
        excluded_encounters: item.encounters.filter(encounter => !validIds.has(encounter.id)),
        examples: item.examples,
      };
    });

    const sourceInventory = new Map<string, {
      provider: string;
      source_type: string;
      external_id: string;
      url?: string | null;
      title?: string | null;
      encounter_count: number;
    }>();
    for (const item of diagnosticItems) {
      for (const encounter of item.encounters) {
        const source = encounter.source;
        if (!source) continue;
        const key = [source.provider, source.external_id].join("|");
        const current = sourceInventory.get(key);
        if (current) {
          current.encounter_count += 1;
        } else {
          sourceInventory.set(key, {
            provider: source.provider,
            source_type: source.source_type,
            external_id: source.external_id,
            url: source.url,
            title: source.title,
            encounter_count: 1,
          });
        }
      }
    }

    const featureManifest = {
      words: {
        title: "Kelimelerim",
        features: [
          "profil seçimi",
          "arama",
          "Öğreniyorum/Biliyorum filtresi",
          "Kelime/Kalıp filtresi",
          "duplicate learning-item birleştirme",
          "bağlamsal anlamı önce gösterme",
          "diğer anlamlar",
          "metin/video karşılaşma sayaçları",
          "detay sayfası",
          "örnekleri dinleme",
          "listeden çıkarma",
        ],
      },
      detail: {
        title: "Kelime/Kalıp Detayı",
        features: [
          "bağlamsal anlam",
          "diğer anlamlar",
          "öğrenme durumu",
          "metin karşılaşmaları",
          "sarı highlight",
          "metin kaynağını açma",
          "video karşılaşmaları",
          "YouTube cümle oynatıcı",
          "kaynak/timestamp bilgisi",
        ],
      },
      reader: {
        title: "Metin Analizi",
        features: [
          "Almanca metin girişi",
          "cümlelere ayırma",
          "AI analiz",
          "cümle çevirisi",
          "kelime hover",
          "semantic group highlight",
          "bağlamsal anlam",
          "canonical yapı",
          "gramer bilgisi",
          "Öğreniyorum/Biliyorum kaydı",
          "encounter oluşturma",
        ],
      },
      encounters: {
        title: "Karşılaşmalar",
        features: [
          "arama",
          "kaynak türü ayrımı",
          "gerçek cümle",
          "bağlamsal anlam",
          "YouTube cümle oynatma",
          "Metni aç / Videoda aç",
        ],
      },
      review: {
        title: "Tekrar",
        features: [
          "kelime/kalıp kartı",
          "anlamı gizle/göster",
          "doğru encounter seçimi",
          "bağlamsal anlamı önce gösterme",
          "diğer anlamlar",
          "Tekrar et",
          "Biliyorum",
          "önceki/sonraki",
        ],
      },
    };

    const diagnostic = {
      schema_version: 1,
      exported_at: new Date().toISOString(),
      app: {
        name: "Language Learning Platform Web",
        api_base: apiBase,
        location: window.location.href,
        document_title: document.title,
      },
      runtime: {
        user_agent: navigator.userAgent,
        language: navigator.language,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          device_pixel_ratio: window.devicePixelRatio,
        },
      },
      app_state: {
        api_status: status,
        active_view: activeView,
        selected_item_id: selectedItemId,
        selected_item: selectedItem,
        profile_id: profileId,
        profiles,
        loading,
        query,
        status_filter: statusFilter,
        kind_filter: kindFilter,
        playing_encounter: playingEncounter,
        playlist_item_id: playlistItemId,
        deleting_item_id: deletingItemId,
      },
      counts: {
        raw_learning_items: items.length,
        merged_learning_items: diagnosticItems.length,
        filtered_items: filtered.length,
        total_valid_encounters: encounterCount,
        words: diagnosticItems.filter(item => item.category !== "expression").length,
        expressions: diagnosticItems.filter(item => item.category === "expression").length,
        sources: sourceInventory.size,
      },
      feature_manifest: featureManifest,
      reader_state: readerDiagnostic,
      raw_learning_items: items,
      merged_learning_items: enrichedItems,
      filtered_item_ids: filtered.map(item => item.id),
      sources: [...sourceInventory.values()],
      current_dom_snapshot: {
        text: document.querySelector(".content")?.textContent?.replace(/\s+/g, " ").trim() || "",
        buttons: [...document.querySelectorAll("button")].map(button => ({
          text: button.textContent?.replace(/\s+/g, " ").trim() || "",
          disabled: button.disabled,
          class_name: button.className,
        })),
        links: [...document.querySelectorAll("a")].map(link => ({
          text: link.textContent?.replace(/\s+/g, " ").trim() || "",
          href: link.href,
          class_name: link.className,
        })),
        inputs: [...document.querySelectorAll("input, textarea, select")].map(element => ({
          tag: element.tagName.toLowerCase(),
          type: element instanceof HTMLInputElement ? element.type : null,
          value: element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement
            ? element.value
            : null,
          placeholder: element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
            ? element.placeholder
            : null,
          class_name: element.className,
        })),
      },
    };

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadJsonFile(`Language-Learning-Web-Diagnostic-${stamp}.json`, diagnostic);
  }

  const displayItems = useMemo(() => mergeLearningItems(items), [items]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("de-DE");
    return displayItems.filter(item => {
      if (statusFilter !== "all" && itemStatus(item) !== statusFilter) return false;
      const normalizedKind = item.category === "expression" ? "expression" : "word";
      if (kindFilter !== "all" && normalizedKind !== kindFilter) return false;
      if (!needle) return true;
      const meaning = item.translations.map(t => t.meaning).join(" ");
      const sentences = [...item.encounters, ...item.examples].map(e => e.sentence).join(" ");
      return `${item.canonical_form} ${meaning} ${sentences}`.toLocaleLowerCase("de-DE").includes(needle);
    });
  }, [displayItems, query, statusFilter, kindFilter]);

  const encounterCount = displayItems.reduce((total, item) => total + validEncounters(item).length, 0);
  const selectedItem = selectedItemId
    ? displayItems.find(item => item.id === selectedItemId || item.merged_ids?.includes(selectedItemId)) || null
    : null;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">LL</div>
        <div>
          <strong>Language Learning</strong>
          <span>Platform</span>
        </div>
      </div>
      <nav>
        <button className={"nav-item " + (activeView === "words" ? "active" : "")} onClick={() => { setSelectedItemId(null); setActiveView("words"); }}><span>◫</span>Kelimelerim</button>
        <button className={"nav-item " + (activeView === "reader" ? "active" : "")} onClick={() => { setSelectedItemId(null); setActiveView("reader"); }}><span>⌁</span>Metin Analizi</button>
        <button className={"nav-item " + (activeView === "encounters" ? "active" : "")} onClick={() => { setSelectedItemId(null); setActiveView("encounters"); }}><span>▶</span>Karşılaşmalar</button>
        <button className={"nav-item " + (activeView === "review" ? "active" : "")} onClick={() => { setSelectedItemId(null); setActiveView("review"); }}><span>✓</span>Tekrar</button>
      </nav>
      <div className="sidebar-export">
        <button onClick={exportWebDiagnostic}>⇩ Web Diagnostic Export</button>
        <small>Tüm sayfalar, özellikler, öğrenme verisi ve kaynak eşleşmelerini JSON olarak dışa aktar.</small>
      </div>
      <div className="sidebar-foot">
        <span className={"status-dot " + (status === "çalışıyor" ? "ok" : "")}></span>
        Platform API {status}
      </div>
    </aside>

    <main className="content">
      {selectedItem ? <LearningItemDetailPage
          item={selectedItem}
          playingEncounter={playingEncounter}
          onTogglePlay={setPlayingEncounter}
          onBack={() => { setPlayingEncounter(null); setSelectedItemId(null); }}
        />
        : activeView === "reader" ? <SemanticReader profileId={profileId} items={items} onItemsChanged={refreshItems} onDiagnosticState={setReaderDiagnostic} />
        : activeView === "encounters" ? <EncountersPage items={displayItems} playingEncounter={playingEncounter} onTogglePlay={setPlayingEncounter} />
        : activeView === "review" ? <ReviewPage profileId={profileId} items={displayItems} onItemsChanged={refreshItems} />
        : <>
      <header className="page-head">
        <div>
          <p className="eyebrow">ÖĞRENME KÜTÜPHANESİ</p>
          <h1>Kelimelerim</h1>
          <p className="subtitle">Videolardan kaydettiğin kelime ve kalıpları, gerçek cümleleriyle birlikte tekrar et.</p>
        </div>
        {profiles.length > 0 && <label className="profile-picker">
          <span>Profil</span>
          <select value={profileId} onChange={event => setProfileId(event.target.value)}>
            {profiles.map(profile =>
              <option key={profile.id} value={profile.id}>
                {profile.source_language.toUpperCase()} → {profile.target_language.toUpperCase()}
              </option>
            )}
          </select>
        </label>}
      </header>

      <section className="stats">
        <article><strong>{displayItems.length}</strong><span>Öğrenilen öğe</span></article>
        <article><strong>{encounterCount}</strong><span>Kaydedilen karşılaşma</span></article>
        <article><strong>{displayItems.filter(item => item.category === "expression").length}</strong><span>Kalıp / ifade</span></article>
      </section>

      <section className="toolbar library-toolbar">
        <input
          aria-label="Kelimelerde ara"
          placeholder="Kelime, anlam veya cümlede ara…"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as "all" | "learning" | "learned")}>
          <option value="all">Tüm durumlar</option>
          <option value="learning">Öğreniyorum</option>
          <option value="learned">Biliyorum</option>
        </select>
        <select value={kindFilter} onChange={event => setKindFilter(event.target.value as "all" | "word" | "expression")}>
          <option value="all">Kelime + kalıp</option>
          <option value="word">Kelimeler</option>
          <option value="expression">Kalıplar</option>
        </select>
        <span>{filtered.length} öğe</span>
      </section>

      {loading && <div className="empty">Kelimeler yükleniyor…</div>}
      {!loading && !profileId && <div className="empty">Henüz bir öğrenme profili bulunamadı. Önce Chrome eklentisinden bir kelime kaydet.</div>}
      {!loading && profileId && filtered.length === 0 && <div className="empty">Bu profilde henüz eşleşen bir kelime yok.</div>}

      <section className="word-list">
        {filtered.map(item => {
          const meaning = itemContextualMeaning(item) || "Anlam henüz yok";
          const otherMeanings = alternateMeanings(item);
          const encounters = validEncounters(item);
          const textCount = encounters.filter(encounter => sourceKind(encounter) === "text").length;
          const videoCount = encounters.length - textCount;
          return <article className="word-card word-card-summary" key={item.id}>
            <div className="word-head">
              <div className="word-summary">
                <button className="word-title-link" onClick={() => setSelectedItemId(item.id)}>
                  <span className={"kind " + item.category}>{itemKindLabel(item)}</span>
                  <h2>{item.canonical_form}</h2>
                </button>
                <p className="meaning">{meaning}</p>
                {otherMeanings.length > 0 && <details className="other-meanings">
                  <summary>Diğer anlamlar</summary>
                  <div>{otherMeanings.join(" · ")}</div>
                </details>}
                <div className="word-summary-meta">
                  <span className={"learning-status " + itemStatus(item)}>
                    {itemStatus(item) === "learned" ? "Biliyorum" : "Öğreniyorum"}
                  </span>
                  {textCount > 0 && <span>▤ {textCount} metin</span>}
                  {videoCount > 0 && <span>▶ {videoCount} video</span>}
                </div>
              </div>
              <div className="word-actions">
                <button className="detail-open" onClick={() => setSelectedItemId(item.id)}>Detay →</button>
                {playlistEncounters(item.examples).length > 0 && <button
                  className="listen-examples"
                  onClick={() => {
                    setPlayingEncounter(null);
                    setPlaylistItemId(playlistItemId === item.id ? null : item.id);
                  }}
                >
                  {playlistItemId === item.id ? "Örnekleri kapat" : "▶ Örnekleri Dinle"}
                </button>}
                <button
                  className="delete-word"
                  disabled={deletingItemId === item.id}
                  onClick={() => removeLearningItem(item)}
                  title="Öğreniyorum listesinden çıkar"
                >
                  {deletingItemId === item.id ? "Siliniyor…" : "Listeden çıkar"}
                </button>
              </div>
            </div>
            {playlistItemId === item.id && <ExamplePlaylist item={item} onClose={() => setPlaylistItemId(null)} />}
          </article>;
        })}
      </section>
      </>}
    </main>
  </div>;
}

createRoot(document.getElementById("root")!).render(<App />);
