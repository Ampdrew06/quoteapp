import {Link} from 'react-router-dom';
import {isAdminUser} from '../lib/userRole';
import {setJobScheduleIncluded} from '../lib/schedule';
import {isDoubleEdwardianQuote} from '../lib/Calculations/doubleEdwardianQuotation';
import {isCombinationQuote} from '../lib/Calculations/combinationQuotation';
import {isVictorianHippedQuote} from '../lib/Calculations/victorianHippedQuotation';
import {quoteStyleLabel} from '../lib/quoteStyleLabel';
import {isVictorianFiveQuote} from '../lib/Calculations/victorianFiveQuotation';
import {isVictorianQuote} from '../lib/Calculations/victorianQuotation';
import {isEdwardianQuote} from '../lib/Calculations/edwardianQuotation';
import {activateDesignRecord} from '../lib/activeDesignRecord';
import {isGableQuote} from '../lib/Calculations/gableQuotation';
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
  const [scheduleBusy,setScheduleBusy]=useState(null),[scheduleMessage,setScheduleMessage]=useState('');
  const toggleSchedule=async(job,included)=>{
    if(scheduleBusy)return;setScheduleBusy(job.id);setScheduleMessage('');
    try{const updated=await setJobScheduleIncluded(job,included);setQ(old=>old.map(r=>r.id===job.id?{...r,schedule_included:updated.schedule_included}:r));setScheduleMessage(`Job ${job.job_number||job.quote_number} ${included?'included in':'removed from'} Schedule. Saved Schedule details are retained.`);}
    catch(e){setScheduleMessage('Schedule selection not saved: '+e.message);}
    finally{setScheduleBusy(null);}
  };

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
    activateDesignRecord(item);
    if(isDoubleEdwardianQuote(item)){nav("/quote/double-edwardian");return;}
    if(isCombinationQuote(item)){nav("/quote/combination/plan-manufacture");return;}
    if(isVictorianHippedQuote(item)){nav("/quote/victorian-hipped/plan-manufacture");return;}
    if(isVictorianFiveQuote(item)){nav("/quote/victorian-five/plan-manufacture");return;}
    if(isVictorianQuote(item)){nav("/quote/victorian/plan-manufacture");return;}
    if(isEdwardianQuote(item)){nav("/quote/edwardian/plan-manufacture");return;}
    if(isGableQuote(item)) {
      localStorage.setItem("gableDesignPreviewInputs",JSON.stringify(item.inputs_json||{}));
      
      nav("/quote/gable/plan-manufacture");
      return;
    }

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

  activateDesignRecord({...quote,...updated,inputs_json:updated.inputs_json||quote.inputs_json});

  alert(`Quote ${quote.quote_number} converted to Job ${jobNumber}.`);

  if(isDoubleEdwardianQuote(quote)){nav("/quote/double-edwardian");return;}
  if(isCombinationQuote(quote)){nav("/quote/combination/plan-manufacture");return;}
  if(isVictorianHippedQuote(quote)){nav("/quote/victorian-hipped/plan-manufacture");return;}
  if(isVictorianFiveQuote(quote)){nav("/quote/victorian-five/plan-manufacture");return;}
  if(isVictorianQuote(quote)){nav("/quote/victorian/plan-manufacture");return;}
  if(isEdwardianQuote(quote)){nav("/quote/edwardian/plan-manufacture");return;}
  if(isGableQuote(quote)) {
    localStorage.setItem("gableDesignPreviewInputs",JSON.stringify(quote.inputs_json||{}));
    
    nav("/quote/gable/plan-manufacture");
  } else nav("/quote/lean-to/plan-manufacture");
};
  return (
    <div style={{ fontFamily: "Inter, system-ui, Arial" }}>
      <NavTabs />

      <div className="app-page-content" style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
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

        {isAdminUser()&&<p style={{fontSize:13,color:'#475569'}}>Tick <b>Include in Schedule</b> for real orders. Converted test jobs stay off the Schedule until selected. Unticking hides the job and its totals; saved Schedule details remain available when re-included. <Link to="/schedule">Open Schedule</Link></p>}
        {scheduleMessage&&<p role="status" style={{padding:10,background:'#edf6f7'}}>{scheduleMessage}</p>}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={th}>Job No</th>
                <th style={th}>Quote No</th>
                <th style={th}>Customer</th>
                <th style={th}>Reference</th>
                <th style={th}>Delivery Date</th>
                <th style={th}>Style</th>
                {isAdminUser()&&<th style={th}>Schedule</th>}
                <th style={th} aria-label="Job controls"></th>
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

                    <td style={td}>{quoteStyleLabel(r)}</td>

                    {isAdminUser()&&<td style={td}><label style={{display:'flex',gap:6,alignItems:'center',whiteSpace:'nowrap'}}><input type="checkbox" checked={r.schedule_included===true} disabled={scheduleBusy!==null} onChange={e=>toggleSchedule(r,e.target.checked)} aria-label={`Include job ${r.job_number||r.quote_number} in Schedule`}/>Include in Schedule</label></td>}
                    <td style={td}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          onClick={() => {
  
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
                  <td style={td} colSpan={isAdminUser()?8:7}>
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