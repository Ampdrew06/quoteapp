// src/pages/Quotes.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavTabs from "../components/NavTabs";
import {
  getQuotes,
  deleteQuote,
  updateQuote,
  getNextJobNumber,
} from "../lib/quotes";

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

    window.addEventListener("quoteapp_quotes_updated", refresh);

    return () => {
      alive = false;
      window.removeEventListener("quoteapp_quotes_updated", refresh);
    };
  }, []);

  const filtered = useMemo(() => {
    const s = (search || "").toLowerCase().trim();

    const jobsOnly = (q || []).filter((r) => r.status === "converted_to_job");

if (!s) return jobsOnly;

    return jobsOnly.filter((r) => {
      return (
        String(r?.quote_number || "").toLowerCase().includes(s) ||
        String(r?.customer_name || "").toLowerCase().includes(s) ||
        String(r?.manual_reference || "").toLowerCase().includes(s)
      );
    });
  }, [q, search]);

  const loadRef = (quoteNumber) => {
    const item = (q || []).find((r) => r?.quote_number === quoteNumber);
    if (!item) return;

    if (item.inputs_json) {
      localStorage.setItem("leanToInputs", JSON.stringify(item.inputs_json));
    }

    localStorage.setItem("auto_show_quote", "1");
    nav("/quote/lean-to");
  };

  const delRef = async (id, ref) => {
    if (!window.confirm(`Delete quote "${ref}"? This cannot be undone.`)) {
      return;
    }

    const ok = await deleteQuote(id);

    if (!ok) {
      alert("Failed to delete quote.");
    }
  };
const convertToJob = async (quote) => {
  if (!quote?.id) return;

  if (
    !window.confirm(
      `Convert quote ${quote.quote_number} to a job?`
    )
  ) {
    return;
  }

  const jobNumber = await getNextJobNumber();

  const updated = await updateQuote(quote.id, {
    job_number: jobNumber,
    status: "converted_to_job",
    converted_to_job_at: new Date().toISOString(),
  });

  if (!updated) {
    alert("Failed to convert quotation to job.");
    return;
  }

  localStorage.setItem("active_job_id", updated.id);

  alert(`Quote ${quote.quote_number} converted to Job ${jobNumber}.`);

  nav("/quote/lean-to/plan-manufacture");
};
  return (
    <div style={{ fontFamily: "Inter, system-ui, Arial" }}>
      <NavTabs />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>
          Jobs
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
            placeholder="Search quote, customer or reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-2 py-1"
            style={{ minWidth: 300 }}
          />

          <div style={{ color: "#6b7280", fontSize: 13 }}>
            {filtered.length} {filtered.length === 1 ? "result" : "results"}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={th}>Job No</th>
                <th style={th}>Quote No</th>
                <th style={th}>Customer</th>
                <th style={th}>Reference</th>
                <th style={th}>Delivery Date</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {(filtered || []).map((r) => {
                const created = r.created_at ? niceDate(r.created_at) : "—";

                return (
                  <tr key={r.id || r.quote_number}>
                    <td style={td}>
  <b>{r.job_number || "—"}</b>
</td>

<td style={td}>{r.quote_number || "—"}</td>

<td style={td}>{r.customer_name || "Retail Customer"}</td>

<td style={td}>{r.manual_reference || "—"}</td>

<td style={td}>
  {r.requested_delivery_date || "—"}
</td>

                    <td style={td}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: 999,
                          background:
                            r.status === "converted_to_job"
                              ? "#dcfce7"
                              : "#dbeafe",
                          color:
                            r.status === "converted_to_job"
                              ? "#166534"
                              : "#1d4ed8",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {r.status || "quote"}
                      </span>
                    </td>

                    <td style={td}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          onClick={() => {
  localStorage.setItem("active_job_id", r.id);
  loadRef(r.quote_number);
}}
                          className="border rounded px-2 py-1"
                          title="Edit this quotation"
                        >
                          Open Manufacture Book
                        </button>
{r.status !== "converted_to_job" && (
  <button
    onClick={() => convertToJob(r)}
    className="border rounded px-2 py-1"
    title="Convert this quotation to a job"
  >
    Convert
  </button>
)}
                        <button
                          onClick={() => delRef(r.id, r.quote_number)}
                          className="border rounded px-2 py-1"
                          style={{
                            borderColor: "#ef4444",
                            color: "#ef4444",
                          }}
                          title="Delete this quotation"
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
                  <td style={td} colSpan={6}>
                    &mdash; No quotations saved yet &mdash;
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

const th = {
  border: "1px solid #ddd",
  padding: "6px 8px",
  textAlign: "left",
};

const td = {
  border: "1px solid #ddd",
  padding: "6px 8px",
  verticalAlign: "top",
};