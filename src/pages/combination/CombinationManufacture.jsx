import React,{useState} from 'react';
import {Link,Navigate} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import {getMaterials} from '../../lib/materials';
import {readActiveDesignRecord,draftDesignIdentity} from '../../lib/activeDesignRecord';
import {updateQuote} from '../../lib/quotes';
import {normalizeCombinationInputs,COMBINATION_DESIGN_KEY} from '../../lib/geometry/combinationDesignInputs';
import {readCombinationBookDetails,saveCombinationBookDetails} from '../../lib/combinationBookDetails';
import {buildCombinationManufactureSchedule} from '../../lib/Manufacturing/combinationManufactureSchedule';
import CombinationNavigation from './CombinationNavigation';
import ManufactureBookFront from '../../components/ManufactureBookFront';
import ManufacturePlanPage from '../../components/ManufacturePlanPage';
import EdwardianManufacturePlan from '../edwardian/EdwardianManufacturePlan';
import VictorianManufacturePlan from '../victorian/VictorianManufacturePlan';
import {EdwardianTrussCutPage,EdwardianRingBeamCutPages} from '../../components/EdwardianVisualCutPages';
import TrussAssembly from '../../components/ManufacturingTrussAssembly';
import ManufacturingEdwardianMemberPages from '../../components/ManufacturingEdwardianMemberPages';
import CombinationMemberCutPages from './CombinationMemberCutPages';
import SummaryIdiotList from '../../components/SummaryIdiotList';
const mm=v=>Number(v).toFixed(1).replace(/\.0$/,'');
const read=()=>{try{return normalizeCombinationInputs(JSON.parse(localStorage.getItem(COMBINATION_DESIGN_KEY)||'{}'));}catch{return normalizeCombinationInputs();}};
function Table({head,rows}){return <table><thead><tr>{head.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,n)=><td key={n}>{v}</td>)}</tr>)}</tbody></table>;}
export default function CombinationManufacture({checklistOnly=false}={}){
 const [inputs]=useState(read),[materials]=useState(getMaterials),[details,setDetails]=useState(()=>readCombinationBookDetails(read())),[message,setMessage]=useState(''),[saving,setSaving]=useState(false),[openedOwner]=useState(()=>readActiveDesignRecord('combination')?.id||draftDesignIdentity());
 if(!isAdminUser())return <Navigate to="/quote" replace/>;
 const s=buildCombinationManufactureSchedule({inputs,materials});
 if(!s.valid)return <><CombinationNavigation/><main style={{padding:20}}><p role="alert">{s.errors.join(' ')}</p><Link to="/quote/combination">Return to Design/Options</Link></main></>;
 const g=s.geometry,model=s.model,current=readActiveDesignRecord('combination'),ed=s.family==='edwardian';
 const style='Edwardian / Victorian',tile={britmetShingle:'Britmet Shingle',metrotileShingle:'Metrotile',liteSlate:'LiteSlate',tapcoSlate:'Tapco'}[inputs.tileProductId]||inputs.tileProductId;
 const roof={customerName:inputs.customerName||current?.customer_name||'Retail',reference:inputs.customerReference,style,pitch:ed?`Sides ${mm(g.pitchDeg)}° · front ${mm(g.frontPitchDeg)}°`:`${mm(g.pitchDeg)}°`,frame:`${mm(g.frameMM)}mm`,tileType:tile,tileColour:inputs.tileColour,fasciaColour:inputs.fasciaColour,soffit:`${mm(g.soffitMM)}mm`,gutters:`${inputs.gutterProfile} / ${inputs.gutterColour}`,downpipes:'One round downpipe assembly',dimensions:`${mm(g.widthMM)} × ${mm(g.projectionMM)}mm`};
 const perimeter=s.ringBeams.reduce((n,b)=>n+Math.ceil(b.cuts.continuous.ply9Base.externalEdgeLengthMM-1e-7),0);
 const members=new Map();if(ed)for(const m of s.members.filter(m=>m.type!=='truss-member')){const key=JSON.stringify({type:m.type,profile:m.profile,connection:m.connection});if(!members.has(key))members.set(key,[]);members.get(key).push(m);}
 const save=async()=>{setSaving(true);try{const result=await saveCombinationBookDetails({inputs,details,updateQuote,expectedOwner:openedOwner});setMessage(result.message);}finally{setSaving(false);}};
 const facetRows=ed?[{label:'Front · RB2',pitch:`${mm(g.frontPitchDeg)}°`,support:'70mm frame',soffit:`${mm(g.eaves.effectiveReferenceSoffitMM)}mm`},...['left','right'].map((side,i)=>({label:`${side==='left'?'Left':'Right'} side · RB${i===0?1:3}`,pitch:`${mm(g.pitchDeg)}°`,support:'70mm frame',soffit:`${mm(g.eaves[side].manufacturedSoffitMM)}mm`}))]:g.facets.map((f,i)=>({id:f.id,label:`Facet ${i+1} · RB${i+1}`,pitch:`${mm(f.pitchDeg)}°`,support:'70mm frame',soffit:`${mm(g.soffitMM)}mm`}));
 const supplyRows=key=>model.sections[key].lines.filter(r=>!r.isAddedItem||r.qty>0).map(r=>[r.label,r.qty==null?'To confirm':mm(r.qty),r.units||r.unit||'']);
 if(checklistOnly)return <><CombinationNavigation/><main style={{maxWidth:1100,margin:'0 auto',padding:16}}>{model.supplyReviews.map(note=><p key={note} role="status">{note}</p>)}<SummaryIdiotList model={model} materials={materials} checklist={s.checklist} inputs={{...inputs,pitchDeg:g.pitchDeg,customerName:roof.customerName,quoteRef:roof.reference,tileSystem:inputs.tileProductId,plasticsColor:roof.fasciaColour,gutterColor:inputs.gutterColour}}/></main></>;
 return <main className="cmb-book"><CombinationNavigation/>
 <section className="em-page cmb-front" data-book-section="front"><ManufactureBookFront roof={roof} job={current} details={details} onChange={setDetails} onSave={save} saving={saving} message={message}/></section>
 <ManufacturePlanPage details={{customer:roof.customerName,reference:roof.reference,roof:`${style} · ${inputs.leftSide} left / ${inputs.rightSide} right`,frame:roof.frame,tiles:`${tile} — ${inputs.tileColour}`,fascia:roof.fasciaColour,gutter:roof.gutters,weight:`${mm(model.installedWeightKg)}kg known incl. plasterboard`,ringbeamPerimeter:`${perimeter}mm (whole-mm cuts)`}} facets={facetRows}
 notes={`Left ${inputs.leftSide}; right ${inputs.rightSide}. Internal/external dimensions follow the existing manufacturing datums. Ridge point ${mm(g.ridgeEndYMM)}mm from house wall; boss truss ${mm(g.terminalTrussCentreMM)}mm. T = truss; H = hip; R = boss rafter; J = jack; RB = ringbeam. Position chains include applied manual edits. ${!ed?'I/E = internal/external facet lengths; near chain = member centres; far chain = gaps. Jack profiles retain provisional connection allowances pending factory fit verification. ':''}${g.customFacetGeometry?'Measured/adjusted facet geometry applied. Check/adapt nominal corner fittings to the displayed angles. ':''}Known weight is partial where material weights remain unconfigured. ${model.supplyReviews.length?'Supply items requiring confirmation: '+model.supplyReviews.join(' '):''}`}>
 {ed?<EdwardianManufacturePlan schedule={s}/>:<VictorianManufacturePlan geometry={g}/>}</ManufacturePlanPage>
 <EdwardianTrussCutPage schedule={s} assembly={<TrussAssembly truss={s.truss} count={s.counts.trusses} styleName={style}/>}/>
 {ed?<ManufacturingEdwardianMemberPages groups={[...members.values()]} tiling={s.tiling}/>:<CombinationMemberCutPages members={s.members}/>}
 <EdwardianRingBeamCutPages beams={s.ringBeams}/>
 <section className="em-page cmb-info" data-book-section="plastics"><h2>Fascia &amp; soffit details</h2><p>{roof.fasciaColour} · {roof.soffit} soffit · Reveal Liner fascia.</p><Table head={['Ringbeam','External ply-base edge (mm)']} rows={s.ringBeams.map(b=>[b.manufactureRef,mm(b.cuts.continuous.ply9Base.externalEdgeLengthMM)])}/><p>Total external ringbeam cutting length: <strong>{perimeter}mm</strong>.</p><Table head={['Item','Supply quantity','Units']} rows={supplyRows('plastics')}/><p>Whole stock and shared-offcut allowances, including Summary adjustments. These are not numbered fascia/soffit cutting instructions. Factory venting is completed before despatch.</p></section>
 <section className="em-page cmb-info" data-book-section="gutters"><h2>Guttering details</h2><p>{roof.gutters} · {roof.downpipes}. Corner angles follow the selected side configurations.</p><Table head={['Eaves run','Gutter run (mm)','Straight unions']} rows={s.plastics.guttering.rows.map((r,i)=>[`Run ${i+1}`,mm(r.runM*1000),r.unions])}/><Table head={['Item','Supply quantity','Units']} rows={supplyRows('gutters')}/><p>4m gutter stock is pooled using the established order planner. Straight-run splits require unions; corners use the appropriate bends. Bracket quantities do not add extra brackets for unions or corners. Numbered gutter cutting instructions follow in a later update.</p></section>
 <section className="em-page cmb-checklist" data-book-section="checklist">{model.supplyReviews.map(note=><p key={note} role="status">{note}</p>)}<SummaryIdiotList compact model={model} materials={materials} checklist={s.checklist} inputs={{...inputs,pitchDeg:g.pitchDeg,customerName:roof.customerName,quoteRef:roof.reference,tileSystem:inputs.tileProductId,plasticsColor:roof.fasciaColour,gutterColor:inputs.gutterColour}}/></section>
 <style>{`.cmb-book{font-family:Arial,sans-serif;color:#111827}.cmb-book .em-page{box-sizing:border-box;width:194mm;min-height:275mm;margin:18px auto;padding:4mm;background:white;border:1px solid #cbd5e1;break-after:page}.cmb-book .em-page h2{font-size:16px;margin:0 0 8px}.cmb-book .em-page p{font-size:11px;line-height:1.35}.cmb-book .em-page svg{display:block;width:100%;height:auto}.cmb-book .cmb-front{height:279mm;padding:0}.cmb-info table{width:100%;border-collapse:collapse;margin:12px 0;font-size:11px}.cmb-info th,.cmb-info td{border:1px solid #94a3b8;padding:6px;text-align:left}.cmb-info th{background:#f1f5f9}.cmb-info tr{break-inside:avoid}.cmb-checklist{height:auto;break-after:auto!important}.cmb-book .em-page:last-of-type{break-after:auto}@media print{@page{size:A4;margin:6mm}body{margin:0}.cmb-book .nav-strip{display:none!important}.cmb-book .em-page{margin:0;border:0;width:194mm;min-height:275mm}.cmb-book .cmb-front{padding:0}.cmb-book button{display:none!important}.cmb-book input,.cmb-book textarea{border:0!important}}`}</style>
 </main>;
}
