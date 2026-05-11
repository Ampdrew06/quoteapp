// src/pages/Quotes.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavTabs from "../components/NavTabs"; 
import { getQuotes, deleteQuote } from "../lib/quotes";
// adjust path if file structure differs


// --- Navigation tab styles (shared across pages) ---
const tabStyle = {
  padding: "6px 12px",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#f9fafb",
  textDecoration: "none",
  color: "#333",
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  transition: "all 0.15s ease",
};

const activeTabStyle = {
  ...tabStyle,
  background: "#0284c7",
  color: "#fff",
  borderColor: "#0284c7",
  fontWeight: 600,
};

const fmt = (n) => `£${Number(n || 0).toFixed(2)}`;
const niceDate = (iso) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "";
  }
};

export default function Quotes() {
  const nav = useNavigate();
  const [q, setQ] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
  let alive = true;

  async function loadAllQuotes() {
    const loaded = await getQuotes();

    if (alive) {
      setQ(Array.isArray(loaded) ? loaded : []);
    }
  }

  loadAllQuotes();

  const refresh = () => {
    loadAllQuotes();
  };

  window.addEventListener(
    "quoteapp_quotes_updated",
    refresh
  );

  return () => {
    alive = false;

    window.removeEventListener(
      "quoteapp_quotes_updated",
      refresh
    );
  };
}, []);

  const filtered = useMemo(() => {
    const s = (search || "").toLowerCase().trim();
    if (!s) return q;
    return q.filter((r) => (r?.ref || "").toLowerCase().includes(s));
  }, [q, search]);

  const loadRef = (quoteNumber) => {
  const item = (q || []).find(
    (r) => r?.quote_number === quoteNumber
  );
    if (!item) return;
    // Write this quote’s inputs as the current “leanToInputs”
    if (item.inputs_json) {
  localStorage.setItem(
    "leanToInputs",
    JSON.stringify(item.inputs_json)
  );
}
    // Ask the landing page to auto-show the plan/price on next mount
    localStorage.setItem("auto_show_quote", "1");
    nav("/quote/lean-to");
  };

  const delRef = async (id, ref) => {
  if (
    !window.confirm(
      `Delete quote "${ref}"? This cannot be undone.`
    )
  ) {
    return;
  }

  const ok = await deleteQuote(id);

  if (!ok) {
    alert("Failed to delete quote.");
  }
};

 return (
  <div style={{ fontFamily: "Inter, system-ui, Arial" }}>
    <NavTabs />

    <div
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: 16,
      }}
    >
      <h1
        style={{
          fontSize: 20,
          fontWeight: 700,
          margin: "0 0 10px",
        }}
      >
        Saved Quotes
      </h1>

      <div
        style={{
          marginBottom: 10,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Search by reference…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-2 py-1"
          style={{ minWidth: 260 }}
        />
        <div
          style={{
            color: "#6b7280",
            fontSize: 13,
          }}
        >
          {filtered.length}{" "}
          {filtered.length === 1 ? "result" : "results"}
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={th}>Ref</th>
              <th style={th}>Saved</th>
              <th style={th}>Size / Pitch</th>
              <th style={th}>Options</th>
              <th
                style={{
                  ...th,
                  textAlign: "right",
                }}
              >
                Gross
              </th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const s = r.summary || {};
              return (
                <tr key={r.quote_number}>
                  <td style={td}>
                    <b>{r.quote_number}</b>
                  </td>
                  <td style={td}>
                    {niceDate(r.created_at)}
                  </td>
                  <td style={td}>
                    {s.internalWidthMM
                      ? `${Math.round(
                          s.internalWidthMM
                        )} × ${Math.round(
                          s.internalProjectionMM
                        )} mm`
                      : "—"}
                    {typeof s.pitchDeg ===
                    "number"
                      ? ` · ${s.pitchDeg}°`
                      : ""}
                  </td>
                  <td style={td}>
                    {s.tileSystem
                      ? `${String(
                          s.tileSystem
                        ).toUpperCase()}${
                          s.tileColor
                            ? ` (${s.tileColor})`
                            : ""
                        }`
                      : "—"}
                    {s.gutterProfile
                      ? ` · ${
                          s.gutterProfile
                        }/${
                          s.gutterColor ||
                          "-"
                        }`
                      : ""}
                  </td>
                  <td
                    style={{
                      ...td,
                      textAlign: "right",
                    }}
                  >
                    {fmt(r.gross)}
                  </td>
                  <td style={td}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <button
                        onClick={() =>
                          loadRef(r.quote_number)
                        }
                        className="border rounded px-2 py-1"
                        title="Open in Lean-To"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => delRef(r.id, r.quote_number)}
                        className="border rounded px-2 py-1"
                        style={{
                          borderColor:
                            "#ef4444",
                          color: "#ef4444",
                        }}
                        title="Delete this quote"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  style={td}
                  colSpan={6}
                >
                  &mdash; No quotes saved
                  yet &mdash;
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
}

const th = { border: "1px solid #ddd", padding: "6px 8px", textAlign: "left" };
const td = { border: "1px solid #ddd", padding: "6px 8px", verticalAlign: "top" };
