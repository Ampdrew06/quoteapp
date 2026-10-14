import ManufacturingGableTrussPage,{WorkshopShape} from '../../components/ManufacturingGableTrussPage';
import ManufacturingRingBeamDrawing from '../../components/ManufacturingRingBeamDrawing';
import ManufacturePlanPage from '../../components/ManufacturePlanPage';
import {readActiveDesignRecord,rememberActiveDesignRecord,draftDesignIdentity} from '../../lib/activeDesignRecord';
import React,{useState,useEffect} from 'react';
import {Link,Navigate} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import {getMaterials} from '../../lib/materials';
import {getQuoteById,updateQuote} from '../../lib/quotes';
import {isGableQuote} from '../../lib/Calculations/gableQuotation';
import {buildGableSummaryMaterialsModel} from '../../lib/Calculations/gableSummaryMaterialsModel';
import {buildGableManufactureSchedule} from '../../lib/Manufacturing/gableManufactureSchedule';
import SummaryIdiotList from '../../components/SummaryIdiotList';
import GableNavigation from './GableNavigation';
import GableJobFront from './GableJobFront';
import {getCustomers} from '../../lib/customers';
const mm=v=>Number(v).toFixed(1);
const read=()=>{try{return JSON.parse(localStorage.getItem('gableDesignPreviewInputs')||'{}');}catch{return {};}};
function Table({head,rows}) {return <table><thead><tr>{head.map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((r,n)=><tr key={n}>{r.map((x,j)=><td key={j}>{x}</td>)}</tr>)}</tbody></table>;}
export function Shape({points,title}) {
 const xs=points.map(p=>p.xMM),ys=points.map(p=>p.yMM),minX=Math.min(...xs),maxY=Math.max(...ys),scale=Math.min(880/(Math.max(...xs)-minX||1),260/(maxY-Math.min(...ys)||1));
 return <svg viewBox="0 0 1000 350" role="img" aria-label={title}><text x="40" y="30" fontSize="25">{title}</text><polygon points={points.map(p=>`${60+(p.xMM-minX)*scale},${65+(maxY-p.yMM)*scale}`).join(' ')} fill="#e2e8f0" stroke="#111827" strokeWidth="3" />
 </svg>;
}
export function GablePlan({schedule:s}) {
 const g=s.geometry,svgHeight=Math.min(1160,Math.max(700,g.manufacturingProjectionMM*744/g.externalWidthMM+354)),scale=Math.min(744/g.externalWidthMM,(svgHeight-354)/g.manufacturingProjectionMM),W=g.externalWidthMM*scale,L=g.manufacturingProjectionMM*scale,left=(1000-W)/2,top=130,right=left+W,bottom=top+L;
 const px=x=>left+x/g.externalWidthMM*W,py=y=>top+y/g.manufacturingProjectionMM*L,frameX=g.feet[0].hfcMM;
 const dim=(x1,y1,x2,y2,label,vertical=false)=><g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth="2" markerStart="url(#gable-dim-arrow)" markerEnd="url(#gable-dim-arrow)"/><text x={vertical?x1-16:(x1+x2)/2} y={vertical?(y1+y2)/2:y1-13} transform={vertical?`rotate(-90 ${x1-16} ${(y1+y2)/2})`:undefined} textAnchor="middle" fontSize="22" fill="#111827">{label}</text></g>;
 return <svg viewBox={`0 0 1000 ${svgHeight}`} role="img" aria-label="Gable truss setting-out plan" style={{fontFamily:'Arial,sans-serif'}}>
 <defs><marker id="gable-dim-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#334155" strokeWidth="1.5"/></marker></defs>
 <text x={left+W/2} y="32" textAnchor="middle" fontSize="20">HOUSE WALL</text>
 {dim(px(frameX),75,px(frameX+g.widthMM),75,`IW: ${Math.round(g.widthMM)} mm`)}
 <rect x={left} y={top} width={W} height={L} fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5"/>
 <rect x={px(frameX)} y={top} width={g.widthMM/g.externalWidthMM*W} height={g.projectionMM/g.manufacturingProjectionMM*L} fill="none" stroke="#111827" strokeWidth="3"/>
 <line x1={px(frameX+g.widthMM/2)} x2={px(frameX+g.widthMM/2)} y1={top} y2={bottom} stroke="#111827" strokeWidth="3" strokeDasharray="10 6"/>
 {s.trusses.map((t,n)=><g key={t.id}><line x1={left} x2={right} y1={py(t.centreMM)} y2={py(t.centreMM)} stroke="#2563eb" strokeWidth="4"/><text x={px(frameX)+24} y={py(t.centreMM)-9} textAnchor="start" fontSize="22" fill="#2563eb" fontWeight="bold">{t.id}</text><text x={right+18} y={py(t.centreMM)+8} fontSize="22" fontWeight="bold">{n===0?'Wall':Math.round(t.centreMM)}</text>{n>0&&<text x={px(frameX)-16} textAnchor="end" y={py((t.centreMM+s.trusses[n-1].centreMM)/2)+8} fontSize="20" fontWeight="400" fill="#111827">{Math.round(g.layout.gapsMM[n-1])}</text>}</g>)}
 {s.bays.map((b,n)=><g key={b.id}><text x={left+40} y={py((s.trusses[n].centreMM+s.trusses[n+1].centreMM)/2)+8} fontSize="20">{b.id}</text><text x={right-40} y={py((s.trusses[n].centreMM+s.trusses[n+1].centreMM)/2)+8} textAnchor="end" fontSize="20">{b.pairedId}</text></g>)}
 <text x={left+W/4} y={top+36} textAnchor="middle" fill="#16a34a" fontSize="24" fontWeight="bold">{mm(g.pitchDeg)}°</text><text x={left+W*3/4} y={top+36} textAnchor="middle" fill="#16a34a" fontSize="24" fontWeight="bold">{mm(g.pitchDeg)}°</text>
 <text x={left+14} y={top+L/2} textAnchor="middle" transform={`rotate(-90 ${left+14} ${top+L/2})`} fontSize="20" fontWeight="bold">RB1</text><text x={right-14} y={top+L/2} textAnchor="middle" transform={`rotate(-90 ${right-14} ${top+L/2})`} fontSize="20" fontWeight="bold">RB2</text>
 {dim(right+120,top,right+120,py(g.projectionMM),`IP: ${Math.round(g.projectionMM)} mm`,true)}
 {dim(left-85,top,left-85,bottom,`EP: ${Math.round(g.manufacturingProjectionMM)} mm`,true)}
 {dim(left,bottom+104,right,bottom+104,`EW: ${Math.round(g.externalWidthMM)} mm`)}
 
 
 </svg>;
}
export default function GableManufacture(){
 const [inputs]=useState(read),[materials]=useState(getMaterials),[job,setJob]=useState(null),[details,setDetails]=useState(()=>{try{if(readActiveDesignRecord('gable'))return {};const saved=JSON.parse(localStorage.getItem('gableBookDetails')||'{}');return saved.draftId===draftDesignIdentity()?saved.details||{}:{};}catch{return {};}}),[message,setMessage]=useState(''),[customerName,setCustomerName]=useState('');
 useEffect(()=>{let alive=true;getCustomers().then(rows=>{if(alive)setCustomerName((rows||[]).find(c=>c.id===inputs.selectedCustomerId)?.name||(inputs.selectedCustomerId==='retail'?'Retail':'Customer unavailable'));}).catch(()=>{if(alive)setCustomerName('—');});const id=readActiveDesignRecord('gable')?.id;if(id)getQuoteById(id).then(record=>{if(alive&&isGableQuote(record)){setJob(record);setDetails({job_number:record.job_number||'',requested_delivery_date:record.requested_delivery_date||'',order_notes:record.order_notes||'',delivery_address_json:record.delivery_address_json||{}});}}).catch(()=>{if(alive)setMessage('Job details could not be loaded.');});return()=>{alive=false;};},[inputs]);
 if(!isAdminUser())return <Navigate to="/quote/gable" replace />;
 const model=buildGableSummaryMaterialsModel({inputs,materials}),s=buildGableManufactureSchedule(model,materials);
 if(!s.valid)return <main><p>{s.errors.join(' ')}</p><Link to="/quote/gable">Return to Design/Options</Link></main>;
 const g=s.geometry,i=s.insulation,plastics=model.audits.plastics;
 const page=(title,content)=><section key={title} className={title==='Manufacture Book'?'gm-page gm-front-page':title==='Roof plan'?'gm-page gm-plan-page':title==='Despatch checklist'?'gm-page gm-checklist-page':'gm-page'}><h2>{title}</h2><div className="gm-ref">{customerName||'—'} · {inputs.customerReference||'Gable'} · {inputs.widthMM} × {inputs.projMM}mm · {mm(g.pitchDeg)}° · {inputs.fasciaColour||'White'} fascia · {inputs.gutterColour||'White'} gutter · {mm(model.installedWeightKg)}kg</div>{content}</section>;
 const save=async()=>{if(!job){localStorage.setItem('gableBookDetails',JSON.stringify({draftId:draftDesignIdentity(),reference:inputs.customerReference,widthMM:inputs.widthMM,projMM:inputs.projMM,details}));setMessage('Draft book details saved on this device.');return;}try{const result=await updateQuote(job.id,details);if(result){setJob(result);rememberActiveDesignRecord({...readActiveDesignRecord('gable'),...result});}setMessage(result?'Job details saved.':'Job details could not be saved.');}catch{setMessage('Job details could not be saved.');}};
 return <main className="gm-book"><GableNavigation/>
 {page('Manufacture Book',<GableJobFront inputs={inputs} geometry={g} model={model} job={job} details={details} customerName={customerName} onChange={setDetails} onSave={save} message={message}/>)}
 <ManufacturePlanPage
 details={{customer:customerName,reference:inputs.customerReference,roof:'Gable',frame:`${mm(g.frameMM)}mm`,tiles:`${inputs.tileProductId==='liteSlate'?'LiteSlate':inputs.tileProductId==='metrotileShingle'?'Metrotile':'Britmet'} — ${inputs.tileColour||'—'}`,fascia:inputs.fasciaColour||'White',gutter:`${inputs.gutterColour||'White'} — ${inputs.gutterProfile||'square'}`,weight:`${mm(model.installedWeightKg)}kg incl. plasterboard`}}
 facets={[{label:'Left Side',pitch:`${mm(g.pitchDeg)}°`,support:`${mm(g.frameMM)} mm frame`,soffit:`${Math.round(g.leftSoffitMM)} mm`},{label:'Right Side',pitch:`${mm(g.pitchDeg)}°`,support:`${mm(g.frameMM)} mm frame`,soffit:`${Math.round(g.rightSoffitMM)} mm`}]}
 notes={`Manufacturing EP ${Math.round(g.manufacturingProjectionMM)}mm includes the 5mm front soffit clearance; do not add again. Requested EP ${Math.round(g.externalProjectionMM)}mm. Dashed centre = ridge; T = truss; B = upstand bay. Positions from house wall.`}
 ><GablePlan schedule={s}/></ManufacturePlanPage>
 <ManufacturingGableTrussPage schedule={s}/>
 {page('Front truss face',<><h3 style={{fontSize:12}}>Full outer 9mm face · front truss only</h3><WorkshopShape points={s.frontFace.points} title="Front truss outer face" showAngles={false}/><p>Continue the face over both members and the gusset outline, leaving the A-frame opening clear. The outer gusset is included in this single layer, not covered with a second duplicate layer.</p><p>Front fascia: 300mm stock on the slopes; one central box-end blank, cut to fit the gusset. Exact box-end outline remains a workshop detail.</p></>)}
 {s.ringBeamGroups.map(group=>page(`Ring-beam ${group.manufactureRefs.join(' / ')}`,<ManufacturingRingBeamDrawing group={group} reviewLabel={false}/>))}
 {page('Insulation and internal laths',<><Table head={['Cut / requirement','Dimension','Quantity']} rows={[["50mm rebated cradle strips",`${mm(i.cradle.runMM)} × 140mm`,i.cradle.facesPerSide*2],["100mm PIR slope run to apex",mm(i.slab.runMM)+'mm','Two per bay']]}/><Table head={['Between trusses','100mm PIR clear width']} rows={s.bays.map((b,n)=>[`T${n+1} / T${n+2}`,mm(b.slabWidthMM)])}/><p>50mm cradle ends at the gusset; 100mm slabs continue to the apex with chamfered meeting edges. Seal joints with expanding foam.</p><p>Internal laths: {model.audits.laths.internal.rows.length} runs × {mm(g.manufacturingProjectionMM)}mm. Lower laths sit at the foot-cut / ring-beam junction. Ceiling flat {mm(i.ceiling.flatWidthMM)}mm.</p><p>SuperQuilt and plasterboard installed coverage: {i.ceiling.areaM2.toFixed(3)}m², stopping at the inside front frame. Plasterboard is not supplied unless added in Summary.</p><p>Tile cutting and detailed lath cutting schedules will be added separately.</p></>)}
 {page('Fascia and soffit preparation',<><Table head={['Run','Length mm','Fascia stock','External cut height','Soffit width']} rows={plastics.sideRows.map(r=>[r.side,mm(r.runM*1000),r.widthMM+'mm',mm(r.fasciaCut.externalCutHeightMM??r.fasciaCut.finishedExternalHeightMM??0),mm(r.soffitGeometryMM)])}/><p>Front slopes to gusset: {plastics.frontRows.map(r=>mm(r.runM*1000)+'mm').join(' / ')}. Front soffit width {mm(g.frontOverhangMM)}mm; flat section {mm(i.ceiling.flatWidthMM)}mm. Cut box end to fit, then join to sloping fascias.</p><p>Only side eaves are factory vented. Stock quantities and fittings follow the final checklist; compatible offcuts are shared.</p></>)}
 {page('Despatch checklist',<SummaryIdiotList model={model} materials={materials} checklist={s.checklist} inputs={{...inputs,quoteRef:inputs.customerReference,customerName:job?.customer_name||inputs.customerName,tileSystem:inputs.tileProductId,plasticsColor:inputs.fasciaColour,gutterColor:inputs.gutterColour}}/>)}
 <style>{`.gm-book{font-family:Arial,sans-serif;color:#111827}.gm-page{box-sizing:border-box;width:194mm;min-height:275mm;margin:18px auto;padding:4mm;background:white;border:1px solid #cbd5e1;break-after:page}.gm-page.gm-front-page{width:194mm!important;padding:0!important;height:279mm;min-height:279mm}.gm-front-page>h2,.gm-front-page>.gm-ref,.gm-checklist-page>h2,.gm-checklist-page>.gm-ref{display:none}.gm-plan-page>.gm-ref{display:none}.gm-page .gm-plan-details{font-size:12px;margin:0 0 6px;table-layout:fixed}.gm-plan-details td{padding:4px!important;background:#f8fafc}.gm-plan-page>h2{text-align:center;font-size:19px}.gm-plan-page>svg{max-height:221mm}.gm-plan-page>table{font-size:12px;margin:5px 0}.gm-plan-page>table th,.gm-plan-page>table td{padding:4px}.gm-plan-page .gm-plan-note{font-size:12px;line-height:1.3;margin:5px 0}.gm-page:last-of-type{break-after:auto}.gm-page:first-of-type h2{text-align:center;font-size:28px}.gm-page h2{font-size:16px;margin:0 0 8px}.gm-ref{font-size:11px;margin-bottom:8px}.gm-page p{font-size:11px;line-height:1.35}.gm-page svg{display:block;width:100%;height:auto}.gm-page table{width:100%;border-collapse:collapse;margin:8px 0;font-size:11px}.gm-page th,.gm-page td{border:1px solid #94a3b8;padding:5px;text-align:left}.gm-page tr{break-inside:avoid}.gm-page label{display:block;margin:15px 0}.gm-page input{display:block;padding:8px;width:90%}.gm-page .sil-note{font-size:12px}.gm-page .sil-details{font-size:13px}.gm-page .sil-row{padding:1.5px 0}@media print{@page{size:A4;margin:6mm}body{margin:0}.nav-strip{display:none!important}.gm-page{margin:0;border:0;padding:4mm;min-height:275mm;width:100%}button{display:none!important}input{border:0!important}}`}</style>
 </main>;
}
