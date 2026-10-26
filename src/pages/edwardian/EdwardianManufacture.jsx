import TrussAssembly from '../../components/ManufacturingTrussAssembly';
import {EdwardianTrussCutPage,EdwardianRingBeamCutPages} from '../../components/EdwardianVisualCutPages';
import ManufacturingEdwardianMemberPages from '../../components/ManufacturingEdwardianMemberPages';
import ManufacturePlanPage from '../../components/ManufacturePlanPage';
import React,{useState,useEffect} from 'react';
import {Link,Navigate} from 'react-router-dom';
import {getMaterials} from '../../lib/materials';
import {getCustomers} from '../../lib/customers';
import {getQuoteById,updateQuote} from '../../lib/quotes';
import {isAdminUser} from '../../lib/userRole';
import {readActiveDesignRecord,rememberActiveDesignRecord,draftDesignIdentity} from '../../lib/activeDesignRecord';
import {isEdwardianQuote} from '../../lib/Calculations/edwardianQuotation';
import {buildEdwardianSummaryMaterialsModel} from '../../lib/Calculations/edwardianSummaryMaterialsModel';
import {buildEdwardianManufactureSchedule} from '../../lib/Manufacturing/edwardianManufactureSchedule';
import ManufactureBookFront from '../../components/ManufactureBookFront';
import SummaryIdiotList from '../../components/SummaryIdiotList';
import EdwardianNavigation from './EdwardianNavigation';
import EdwardianManufacturePlan from './EdwardianManufacturePlan';
const mm=v=>Number(v).toFixed(1);
const read=()=>{try{return JSON.parse(localStorage.getItem('edwardianInputs')||'{}');}catch{return {};}};
export function BookTable({head,rows}){return <table><thead><tr>{head.map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((r,n)=><tr key={n}>{r.map((x,j)=><td key={j}>{x}</td>)}</tr>)}</tbody></table>;}
export default function EdwardianManufacture(){
 const [inputs]=useState(read),[materials]=useState(getMaterials),[job,setJob]=useState(null),[customerName,setCustomerName]=useState(''),[message,setMessage]=useState('');
 const [details,setDetails]=useState(()=>{try{if(readActiveDesignRecord('edwardian'))return {};const saved=JSON.parse(localStorage.getItem('edwardianBookDetails')||'{}');return saved.draftId===draftDesignIdentity()?saved.details||{}:{};}catch{return {};}});
 useEffect(()=>{let alive=true;getCustomers().then(rows=>{if(alive)setCustomerName((rows||[]).find(c=>c.id===inputs.selectedCustomerId)?.name||(inputs.selectedCustomerId==='retail'?'Retail':'—'));}).catch(()=>{});const id=readActiveDesignRecord('edwardian')?.id;if(id)getQuoteById(id).then(record=>{if(alive&&isEdwardianQuote(record)){setJob(record);setDetails({job_number:record.job_number||'',requested_delivery_date:record.requested_delivery_date||'',order_notes:record.order_notes||'',delivery_address_json:record.delivery_address_json||{}});}}).catch(()=>{if(alive)setMessage('Job details could not be loaded.');});return()=>{alive=false;};},[inputs]);
 if(!isAdminUser())return <Navigate to="/quote/edwardian" replace/>;
 const model=buildEdwardianSummaryMaterialsModel({inputs,materials}),s=buildEdwardianManufactureSchedule(model,materials);
 if(!s.valid)return <main><p role="status">{s.errors.join(' ')}</p><Link to="/quote/edwardian">Return to Design/Options</Link></main>;
 const g=s.geometry,t=s.truss;
 const save=async()=>{if(!job&&readActiveDesignRecord('edwardian')){setMessage('Wait for the saved job details to load before saving.');return;}if(!job){localStorage.setItem('edwardianBookDetails',JSON.stringify({draftId:draftDesignIdentity(),details}));setMessage('Draft book details saved on this device.');return;}try{const result=await updateQuote(job.id,details);if(result){setJob({...job,...result});rememberActiveDesignRecord({...readActiveDesignRecord('edwardian'),...result});}setMessage(result?'Job details saved.':'Job details could not be saved.');}catch{setMessage('Job details could not be saved.');}};
 const roof={customerName,reference:inputs.customerReference,style:'Edwardian',pitch:`Sides ${mm(g.pitchDeg)}° · front ${mm(g.frontPitchDeg)}°`,frame:`${mm(g.frameMM)}mm`,tileType:inputs.tileProductId==='metrotileShingle'?'Metrotile Shingle':s.tiling.steel?'Britmet Shingle':'LiteSlate',tileColour:inputs.tileColour,fasciaColour:inputs.fasciaColour||'White',soffit:`Sides ${mm(g.eaves.left.manufacturedSoffitMM)}/${mm(g.eaves.right.manufacturedSoffitMM)}mm · front ${mm(g.eaves.effectiveReferenceSoffitMM)}mm`,gutters:`${inputs.gutterProfile||'square'} · ${inputs.gutterColour||'White'}`,downpipes:'One round downpipe assembly',dimensions:`${g.widthMM} × ${g.projectionMM}mm`,weight:`${mm(model.installedWeightKg)}kg incl. plasterboard`};
 const extras=Object.values(model.sections).flatMap(section=>section.lines).filter(r=>r.isAddedItem&&r.qty>0&&r.usage!=='factory').map(r=>`${r.qty} ${r.units} ${r.label}`);
 const page=(title,content,kind='')=><section key={title} className={`em-page ${kind}`}><header><h2>{title}</h2><div>{customerName||'—'} · {inputs.customerReference||'Edwardian'} · {g.widthMM} × {g.projectionMM}mm · sides {mm(g.pitchDeg)}° / front {mm(g.frontPitchDeg)}°</div></header>{content}<footer>Timberlite · {job?.job_number?`Job ${job.job_number}`:'Draft'} · {title}</footer></section>;
 const grouped=new Map();s.members.filter(m=>m.type!=='truss-member').forEach(m=>{const key=JSON.stringify({type:m.type,profile:m.profile,connection:m.connection});if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(m);});

 return <main className="em-book"><EdwardianNavigation/>
 {page('Manufacture Book',<ManufactureBookFront roof={roof} job={job} details={details} extras={extras} onChange={setDetails} onSave={save} message={message} factoryNote={`Manufacturing external projection ${mm(g.externalProjectionMM)}mm already includes the shared 5mm clearance. Do not add again. Known installed weight ${mm(model.installedWeightKg)}kg includes plasterboard once; ${model.missingWeights.length} weight entries remain unconfigured.`}/>,'em-front')}
 <ManufacturePlanPage
 details={{customer:customerName,reference:inputs.customerReference,roof:'Edwardian',frame:roof.frame,tiles:`${roof.tileType} — ${inputs.tileColour||'—'}`,fascia:roof.fasciaColour,gutter:`${inputs.gutterColour||'White'} — ${inputs.gutterProfile||'square'}`,weight:roof.weight}}
 facets={[{label:'Front',pitch:`${mm(g.frontPitchDeg)}°`,support:`${mm(g.frameMM)} mm frame`,soffit:`${Math.round(g.eaves.effectiveReferenceSoffitMM)} mm`},...['left','right'].map(side=>({label:side==='left'?'Left Side':'Right Side',pitch:`${mm(g.pitchDeg)}°`,support:`${mm(g.frameMM)} mm frame`,soffit:`${Math.round(g.eaves[side].manufacturedSoffitMM)} mm`}))]}
 notes={`${g.manualFront?'Manual front rafter layout. ':''}${(g.frontRafterWarnings||[]).join(' ')} Ridge point ${mm(g.ridgeEndYMM)}mm; terminal truss centre ${mm(g.terminalTrussCentreMM)}mm from house wall (33mm setback). EP includes the shared manufacturing clearance. Dashed centre = ridge datum, no ridge timber; T = truss; H = hip; R = boss rafter; J = jack.`}
 ><EdwardianManufacturePlan schedule={s}/></ManufacturePlanPage>
 <EdwardianTrussCutPage schedule={s} assembly={<TrussAssembly truss={t} count={s.counts.trusses}/>}/>
 <ManufacturingEdwardianMemberPages groups={[...grouped.values()]} tiling={s.tiling}/>
 <EdwardianRingBeamCutPages beams={s.ringBeams}/>
 {page('Despatch checklist',<SummaryIdiotList compact model={model} materials={materials} checklist={s.checklist} inputs={{...inputs,customerName,quoteRef:inputs.customerReference,tileSystem:inputs.tileProductId,plasticsColor:inputs.fasciaColour||'White',gutterColor:inputs.gutterColour||'White'}}/>,'em-checklist')}
 <style>{`.em-book{font-family:Arial,sans-serif;color:#111827}.em-page{box-sizing:border-box;width:194mm;min-height:275mm;margin:18px auto;padding:4mm;background:white;border:1px solid #cbd5e1;break-after:page;position:relative}.em-page header{margin-bottom:8px}.em-page h2{font-size:16px;margin:0 0 6px}.em-page header div,.em-meta{font-size:11px}.em-page footer{margin-top:18px;padding-top:6px;border-top:1px solid #cbd5e1;font-size:10px}.em-page svg{display:block;width:100%;height:auto}.em-page table{width:100%;border-collapse:collapse;margin:8px 0;font-size:11px}.em-page td,.em-page th{border:1px solid #94a3b8;padding:5px;text-align:left}.em-page p{font-size:11px;line-height:1.35}.em-page tr{break-inside:avoid}.em-page thead{display:table-header-group}.em-front{padding:0!important;height:279mm;min-height:279mm}.em-front>header,.em-front>footer{display:none}.em-plan>svg{max-height:214mm}.em-plan p{font-size:12px}.em-page:last-of-type{break-after:auto}.em-checklist{height:auto}.em-checklist>header,.em-checklist>footer{display:none}.em-truss-cuts .gm-page{box-sizing:border-box;width:194mm;min-height:275mm;margin:18px auto;padding:4mm;background:white;border:1px solid #cbd5e1;break-after:page;font-family:Arial,sans-serif}.em-truss-cuts h2{font-size:16px;margin:0 0 8px}.em-truss-cuts p{font-size:11px;line-height:1.35}.em-truss-cuts svg{display:block;width:100%}.em-book .sil-row{padding:1.5px 0}.em-book .sil-details{font-size:11px}@media print{@page{size:A4;margin:6mm}body{margin:0}.nav-strip{display:none!important}.em-truss-cuts .gm-page{margin:0;border:0;width:194mm}.em-page{margin:0;border:0;padding:4mm;min-height:275mm;width:100%;break-after:page}.em-page button{display:none!important}.em-page input,.em-page textarea{border:0!important}.em-front{width:194mm!important}.em-checklist{break-after:auto}}`}</style>
 </main>;
}
