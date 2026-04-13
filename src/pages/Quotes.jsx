// src/pages/Quotes.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavTabs from "../components/NavTabs"; 
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

function loadQuotes() {
  try {
    return JSON.parse(localStorage.getItem("quotes") || "[]");
  } catch {
    return [];
  }
}

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
  const [q, setQ] = useState(loadQuotes());
  const [search, setSearch] = useState("");

  useEffect(() => {
    setQ(loadQuotes());
  }, []);

  const filtered = useMemo(() => {
    const s = (search || "").toLowerCase().trim();
    if (!s) return q;
    return q.filter((r) => (r?.ref || "").toLowerCase().includes(s));
  }, [q, search]);

  const loadRef = (ref) => {
    const item = (q || []).find((r) => r?.ref === ref);
    if (!item) return;
    // Write this quote’s inputs as the current “leanToInputs”
    if (item.inputs) {
      localStorage.setItem("leanToInputs", JSON.stringify(item.inputs));
    }
    // Ask the landing page to auto-show the plan/price on next mount
    localStorage.setItem("auto_show_quote", "1");
    nav("/quote/lean-to");
  };

  const delRef = (ref) => {
    if (!window.confirm(`Delete quote "${ref}"? This cannot be undone.`)) return;
    const remaining = (q || []).filter((r) => r?.ref !== ref);
    setQ(remaining);
    localStorage.setItem("quotes", JSON.stringify(remaining));
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
                <tr key={r.ref}>
                  <td style={td}>
                    <b>{r.ref}</b>
                  </td>
                  <td style={td}>
                    {niceDate(r.createdAt)}
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
                          loadRef(r.ref)
                        }
                        className="border rounded px-2 py-1"
                        title="Open in Lean-To"
                      >
                        Load
                      </button>
                      <button
                        onClick={() =>
                          delRef(r.ref)
                        }
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
