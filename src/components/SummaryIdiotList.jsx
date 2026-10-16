import React from 'react';
import { buildSummaryIdiotList } from '../lib/Calculations/summaryIdiotList';

export default function SummaryIdiotList({ model, materials, inputs = {}, checklist: suppliedChecklist, compact = false }) {
  const checklist = suppliedChecklist || buildSummaryIdiotList(model, materials);
  const names = { assemblies:'Manufactured components', laths:'Loose laths', timber:'Timber', tiles:'Tiles', plastics:'Plastics', metal:'Metal accessories', gutters:'Guttering', misc:'Miscellaneous' };
  const plastics = inputs.plasticsColor ?? inputs.plastics_color ?? 'White';
  const gutterColour = inputs.gutterColor ?? inputs.gutter_color ?? 'White';
  const tileSystem = inputs.tileSystem ?? inputs.tile_system ?? '';
  const tileColour = inputs.tileColor ?? inputs.tileColour ?? inputs.tile_colour ?? '';
  const tileName=({britmetShingle:'Britmet',metrotileShingle:'Metrotile',liteSlate:'LiteSlate',tapcoSlate:'TapcoSlate'})[tileSystem]||tileSystem;
  if(compact)return <div className="summary-idiot-list sil-compact">
    <div className="sil-compact-title"><h2>Roof Checklist</h2><span>{inputs.widthMM} × {inputs.projMM}mm · {inputs.pitchDeg}° · {tileName} {tileColour}</span></div>
    <div className="sil-compact-meta">{inputs.customerName||'—'} · {inputs.quoteRef||'—'} · Plastics: {plastics} · Gutters: {gutterColour} {inputs.gutterProfile||''} · {checklist.installedWeightKg.toFixed(1)}kg incl. plasterboard{checklist.weightProvisional?' · weight review pending':''}</div>
    <table className="sil-compact-table"><tbody>{['assemblies','laths','timber','tiles','plastics','metal','gutters','misc'].flatMap(key=>checklist.sections[key]?.length>0?[
      <tr key={key} className="sil-section-title"><th colSpan="3">{names[key]}</th></tr>,
      ...checklist.sections[key].map((row,index)=><tr key={`${key}-${index}`} className={row.informational?'sil-information':''}><td className="sil-compact-tick">{row.informational?'—':'☐'}</td><td>{row.item}</td><td className="sil-compact-qty">{row.displayQty??`${Number(row.qty.toFixed(3))} ${row.units}`}</td></tr>)
    ]:[])}</tbody></table>
    <div className="sil-signoff">Checked by: ____________________ &nbsp; Date: ______________</div>
    <style>{`.sil-compact{font-family:Arial,sans-serif;font-size:11px;padding:0;color:#111827}.sil-compact-title{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:4px}.sil-compact-title h2{font-size:16px;margin:0!important;white-space:nowrap}.sil-compact-title span{font-size:10px;text-align:right}.sil-compact-meta{font-size:10px;margin-bottom:6px}.sil-compact .sil-compact-table{width:100%;border-collapse:collapse;margin:0!important;font-size:11px}.sil-compact .sil-compact-table td{padding:1.5px 4px!important;line-height:1.15;border:1px solid #cbd5e1}.sil-compact .sil-compact-table th{padding:3px 4px!important;font-size:11px;text-align:left;background:#eef2f6;border:1px solid #94a3b8}.sil-compact-tick{width:12px;text-align:center}.sil-compact-qty{text-align:right!important;white-space:nowrap;width:80px;font-weight:700}.sil-compact .sil-signoff{margin-top:8px;font-size:11px}.sil-compact .sil-information{background:#f8fafc;font-style:italic}@media print{.sil-compact-table tr{break-inside:avoid}.sil-section-title{break-after:avoid}}`}</style>
  </div>;
  return <div className="summary-idiot-list">
    <h2>Roof Checklist</h2>
    <div className="sil-details"><b>Customer:</b> {inputs.customerName ?? inputs.customer_name ?? '—'} · <b>Reference:</b> {inputs.quoteRef ?? inputs.quote_ref ?? inputs.ref ?? '—'}</div>
    <div className="sil-details"><b>Tiles:</b> {tileSystem} {tileColour} · <b>Plastics:</b> {plastics} · <b>Gutters:</b> {gutterColour} {inputs.gutterProfile ?? inputs.gutter_profile ?? ''}</div>
    <div className="sil-details"><b>Installed roof weight, including plasterboard:</b> {checklist.installedWeightKg.toFixed(1)} kg</div>
    <div className="sil-note">{checklist.despatchOnly?'Check off finished assemblies and loose goods loaded for delivery. Plasterboard marked NOT SUPPLIED is a customer buying guide.':'Loose materials and site fixings must be packed. Factory consumables are omitted.'}</div>
    <div className="sil-grid">{['assemblies','laths','timber','tiles','plastics','metal','gutters','misc'].map(key=>checklist.sections[key]?.length>0&&
      <section className="sil-box" key={key}><h3>{names[key]}</h3>{checklist.sections[key].map((row,index)=><div className={`sil-row${row.informational?' sil-information':''}`} key={`${row.key}-${index}`}><span className="sil-tick">{row.informational?'—':'☐'}</span><span className="sil-item">{row.item}</span><b className="sil-qty">{Number(row.qty.toFixed(3))} {row.units}</b></div>)}</section>)}</div>
    <div className="sil-signoff">Checked by: ____________________ &nbsp; Date: ______________</div>
    <style>{`
      .summary-idiot-list { font-family: Arial, sans-serif; font-size: 11px; color: #111827; padding: 3mm 2mm; }
      .summary-idiot-list h2 { font-size: 16px; margin: 0 0 8px; }
      .sil-details { font-size: 11px; margin-bottom: 5px; overflow-wrap: anywhere; }
      .sil-note { font-size: 10px; color: #475569; margin: 8px 0; line-height: 1.3; }
      .sil-grid { display: flex; flex-direction: column; gap: 5px; align-items: stretch; }
      .sil-column { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
      .sil-box { border: 1px solid #94a3b8; padding: 4px; break-inside: avoid; }
      .sil-box h3 { font-size: 11px; margin: 0 0 4px; border-bottom: 1px solid #94a3b8; padding-bottom: 3px; }
      .sil-row { display: flex; gap: 5px; padding: 1.5px 0; border-bottom: 1px dashed #ddd; line-height: 1.15; }
      .sil-row:last-child { border-bottom: 0; }
      .sil-tick { flex: 0 0 12px; }
      .sil-item { flex: 1; min-width: 0; overflow-wrap: anywhere; }
      .sil-qty { max-width: 95px; overflow-wrap: anywhere; text-align: right; font-size: 11px; }
      .sil-signoff { margin-top: 12px; font-size: 12px; }
      .sil-information{background:#f8fafc;font-style:italic}
      @media print { .sil-row{break-inside:avoid}.sil-box h3{break-after:avoid} }
    `}</style>
  </div>;
}
