"use client";

import { useCallback, useEffect, useState } from "react";
import {
  countMissingEmbeddings,
  embedMissing,
  type MissingCounts,
} from "@/app/actions/embed";

const SOURCE_LABELS: Record<string, string> = {
  insight: "Innsikter",
  quick_note: "Notater",
  story: "Historier",
  resource: "Ressurser",
};

export function EmbeddingsPanel() {
  const [counts, setCounts] = useState<MissingCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string>("");

  const refresh = useCallback(async () => {
    setLoading(true);
    const c = await countMissingEmbeddings();
    setCounts(c);
    setLoading(false);
  }, []);

  // Initial load: await before touching state so we don't setState
  // synchronously inside the effect body.
  useEffect(() => {
    let active = true;
    (async () => {
      const c = await countMissingEmbeddings();
      if (!active) return;
      setCounts(c);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function runBackfill() {
    setRunning(true);
    setLog("");
    let totalEmbedded = 0;
    let totalErrors = 0;
    // Loop the batched server action until nothing remains.
    for (let i = 0; i < 200; i++) {
      const res = await embedMissing(20);
      totalEmbedded += res.embedded;
      totalErrors += res.errors;
      setLog(`Embedet ${totalEmbedded} · feil ${totalErrors} · gjenstår ${res.remaining}`);
      if (res.attempted === 0 || (res.remaining === 0 && res.embedded === 0 && res.errors === 0)) break;
      if (res.attempted === 0) break;
      if (res.remaining === 0) break;
    }
    setRunning(false);
    await refresh();
  }

  return (
    <section className="[max-width:760px]">
      <p className="[font-size:14px] [color:#4d4d4d] [line-height:1.65] [margin-bottom:20px]">
        Søkeindeksen lages automatisk når du lagrer. Hvis OpenAI var utilgjengelig
        ved lagring, kan rader mangle vektor. Her kan du fylle hullene.
      </p>

      {loading || !counts ? (
        <p className="[font-size:14px] [color:#808080]">Teller…</p>
      ) : (
        <div className="[display:flex] [flex-direction:column] [gap:8px] [margin-bottom:24px]">
          {(["insight", "quick_note", "story", "resource"] as const).map((k) => (
            <div
              key={k}
              className="[display:flex] [justify-content:space-between] [padding:10px_14px] [background:#f7f6f0] [border:1px_solid_#e6e6e6] [border-radius:8px] [font-size:14px]"
            >
              <span>{SOURCE_LABELS[k]}</span>
              <span style={{ fontWeight: 600, color: counts[k] > 0 ? "#a83f34" : "#0e7c66" }}>
                {counts[k] > 0 ? `${counts[k]} mangler` : "fullt indeksert"}
              </span>
            </div>
          ))}
          <div className="[display:flex] [justify-content:space-between] [padding:10px_14px] [font-size:14px] [font-weight:600]">
            <span>Totalt manglende</span>
            <span>{counts.total}</span>
          </div>
        </div>
      )}

      <div className="[display:flex] [gap:8px] [align-items:center]">
        <button
          type="button"
          onClick={runBackfill}
          disabled={running || loading || (counts?.total ?? 0) === 0}
          className="[padding:10px_18px] [font-size:14px] [font-weight:600] [color:#fff] [border:none] [border-radius:6px] [cursor:pointer]"
          style={{ background: running || (counts?.total ?? 0) === 0 ? "#9a9a9a" : "#1f42aa" }}
        >
          {running ? "Indekserer…" : "Embed manglende rader"}
        </button>
        <button
          type="button"
          onClick={refresh}
          disabled={running}
          className="[padding:10px_18px] [font-size:14px] [font-weight:600] [color:#1f42aa] [background:transparent] [border:1px_solid_#1f42aa] [border-radius:6px] [cursor:pointer]"
        >
          Oppdater
        </button>
      </div>

      {log && <p className="[font-size:13px] [color:#4d4d4d] [margin-top:14px]">{log}</p>}
    </section>
  );
}
