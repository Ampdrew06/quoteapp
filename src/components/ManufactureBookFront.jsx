import React from 'react';
// Roof adapters supply values only. This component owns the front-page layout.
export default function ManufactureBookFront({roof={},job=null,details={},onChange,onSave,message='',saving=false}) {
 const address=details.delivery_address_json||{};
 const edit=(key,type='text')=><input aria-label={key.replace(/_/g,' ')} type={type} value={details[key]||''} onChange={e=>onChange({...details,[key]:e.target.value})}/>;
 const setAddress=(key,value)=>onChange({...details,delivery_address_json:{...address,[key]:value}});
 const headers=[['Job Number','Customer Name','Customer Reference','Delivery Date'],['Delivery / Install','Style','Roof Pitch','Frame Thickness'],['Tile Type','Tile Colour','Fascia / Soffit Colour','Soffit / Overhang'],['Gutters','Downpipes','Box Gutter Details','Glazed Options']];
 const values=[[<div className="mbf-numbers">{edit('job_number')}{job?.quote_number&&<span>Quote {job.quote_number}</span>}</div>,roof.customerName||'—',roof.reference||'—',edit('requested_delivery_date','date')],[<select aria-label="Delivery type" value={address.deliveryType||'Delivery'} onChange={e=>setAddress('deliveryType',e.target.value)}><option>Delivery</option><option>Install</option><option>Collection</option></select>,roof.style||'—',roof.pitch||'—',roof.frame||'—'],[roof.tileType||'—',roof.tileColour||'—',roof.fasciaColour||'—',roof.soffit||'—'],[roof.gutters||'—',roof.downpipes||'—',roof.boxGutters||'—',roof.glazing||'—']];
 return <div className="mbf-front">
 <h2 className="mbf-title">Manufacture Book</h2>
 <table className="mbf-grid"><tbody>{headers.map((row,n)=><React.Fragment key={n}><tr>{row.map(label=><th key={label}>{label}</th>)}</tr><tr>{values[n].map((value,k)=><td key={k}>{value}</td>)}</tr></React.Fragment>)}</tbody></table>
 <div className="mbf-delivery">
 <label className="mbf-address">Delivery address<textarea aria-label="Delivery address" value={address.deliveryAddress||''} onChange={e=>setAddress('deliveryAddress',e.target.value)}/></label>
 <div className="mbf-contact"><label>Contact name<input aria-label="Contact name" value={address.contactName||''} onChange={e=>setAddress('contactName',e.target.value)}/></label><label>Contact phone<input aria-label="Contact phone" value={address.contactPhone||''} onChange={e=>setAddress('contactPhone',e.target.value)}/></label></div>
 <label className="mbf-instructions">Special instructions<textarea aria-label="Special instructions" value={details.order_notes||''} onChange={e=>onChange({...details,order_notes:e.target.value})}/></label>
 </div>
 <div className="mbf-signoff">{['Authorised for Fabrication','Authorised for Despatch'].map(title=><div key={title}><b>{title}</b><span>Signed ____________________ Date __________</span></div>)}</div>
 <div className="mbf-controls"><button type="button" disabled={saving} onClick={onSave}>{saving?'Saving…':job?'Save job details':'Save draft book details'}</button><span role="status">{message}</span></div>
 <style>{`
 .mbf-front{box-sizing:border-box;width:100%;height:279mm;padding:5mm;display:flex;flex-direction:column;gap:3mm;font-family:Arial,sans-serif;font-size:15px;line-height:1.2;color:#111827;background:#fff;border:1px solid #cbd5e1}
 .mbf-front .mbf-title{font:700 26px Arial,sans-serif!important;text-align:center;margin:0!important;flex:none}
 .mbf-front .mbf-grid{width:100%;table-layout:fixed;border-collapse:collapse;margin:0!important;font:15px Arial,sans-serif;flex:none}
 .mbf-front .mbf-grid th,.mbf-front .mbf-grid td{border:1px solid #94a3b8;text-align:left;overflow-wrap:anywhere;padding:5px 7px!important}
 .mbf-front .mbf-grid th{font-size:13px;background:#f1f5f9;height:auto}
 .mbf-front .mbf-grid td{font-size:15px;height:10mm;vertical-align:middle}
 .mbf-front input,.mbf-front select,.mbf-front textarea{box-sizing:border-box;font:inherit;color:inherit;background:white;max-width:100%;border:1px solid #cbd5e1;border-radius:3px}
 .mbf-front input,.mbf-front select{display:block;width:100%!important;padding:4px!important;margin:0!important}
 .mbf-numbers{display:flex;align-items:center;gap:6px;min-width:0}.mbf-front .mbf-numbers input{flex:1;min-width:0;width:0!important}.mbf-numbers span{flex:none;font-size:12px;white-space:nowrap}
 .mbf-front .mbf-delivery{display:flex;flex-direction:column;gap:3mm;flex:1;min-height:0}
 .mbf-front .mbf-delivery label{display:flex;flex-direction:column;gap:2mm;font-size:13px;font-weight:700;margin:0!important;min-height:0}
 .mbf-front .mbf-address{flex:2}
 .mbf-front .mbf-instructions{flex:1}
 .mbf-front textarea{flex:1;min-height:0;width:100%;padding:8px;font:400 15px Arial,sans-serif;line-height:1.3;resize:none;margin:0}
 .mbf-contact{display:flex;gap:4mm;flex:none}.mbf-contact label{flex:1}.mbf-contact input{font:400 15px Arial,sans-serif}
 .mbf-signoff{display:flex;gap:3mm;flex:none}.mbf-signoff>div{box-sizing:border-box;flex:1;height:17mm;padding:3mm;border:1px solid #94a3b8;font-size:12px;display:flex;flex-direction:column;justify-content:space-between}.mbf-signoff span{font-size:11px}
 .mbf-controls{display:flex;align-items:center;gap:10px;font-size:13px;flex:none}.mbf-controls button{font:inherit;padding:6px 10px}
 @media print{.mbf-front{height:279mm;border:0}.mbf-front input,.mbf-front select,.mbf-front textarea{border:0!important;border-radius:0;appearance:none}.mbf-controls{display:none!important}.mbf-front textarea{overflow:visible}.mbf-signoff{break-inside:avoid}}
 `}</style>
 </div>;
}
