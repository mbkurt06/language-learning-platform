import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

type Provider = { id: string; languages: string[]; capabilities: string[] };

function App() {
  const [status, setStatus] = useState("bağlanıyor");
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    fetch(apiBase + "/health").then(r => r.json()).then(() => setStatus("çalışıyor")).catch(() => setStatus("erişilemiyor"));
    fetch(apiBase + "/api/v1/providers").then(r => r.json()).then(data => setProviders(data.providers || [])).catch(() => setProviders([]));
  }, []);

  return <main>
    <header>
      <p className="eyebrow">LOCAL PLATFORM FOUNDATION</p>
      <h1>Dil öğrenme merkezi</h1>
      <p>Chrome, web ve mobil istemcilerin paylaşacağı öğrenme verisi için ilk platform arayüzü.</p>
    </header>
    <section className="card">
      <h2>Platform API</h2>
      <p>Durum: <strong>{status}</strong></p>
    </section>
    <section className="card">
      <h2>İçerik sağlayıcıları</h2>
      <div className="grid">{providers.map(provider =>
        <article key={provider.id}>
          <strong>{provider.id.toUpperCase()}</strong>
          <span>{provider.languages.join(", ")}</span>
          <small>{provider.capabilities.join(" · ")}</small>
        </article>
      )}</div>
    </section>
    <section className="card muted">
      <h2>Sıradaki dikey dilim</h2>
      <p>YouTube/Chrome'da “Öğren” → PostgreSQL → Web'de aynı learning item → başka içerikte lemma/kalıp eşleşmesi.</p>
    </section>
  </main>;
}

createRoot(document.getElementById("root")!).render(<App />);
