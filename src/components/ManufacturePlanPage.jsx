import React from 'react';
// Shared page-two frame. Roof adapters provide geometry and labels; this component only lays them out.
export default function ManufacturePlanPage({details={},facets=[],children,elevation,notes}){
 const fields=[['Customer',details.customer],['Reference',details.reference],['Roof',details.roof],['Frame',details.frame],['Tiles',details.tiles],['Fascia',details.fascia],['Gutter',details.gutter],['Roof weight',details.weight]];
 return <section className={`mpp-page${elevation?' mpp-with-elevation':''}`} aria-label="Manufacture book roof plan"><div className="mpp-panel">
 <h2 className="mpp-title">Roof Plan</h2>
 <div className="mpp-details">{fields.map(([label,value])=><div key={label}><b>{label}:</b> {value||'—'}</div>)}</div>
 <div className="mpp-body"><div className="mpp-drawing">{children}</div>{elevation&&<div className="mpp-elevation"><h3>Side Elevation / Height Check</h3><div>{elevation}</div></div>}</div>
 {facets.length>0&&<table className="mpp-facets"><thead><tr><th>Facet</th><th>Pitch</th><th>Support</th><th>Soffit</th></tr></thead><tbody>{facets.map((f,n)=><tr key={f.id||n}><td>{f.label}</td><td>{f.pitch}</td><td>{f.support||'—'}</td><td>{f.soffit||'—'}</td></tr>)}</tbody></table>}
 {notes&&<div className="mpp-notes">{notes}</div>}
 </div><style>{`
 .mpp-page{box-sizing:border-box;width:194mm;max-width:100%;height:279mm;margin:18px auto;background:white;break-after:page;page-break-after:always;font-family:Arial,sans-serif;color:#111827}
 .mpp-page .mpp-panel{box-sizing:border-box;width:100%;height:100%;padding:3mm 1mm;display:flex;flex-direction:column;gap:3mm;background:white}
 .mpp-page .mpp-title{margin:0!important;text-align:center;font:700 16px/1.2 Arial,sans-serif!important}
 .mpp-page .mpp-details{display:grid;grid-template-columns:1.3fr 1.15fr 1.15fr 1fr;gap:4px 10px;padding:6px 8px;border:1px solid #94a3b8;background:#f8fafc;font-size:11px;line-height:1.3;flex:none}
 .mpp-details>div{min-width:0;overflow-wrap:anywhere}
 .mpp-body{flex:1;min-height:0;display:flex;flex-direction:column}
 .mpp-drawing{width:100%;flex:1;min-height:0;display:flex;align-items:center;justify-content:center}
 .mpp-drawing>div{width:100%;height:100%;display:flex;align-items:center;overflow:visible!important}
 .mpp-page .mpp-drawing svg{display:block;width:100%!important;height:100%!important;max-width:none!important;max-height:100%}
 .mpp-page .mpp-facets{width:100%;border-collapse:collapse;margin:0!important;font-size:11px!important;line-height:1.2;flex:none}
 .mpp-page .mpp-facets th,.mpp-page .mpp-facets td{border:1px solid #94a3b8;padding:4px 7px!important;text-align:left}
 .mpp-notes{font-size:10px;line-height:1.3;flex:none}
 .mpp-with-elevation .mpp-drawing{flex:1.15}
 .mpp-elevation{flex:1;min-height:0;border-top:1px solid #94a3b8;padding-top:3mm;display:flex;flex-direction:column}
 .mpp-page .mpp-elevation h3{font:700 13px/1.2 Arial,sans-serif;margin:0 0 2mm}
 .mpp-elevation>div{flex:1;min-height:0;display:flex;align-items:center}
 .mpp-page .mpp-elevation svg{width:100%!important;height:100%!important;max-width:none!important;max-height:100%}
 @media print{.mpp-page{width:194mm;height:279mm;min-height:279mm;margin:0 auto!important;padding:0!important;border:0;break-inside:avoid;page-break-inside:avoid;print-color-adjust:exact;-webkit-print-color-adjust:exact}.mpp-page .mpp-panel{padding:3mm 1mm}}
 `}</style></section>;
}
