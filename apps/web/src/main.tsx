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
  encounters: Encounter[];
};

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

function SentencePlayer({ encounter, onComplete }: { encounter: Encounter; onComplete?: () => void }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const completedRef = useRef(false);
  const completionTimerRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);

  const source = encounter.source;
  const startMs = Math.max(0, encounter.media_timestamp_ms || 0);
  const rawEndMs = encounter.media_end_timestamp_ms || startMs + 5000;
  const endMs = Math.max(startMs + 500, rawEndMs);
  const durationMs = endMs - startMs;
  const freezeAtMs = Math.max(startMs, endMs - 120);

  useEffect(() => {
    if (!mountRef.current || !source || source.provider !== "youtube") return;

    completedRef.current = false;
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
            if (onComplete) {
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
  }, [source?.external_id, source?.provider, startMs, endMs, freezeAtMs, durationMs, onComplete]);

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
  const examples = useMemo(() => playlistEncounters(item.encounters), [item.encounters]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= examples.length) setIndex(0);
  }, [examples.length, index]);

  const current = examples[index];
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

    <SentencePlayer
      encounter={current}
      onComplete={index < examples.length - 1 ? () => setIndex(value => value + 1) : undefined}
    />

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

  useEffect(() => {
    if (!profileId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    localStorage.setItem("learningProfileId", profileId);
    fetch(apiBase + "/api/v1/learning-items?profile_id=" + encodeURIComponent(profileId))
      .then(r => {
        if (!r.ok) throw new Error("learning-items");
        return r.json();
      })
      .then(data => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [profileId]);

  async function removeLearningItem(item: LearningItem) {
    const confirmed = window.confirm(`"${item.canonical_form}" ve buna ait tüm karşılaşmalar silinsin mi?`);
    if (!confirmed) return;

    setDeletingItemId(item.id);
    try {
      const response = await fetch(apiBase + "/api/v1/learning-items/" + encodeURIComponent(item.id), {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("delete failed");
      setItems(current => current.filter(existing => existing.id !== item.id));
      if (playingEncounter && item.encounters.some(encounter => encounter.id === playingEncounter)) {
        setPlayingEncounter(null);
      }
    } catch {
      window.alert("Kelime silinemedi. Platform API bağlantısını kontrol et.");
    } finally {
      setDeletingItemId(null);
    }
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("de-DE");
    if (!needle) return items;
    return items.filter(item => {
      const meaning = item.translations.map(t => t.meaning).join(" ");
      const sentences = item.encounters.map(e => e.sentence).join(" ");
      return `${item.canonical_form} ${meaning} ${sentences}`.toLocaleLowerCase("de-DE").includes(needle);
    });
  }, [items, query]);

  const encounterCount = items.reduce((total, item) => total + item.encounters.length, 0);

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
        <button className="nav-item active"><span>◫</span>Kelimelerim</button>
        <button className="nav-item" disabled><span>▶</span>Karşılaşmalar</button>
        <button className="nav-item" disabled><span>✓</span>Tekrar</button>
      </nav>
      <div className="sidebar-foot">
        <span className={"status-dot " + (status === "çalışıyor" ? "ok" : "")}></span>
        Platform API {status}
      </div>
    </aside>

    <main className="content">
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
        <article><strong>{items.length}</strong><span>Öğrenilen öğe</span></article>
        <article><strong>{encounterCount}</strong><span>Kaydedilen karşılaşma</span></article>
        <article><strong>{items.filter(item => item.category === "expression").length}</strong><span>Kalıp / ifade</span></article>
      </section>

      <section className="toolbar">
        <input
          aria-label="Kelimelerde ara"
          placeholder="Kelime, anlam veya cümlede ara…"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <span>{filtered.length} öğe</span>
      </section>

      {loading && <div className="empty">Kelimeler yükleniyor…</div>}
      {!loading && !profileId && <div className="empty">Henüz bir öğrenme profili bulunamadı. Önce Chrome eklentisinden bir kelime kaydet.</div>}
      {!loading && profileId && filtered.length === 0 && <div className="empty">Bu profilde henüz eşleşen bir kelime yok.</div>}

      <section className="word-list">
        {filtered.map(item => {
          const meaning = item.translations.find(t => t.language === "tr")?.meaning || item.translations[0]?.meaning || "Anlam henüz yok";
          return <article className="word-card" key={item.id}>
            <div className="word-head">
              <div>
                <span className={"kind " + item.category}>{item.category === "expression" ? "KALIP" : "KELİME"}</span>
                <h2>{item.canonical_form}</h2>
                <p className="meaning">{meaning}</p>
              </div>
              <div className="word-actions">
                <span className="encounter-badge">{item.encounters.length} karşılaşma</span>
                {playlistEncounters(item.encounters).length > 0 && <button
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

            {item.encounters.length === 0
              ? <p className="no-encounter">Bu öğe eski kayıtlardan geldi; henüz kaynak cümlesi yok.</p>
              : <div className="encounters">
                {item.encounters.map(encounter => {
                  const isYouTube = encounter.source?.provider === "youtube";
                  const isPlaying = playingEncounter === encounter.id;
                  return <div className="encounter" key={encounter.id}>
                    <div className="source-row">
                      <span className="source-pill">{encounter.source?.provider === "youtube" ? "YouTube" : encounter.source?.provider || "Kaynak"}</span>
                      <strong>{encounter.source?.title || encounter.source?.url || "Kaynak"}</strong>
                      {encounter.media_timestamp_ms != null && <span className="timestamp">{clock(encounter.media_timestamp_ms)}</span>}
                    </div>
                    <blockquote>{encounter.sentence}</blockquote>
                    <div className="actions">
                      {isYouTube && <button className="primary" onClick={() => setPlayingEncounter(isPlaying ? null : encounter.id)}>
                        {isPlaying ? "Durdur" : "▶ Cümleyi dinle"}
                      </button>}
                      {encounter.source?.url && <a href={youtubeWatchUrl(encounter)} target="_blank" rel="noreferrer">Videoda aç ↗</a>}
                    </div>
                    {isPlaying && isYouTube && <SentencePlayer encounter={encounter} />}
                  </div>;
                })}
              </div>}
          </article>;
        })}
      </section>
    </main>
  </div>;
}

createRoot(document.getElementById("root")!).render(<App />);
