import { useCallback, useMemo, useState } from "react";

import "./style.css";

const TIME_PERIODS = [
  "ALL_TIME",
  "ONE_MONTH",
  "ONE_YEAR",
  "POST_BAN",
  "SIX_MONTHS",
  "THREE_MONTHS",
];

const fetchCommanderStats = async ({ name, eventSize, timePeriod }) => {
  const query = `
    query CommanderCards($name: String!, $eventSize: Int!) {
      commander(name: $name) {
        entries(
          sortBy: TOP
          filters: { minEventSize: $eventSize, timePeriod: ${timePeriod} }
        ) {
          edges {
            node {
              standing
              tournament { size }
              maindeck { 
                name
                cardPreviewImageUrl
              }
            }
          }
        }
      }
    }
  `;
  const res = await fetch("https://edhtop16.com/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { name, eventSize } }),
  });
  if (!res.ok) throw new Error(`Network error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors?.[0]?.message || "Unknown GraphQL error");
  return json.data?.commander?.entries?.edges ?? [];
}

const computeCardScores = (edges) => {
  const tally = new Map();
  edges.forEach((n) => {
    const node = n.node;
    const size = node?.tournament?.size ?? 0;
    const standing = node?.standing ?? size;
    const performance = size > 0 ? 1 - standing / size : 0;
    (node?.maindeck ?? []).forEach(c => {
      const name = c?.name;
      const prev = tally.get(name) || { score: 0, preview: c.cardPreviewImageUrl || "" };
      tally.set(name, { score: prev.score + performance, preview: prev.preview || c.cardPreviewImageUrl || "" });
    })
  })
  return Array.from(tally, ([name, { score, preview }]) => ({ name, score, preview })).sort((a, b) => b.score - a.score);
}

export default function App() {
  const [form, setForm] = useState({ name: "", eventSize: "", timePeriod: "ONE_MONTH" });
  const [copyCount, setCopyCount] = useState(99);
  const [hover, setHover] = useState({ visible: false, url: "", x: 0, y: 0 });
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = useCallback(async (params) => {
    setError("");
    setLoading(true);
    setEdges([]);
    try {
      const data = await fetchCommanderStats(params);
      setEdges(data);
    } catch (e) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setEdges([]);
    setError("");
  }, []);

  const scores = useMemo(() => computeCardScores(edges), [edges]);

  const updateForm = (k) => (e) => {
    const v = e.target.value;
    setForm((f) => ({
      ...f,
      [k]: v,
    }));
  };

  const onAnalyze = (e) => {
    e?.preventDefault?.();
    analyze({
      name: document.getElementById("cardName").value.trim(),
      eventSize: Math.max(1, Number(form.eventSize) || 1),
      timePeriod: form.timePeriod,
    });
  };

  const copyToClipboard = async () => {
    const n = Math.max(1, Math.min(scores.length, Number(copyCount) || 1));
    const list = scores.slice(0, n).map((c) => `1 ${c.name}`).join("\n");
    const finalText = `${list}\n\n1 ${document.getElementById("cardName").value.trim()}`;
    try { await navigator.clipboard.writeText(finalText); } catch { }
  };

  return (
    <div
      className="app"
      onMouseMove={(e) => {
        if (hover.visible) setHover((h) => ({ ...h, x: e.clientX + 16, y: e.clientY + 16 }));
      }}
    >
      <div className="container">
        <header className="header">
          <div className="title">Commander Card Performance</div>
          <div className="pill">
            {form.timePeriod.replaceAll("_", " ").toLowerCase()} • Events ≥ {form.eventSize}
          </div>
        </header>

        <form className="search" onSubmit={onAnalyze}>
          <input
            placeholder="Type a commander name…"
            className="input"
            id="cardName"
          />

          <input
            type="number"
            step={1}
            list="event-sizes"
            value={form.eventSize}
            onChange={updateForm("eventSize")}
            placeholder="Type a minimum tournament size here..."
            className="input"
            title="Minimum event size"
            id="eventSize"
          />

          <select
            onChange={updateForm("timePeriod")}
            className="input"
            title="Time period"
            id="timePeriod"
            value={form.timePeriod}
          >
            {TIME_PERIODS.map((tp) => (
              <option key={tp} value={tp}>{tp.replaceAll("_", " ").toLowerCase()}</option>
            ))}
          </select>

          <button className="btn" disabled={loading}>
            {loading ? "Loading…" : "Analyze"}
          </button>
          <button type="button" className="btn btn-outline" onClick={reset}>
            Reset
          </button>
        </form>

        <div className="status">
          {loading && <span>Fetching results…</span>}
          {!loading && edges.length > 0 && (
            <span>
              Found <strong>{edges.length}</strong> event entries.
            </span>
          )}
        </div>

        {error && <div className="error">⚠️ {error}</div>}

        {scores.length > 0 && (
          <div className="copy-row">
            <label className="copy-label" htmlFor="copyCount">Top</label>
            <input
              type="number"
              min={1}
              value={copyCount}
              onChange={(e) => setCopyCount(e.target.value)}
              className="input small"
              title="Number of cards to copy"
              id="copyCount"
            />
            <button type="button" className="btn" onClick={copyToClipboard} id="copyButton">
              Copy Top {Math.max(1, Number(copyCount) || 1)}
            </button>
          </div>
        )}

        <section className="card">
          <div className="card-title">All Cards Ranked</div>
          {scores.length === 0 ? (
            <div className="muted">No results yet. Search for a commander above.</div>
          ) : (
            <ol className="plain-list">
              {scores.map((card, i) => (
                <li
                  key={card.name}
                  className="plain-item"
                  onMouseEnter={() => setHover((h) => ({ ...h, visible: true, url: card.preview }))}
                  onMouseLeave={() => setHover(() => ({ visible: false }))}
                >
                  <span className="rank">#{i + 1}</span>
                  <span className="name">{card.name}</span>
                  <span className="score">{(card.score).toFixed(3)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {hover.visible && hover.url && (
        <div className="preview-pop" style={{ left: hover.x, top: hover.y }}>
          <img src={hover.url} alt="Card preview" />
        </div>
      )}
    </div>
  );
}