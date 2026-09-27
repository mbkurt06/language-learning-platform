import React, { useEffect, useMemo, useState } from "react";
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

function youtubeEmbedUrl(encounter: Encounter) {
  const source = encounter.source;
  if (!source || source.provider !== "youtube") return null;
  const start = seconds(encounter.media_timestamp_ms);
  const end = Math.max(start + 1, Math.ceil((encounter.media_end_timestamp_ms || 0) / 1000));
  return `https://www.youtube.com/embed/${encodeURIComponent(source.external_id)}?start=${start}&end=${end}&autoplay=1&rel=0`;
}

function App() {
  const [status, setStatus] = useState("bağlanıyor");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [items, setItems] = useState<LearningItem[]>([]);
  const [query, setQuery] = useState("");
  const [playingEncounter, setPlayingEncounter] = useState<string | null>(null);
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

            {item.encounters.length === 0
              ? <p className="no-encounter">Bu öğe eski kayıtlardan geldi; henüz kaynak cümlesi yok.</p>
              : <div className="encounters">
                {item.encounters.map(encounter => {
                  const embed = youtubeEmbedUrl(encounter);
                  const isPlaying = playingEncounter === encounter.id;
                  return <div className="encounter" key={encounter.id}>
                    <div className="source-row">
                      <span className="source-pill">{encounter.source?.provider === "youtube" ? "YouTube" : encounter.source?.provider || "Kaynak"}</span>
                      <strong>{encounter.source?.title || encounter.source?.url || "Kaynak"}</strong>
                      {encounter.media_timestamp_ms != null && <span className="timestamp">{clock(encounter.media_timestamp_ms)}</span>}
                    </div>
                    <blockquote>{encounter.sentence}</blockquote>
                    <div className="actions">
                      {embed && <button className="primary" onClick={() => setPlayingEncounter(isPlaying ? null : encounter.id)}>
                        {isPlaying ? "Durdur" : "▶ Cümleyi dinle"}
                      </button>}
                      {encounter.source?.url && <a href={youtubeWatchUrl(encounter)} target="_blank" rel="noreferrer">Videoda aç ↗</a>}
                    </div>
                    {isPlaying && embed && <div className="player-wrap">
                      <iframe
                        src={embed}
                        title={`${item.canonical_form} cümle tekrarı`}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    </div>}
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
