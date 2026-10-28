import VictorianNavigation from './VictorianNavigation';
import {normalizeVictorianFiveDesignInputs} from '../../lib/geometry/victorianFiveDesignInputs';
import {buildVictorianFiveGeometry} from '../../lib/geometry/victorianFiveGeometry';
import {buildVictorianFiveSummaryMaterialsModel} from '../../lib/Calculations/victorianFiveQuotation';
import {victorianBookDraftKey} from '../../lib/victorianBookDraft';
import {readActiveDesignRecord,activateDesignRecord} from '../../lib/activeDesignRecord';
import {updateQuote} from '../../lib/quotes';
import {victorianBookBeams} from '../../lib/Manufacturing/victorianBookBeams';
import VictorianJackSetoutPages from '../../components/VictorianJackSetoutPages';
import {buildVictorianSummaryMaterialsModel} from '../../lib/Calculations/victorianSummaryMaterialsModel';
import {buildVictorianIdiotList} from '../../lib/Calculations/victorianIdiotList';
import SummaryIdiotList from '../../components/SummaryIdiotList';
import {victorianBookIdentity,readVictorianBookDraft} from '../../lib/victorianBookDraft';
import VictorianMemberCutPages from '../../components/VictorianMemberCutPages';
import React,{useState} from 'react';
import {Link,Navigate} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import {getMaterials} from '../../lib/materials';
import {buildVictorianGeometry} from '../../lib/geometry/victorianGeometry';
import {buildVictorianTrussSchedule} from '../../lib/Manufacturing/victorianTrussSchedule';
import {buildVictorianRingBeamProfiles} from '../../lib/Manufacturing/victorianRingBeamProfiles';
import ManufactureBookFront from '../../components/ManufactureBookFront';
import TrussAssembly from '../../components/ManufacturingTrussAssembly';
import {EdwardianTrussCutPage,EdwardianRingBeamCutPages} from '../../components/EdwardianVisualCutPages';
import {VictorianPlan} from './VictorianPlanPreview';
const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'{}');}catch{return {};}};
export default function VictorianManufacture({five=false}={}){return isAdminUser()?<VictorianManufactureContent five={five} key={five?'five':'three'}/>:<Navigate to="/quote" replace/>;}
export function VictorianManufactureContent({five=false}={}){
 const family=five?'victorian-five':'victorian',inputKey=five?'victorianFiveInputs':'victorianPlanPreviewInputs',geometryBuilder=five?buildVictorianFiveGeometry:buildVictorianGeometry,modelBuilder=five?buildVictorianFiveSummaryMaterialsModel:buildVictorianSummaryMaterialsModel;
 const [inputs]=useState(()=>five?normalizeVictorianFiveDesignInputs(read(inputKey)):read(inputKey)),[materials]=useState(getMaterials);
 const identity=victorianBookIdentity(inputs);
const [details,setDetails]=useState(()=>readVictorianBookDraft(inputs)||{delivery_address_json:{deliveryAddress:inputs.deliveryPostcode||''}}),[message,setMessage]=useState('');
 if(!isAdminUser())return <Navigate to="/quote" replace/>;
 const g=geometryBuilder({inputs,materials}),s=buildVictorianTrussSchedule({geometry:g,materials}),r=buildVictorianRingBeamProfiles(g);
 if(!g.valid||!s.valid||!r.valid)return <main><Link to={"/quote/"+family}>← Design/Options</Link><p role="alert">{[...new Set([...(g.errors||[]),...(s.errors||[]),...(r.errors||[])])].join(' ')}</p></main>;
 const model=modelBuilder({inputs,materials}),checklist=buildVictorianIdiotList(model,materials);
 const beams=five?victorianBookBeams(r.beams.map(b=>({...b,upstandArrangement:g.upstandArrangement}))).map(b=>({...b,cuts:{...b.cuts,upstandHeightMM:g.upstandHeightMM}})):r.beams.map(b=>({manufactureRef:b.reference,cuts:{continuous:b.layers,upstandHeightMM:g.upstandHeightMM,upstandArrangement:g.upstandArrangement},bays:b.upstands}));
 const roof={customerName:details.customerName||inputs.customerName||readActiveDesignRecord(family)?.customer_name,reference:details.reference||inputs.customerReference,style:g.style,pitch:`${g.pitchDeg}°`,frame:`${g.frameMM}mm`,dimensions:`${g.widthMM} × ${g.projectionMM}mm`,soffit:g.soffitRequirement==='none'?`No soffit · ${g.soffitProjectionMM}mm compulsory fascia lip`:g.soffitRequirement==='specified'?`${g.requestedSideSoffitMM}mm required envelope · both sides`:`${g.soffitMM}mm · ${g.soffitMode==='standard'?'standard board':'site envelope'}`,tileType:details.tileType||({britmetShingle:'Britmet',metrotileShingle:'Metrotile',liteSlate:'LiteSlate',tapcoSlate:'TapcoSlate'}[inputs.tileProductId]||''),tileColour:details.tileColour||inputs.tileColour,fasciaColour:details.fasciaColour||inputs.fasciaColour,gutters:details.gutters||[inputs.gutterProfile,inputs.gutterColour].filter(Boolean).join(' / '),downpipes:details.downpipes};
 const save=async()=>{
  const key=victorianBookDraftKey(inputs);localStorage.setItem(key,JSON.stringify({design:identity,details}));
  const current=five?readActiveDesignRecord(family):null;
  if(!current||victorianBookIdentity(current.inputs_json||{})!==identity){setMessage('Draft book details saved. Save the design on Design/Options to keep them with the quote.');return;}
  try{const next={...current.inputs_json,[key]:details};const saved=await updateQuote(current.id,{inputs_json:next});if(!saved){setMessage('Book details saved on this device; quote update failed. Please retry.');return;}activateDesignRecord({...current,...saved,inputs_json:next});setMessage('Book details saved with the quote.');}catch{setMessage('Book details saved on this device; quote update failed. Please retry.');}
 };
 return <main className="vm-book"><VictorianNavigation five={five}/>
 <section className="em-page em-front"><ManufactureBookFront roof={roof} details={details} onChange={setDetails} onSave={save} message={message}/></section>
 <details className="vm-controls"><summary>Book details</summary><div className="vm-job-fields">{[['Customer','customerName'],['Reference','reference'],['Tile type','tileType'],['Tile colour','tileColour'],['Fascia / soffit colour','fasciaColour'],['Gutters','gutters'],['Downpipes','downpipes']].map(([label,key])=><label key={key}>{label}<input value={details[key]||''} onChange={e=>setDetails({...details,[key]:e.target.value})}/></label>)}</div></details>
 <section className="em-page vm-plan"><h2>{five?'5 Facet Victorian':'Victorian'} · Roof plan</h2><div className="vm-meta">{roof.reference||'Draft'} · {g.widthMM} × {g.projectionMM}mm · {g.pitchDeg}°</div><VictorianPlan geometry={g}/></section>
 <EdwardianTrussCutPage schedule={s} assembly={<TrussAssembly truss={s.truss} count={s.counts.trusses} styleName={five?'5 Facet Victorian':'Victorian'}/>}/>
 <VictorianMemberCutPages geometry={g} materials={materials}/>{five&&<VictorianJackSetoutPages geometry={g}/>}<div className="vm-upstand-note">9mm ply upstands · {g.upstandArrangement} · {g.upstandHeightMM}mm cut height{g.upstandArrangement==='vertical'?' (195mm visible + 15mm in vertical groove)':''} · 50mm PIR inside · 25×50 finishing lath on top</div><EdwardianRingBeamCutPages beams={beams}/>
 {model.valid?<section className="em-page vm-checklist"><SummaryIdiotList compact model={model} materials={materials} checklist={checklist} inputs={{...inputs,pitchDeg:g.pitchDeg,customerName:roof.customerName,quoteRef:roof.reference,tileSystem:inputs.tileProductId,plasticsColor:roof.fasciaColour,gutterColor:inputs.gutterColour}}/></section>:<p role="alert">Checklist unavailable: {model.errors.join(' ')}</p>}
 <style>{`.vm-book{font-family:Arial,sans-serif;color:#111827}.vm-controls{box-sizing:border-box;max-width:194mm;margin:12px auto;padding:12px}.vm-controls>summary{cursor:pointer;font-size:14px;font-weight:600}.vm-controls[open] .vm-job-fields{margin-top:12px}.vm-controls button{margin-left:18px;padding:8px}.vm-job-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}.vm-job-fields label{font-size:12px}.vm-job-fields input{display:block;width:100%;box-sizing:border-box;padding:6px}.vm-book .em-page{box-sizing:border-box;width:194mm;min-height:275mm;margin:18px auto;padding:4mm;background:white;border:1px solid #cbd5e1;break-after:page}.vm-book .em-page h2{font-size:16px;margin:0 0 6px}.vm-book .em-page svg{display:block;width:100%;height:auto}.vm-book .em-front{padding:0;height:279mm}.vm-meta{font-size:11px}.vm-upstand-note{width:186mm;margin:8px auto;font-size:11px}@media print{.vm-upstand-note{display:none}}.vm-plan>svg{max-height:245mm}.vm-book .em-page:last-of-type{break-after:auto}@media print{@page{size:A4;margin:6mm}body{margin:0}.vm-controls,.nav-strip{display:none!important}.vm-book .em-page{margin:0;border:0;width:194mm;min-height:275mm}.vm-book .em-front{padding:0}}`}</style>
 </main>;
}
