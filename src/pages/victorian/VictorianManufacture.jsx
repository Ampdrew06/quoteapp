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
export default function VictorianManufacture(){
 const [inputs]=useState(()=>read('victorianPlanPreviewInputs')),[materials]=useState(getMaterials);
 const identity=victorianBookIdentity(inputs);
const [details,setDetails]=useState(()=>readVictorianBookDraft(inputs)||{delivery_address_json:{deliveryAddress:inputs.deliveryPostcode||''}}),[message,setMessage]=useState('');
 if(!isAdminUser())return <Navigate to="/quote" replace/>;
 const g=buildVictorianGeometry({inputs,materials}),s=buildVictorianTrussSchedule({geometry:g,materials}),r=buildVictorianRingBeamProfiles(g);
 if(!g.valid||!s.valid||!r.valid)return <main><Link to="/quote/victorian">← Design/Options</Link><p role="alert">{[...new Set([...(g.errors||[]),...(s.errors||[]),...(r.errors||[])])].join(' ')}</p></main>;
 const model=buildVictorianSummaryMaterialsModel({inputs,materials}),checklist=buildVictorianIdiotList(model,materials);
 const beams=r.beams.map(b=>({manufactureRef:b.reference,cuts:{continuous:b.layers,upstandHeightMM:g.upstandHeightMM,upstandArrangement:g.upstandArrangement},bays:b.upstands}));
 const roof={customerName:details.customerName||inputs.customerName,reference:details.reference||inputs.customerReference,style:g.style,pitch:`${g.pitchDeg}°`,frame:`${g.frameMM}mm`,dimensions:`${g.widthMM} × ${g.projectionMM}mm`,soffit:`${g.soffitMM}mm · ${g.soffitMode==='standard'?'standard board':'site envelope'}`,tileType:details.tileType||({britmetShingle:'Britmet',metrotileShingle:'Metrotile',liteSlate:'LiteSlate',tapcoSlate:'TapcoSlate'}[inputs.tileProductId]||''),tileColour:details.tileColour||inputs.tileColour,fasciaColour:details.fasciaColour||inputs.fasciaColour,gutters:details.gutters||[inputs.gutterProfile,inputs.gutterColour].filter(Boolean).join(' / '),downpipes:details.downpipes};
 const save=()=>{localStorage.setItem('victorianBookDetails',JSON.stringify({design:identity,details}));setMessage('Draft book details saved.');};
 return <main className="vm-book"><div className="vm-controls"><Link to="/quote/victorian">← Design/Options</Link><button onClick={()=>window.print()}>Print manufacture book</button><p>Draft book: accepted plan, trusses and ring-beams. Jack cutting pages remain pending.</p><div className="vm-job-fields">{[['Customer','customerName'],['Reference','reference'],['Tile type','tileType'],['Tile colour','tileColour'],['Fascia / soffit colour','fasciaColour'],['Gutters','gutters'],['Downpipes','downpipes']].map(([label,key])=><label key={key}>{label}<input value={details[key]||''} onChange={e=>setDetails({...details,[key]:e.target.value})}/></label>)}</div></div>
 <section className="em-page em-front"><ManufactureBookFront roof={roof} details={details} onChange={setDetails} onSave={save} message={message}/></section>
 <section className="em-page vm-plan"><h2>Victorian · Roof plan</h2><div className="vm-meta">{roof.reference||'Draft'} · {g.widthMM} × {g.projectionMM}mm · {g.pitchDeg}°</div><VictorianPlan geometry={g}/></section>
 <EdwardianTrussCutPage schedule={s} assembly={<TrussAssembly truss={s.truss} count={s.counts.trusses} styleName="Victorian"/>}/>
 <VictorianMemberCutPages geometry={g} materials={materials}/><div className="vm-upstand-note">9mm ply upstands · {g.upstandArrangement} · {g.upstandHeightMM}mm cut height{g.upstandArrangement==='vertical'?' (195mm visible + 15mm in vertical groove)':''} · 50mm PIR inside · 25×50 finishing lath on top</div><EdwardianRingBeamCutPages beams={beams}/>
 {model.valid?<section className="em-page vm-checklist"><SummaryIdiotList compact model={model} materials={materials} checklist={checklist} inputs={{...inputs,pitchDeg:g.pitchDeg,customerName:roof.customerName,quoteRef:roof.reference,tileSystem:inputs.tileProductId,plasticsColor:roof.fasciaColour,gutterColor:inputs.gutterColour}}/></section>:<p role="alert">Checklist unavailable: {model.errors.join(' ')}</p>}
 <style>{`.vm-book{font-family:Arial,sans-serif;color:#111827}.vm-controls{max-width:1000px;margin:16px auto;padding:12px}.vm-controls button{margin-left:18px;padding:8px}.vm-job-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}.vm-job-fields label{font-size:12px}.vm-job-fields input{display:block;width:100%;box-sizing:border-box;padding:6px}.vm-book .em-page{box-sizing:border-box;width:194mm;min-height:275mm;margin:18px auto;padding:4mm;background:white;border:1px solid #cbd5e1;break-after:page}.vm-book .em-page h2{font-size:16px;margin:0 0 6px}.vm-book .em-page svg{display:block;width:100%;height:auto}.vm-book .em-front{padding:0;height:279mm}.vm-meta{font-size:11px}.vm-upstand-note{width:186mm;margin:8px auto;font-size:11px}@media print{.vm-upstand-note{display:none}}.vm-plan>svg{max-height:245mm}.vm-book .em-page:last-of-type{break-after:auto}@media print{@page{size:A4;margin:6mm}body{margin:0}.vm-controls,.nav-strip{display:none!important}.vm-book .em-page{margin:0;border:0;width:194mm;min-height:275mm}.vm-book .em-front{padding:0}}`}</style>
 </main>;
}
