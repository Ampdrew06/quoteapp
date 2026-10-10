import React from 'react';
import { buildSummaryIdiotList } from '../lib/Calculations/summaryIdiotList';

export default function SummaryIdiotList({ model, materials, inputs = {}, checklist: suppliedChecklist }) {
  const checklist = suppliedChecklist || buildSummaryIdiotList(model, materials);
  const names = { assemblies:'Manufactured components', timber:'Timber / manufacture stock', tiles:'Tiles', plastics:'Plastics', metal:'Metal / assembly check', gutters:'Guttering', misc:'Miscellaneous / loose fixings' };
  const plastics = inputs.plasticsColor ?? inputs.plastics_color ?? 'White';
  const gutterColour = inputs.gutterColor ?? inputs.gutter_color ?? 'White';
  const tileSystem = inputs.tileSystem ?? inputs.tile_system ?? '';
  const tileColour = inputs.tileColor ?? inputs.tileColour ?? inputs.tile_colour ?? '';
  return <div className="summary-idiot-list">
    <h2>Idiot List / Despatch Checklist</h2>
    <div className="sil-details"><b>Customer:</b> {inputs.customerName ?? inputs.customer_name ?? '—'} · <b>Reference:</b> {inputs.quoteRef ?? inputs.quote_ref ?? inputs.ref ?? '—'}</div>
    <div className="sil-details"><b>Tiles:</b> {tileSystem} {tileColour} · <b>Plastics:</b> {plastics} · <b>Gutters:</b> {gutterColour} {inputs.gutterProfile ?? inputs.gutter_profile ?? ''}</div>
    <div className="sil-details"><b>Installed roof weight, including plasterboard:</b> {checklist.installedWeightKg.toFixed(1)} kg</div>
    <div className="sil-note">Timber stock and fitted hardware are manufacture checks. Loose materials and site fixings must be packed. Factory glue, screws, rivets and vent machining are omitted. Plasterboard is supplied only when explicitly added.</div>
    <div className="sil-grid">{[['assemblies','timber','misc'],['tiles','plastics','metal','gutters']].map((keys, column) =>
      <div className="sil-column" key={column}>{keys.map(key => checklist.sections[key]?.length > 0 &&
        <section className="sil-box" key={key}><h3>{names[key]}</h3>{checklist.sections[key].map((row, index) =>
          <div className="sil-row" key={`${row.key}-${index}`}><span className="sil-tick">☐</span><span className="sil-item">{row.item}</span><b className="sil-qty">{Number(row.qty.toFixed(3))} {row.units}</b></div>)}</section>)}</div>)}</div>
    <div className="sil-signoff">Checked by: ____________________ &nbsp; Date: ______________</div>
    <style>{`
      .summary-idiot-list { font-family: Arial, sans-serif; font-size: 12px; color: #111827; padding: 3mm 2mm; }
      .summary-idiot-list h2 { font-size: 16px; margin: 0 0 8px; }
      .sil-details { font-size: 11px; margin-bottom: 5px; overflow-wrap: anywhere; }
      .sil-note { font-size: 10px; color: #475569; margin: 8px 0; line-height: 1.3; }
      .sil-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: start; }
      .sil-column { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
      .sil-box { border: 1px solid #94a3b8; padding: 7px; break-inside: avoid; }
      .sil-box h3 { font-size: 12px; margin: 0 0 5px; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; }
      .sil-row { display: flex; gap: 5px; padding: 3px 0; border-bottom: 1px dashed #ddd; line-height: 1.2; }
      .sil-row:last-child { border-bottom: 0; }
      .sil-tick { flex: 0 0 12px; }
      .sil-item { flex: 1; min-width: 0; overflow-wrap: anywhere; }
      .sil-qty { max-width: 95px; overflow-wrap: anywhere; text-align: right; font-size: 11px; }
      .sil-signoff { margin-top: 12px; font-size: 12px; }
      @media print { .sil-grid { grid-template-columns: 1fr 1fr; } }
    `}</style>
  </div>;
}
