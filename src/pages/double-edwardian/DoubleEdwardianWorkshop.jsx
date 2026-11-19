import {manufactureFrontSupply} from '../documents/documentSupplyNotes';
import {doubleEdwardianTileLabels} from '../../lib/doubleEdwardianTileOptions';
import DoubleEdwardianValleyReview from './DoubleEdwardianValleyReview';
import React,{useState,useEffect} from 'react';
import DoubleEdwardianPricing from './DoubleEdwardianPricing';
import {getCustomers} from '../../lib/customers';
import {Link,Navigate} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import {draftDesignIdentity,readActiveDesignRecord,rememberActiveDesignRecord} from '../../lib/activeDesignRecord';
import {getMaterials} from '../../lib/materials';
import {buildDoubleEdwardianMaterialsModel} from '../../lib/Calculations/doubleEdwardianMaterialsModel';
import {buildDoubleEdwardianMemberReview} from '../../lib/Manufacturing/doubleEdwardianMemberReview';
import {summaryOrderQuantity} from '../../lib/Calculations/summaryOrderQuantity';
import DoubleEdwardianNavigation from './DoubleEdwardianNavigation';
import {DoubleEdwardianPlan} from './DoubleEdwardianDesign';
import {getQuoteById,updateQuote} from '../../lib/quotes';
import ManufacturePlanPage from '../../components/ManufacturePlanPage';
import ManufactureBookFront from '../../components/ManufactureBookFront';
import SummaryQuoteIdentity,{getSummaryQuoteIdentity} from '../../components/SummaryQuoteIdentity';

import {workshopTabs} from './workshopTabs';
const sections={timber:'Timber',tiles:'Tiles and ventilation',metal:'Metalwork',plastics:'Plastics',gutters:'Guttering',misc:'Miscellaneous'};
const number=n=>Number.isFinite(n)?Number(n.toFixed(2)):'—';
const Table=({head,rows})=><table><thead><tr>{head.map(label=><th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((value,j)=><td key={j}>{value}</td>)}</tr>)}</tbody></table>;

function ValleyHipSketch({right,id,length}){
 return <figure style={{margin:0,minWidth:0,flex:1}}><figcaption><strong>{right?'Rear right':'Rear left'} hip · {id}</strong></figcaption>
 <svg viewBox="0 0 200 165" role="img" aria-label="Plan detail from square upper cut to valley long point" style={{width:'100%',maxWidth:290,display:'block'}}>
 <g transform={right?'translate(200 0) scale(-1 1)':undefined} stroke="#334155" strokeLinejoin="round">
 <rect x="24" y="75" width="20" height="77" fill="#fde68a"/>
 <path d="M44 138 V110 L140 14 L154 28 Z" fill="#e5c4aa"/>
 <path d="M44 138 L52 146 M154 28 L162 36 M52 146 L162 36" fill="none"/>
 <path d="M52 146 L55 138 L60 143 Z M162 36 L159 44 L154 39 Z" fill="#334155"/>
 </g>
 <circle cx={right?156:44} cy="138" r="2.5" fill="#111827"/>
 <text x={right?126:74} y="158" fontSize="10" textAnchor="middle">Valley plate</text>
 </svg>
 <p>{Number.isFinite(length)?<><strong>{number(length)} mm</strong> along the slope</>:'Reference length pending'}</p></figure>;
}

function ValleyPlateSeating({geometry:g}){
 const rise=56*Math.tan(g.pitchDeg*Math.PI/180),flatY=43,toeY=flatY+rise,seatY=toeY+28;
 const caption={margin:'12px 0 4px',fontWeight:700};
 return <>
 <p><strong>Assembly reference · schematic, not to scale.</strong> Both side ringbeams run to the house wall. The valley plate sits on top of their rear ends.</p>
 <p style={caption}>Rear elevation — plate end profiles</p>
 <svg viewBox={`0 0 540 ${seatY+43}`} role="img" aria-label="Rear elevation of the valley plate seated on both ringbeams" style={{width:'100%',display:'block'}}>
 <g stroke="#334155" strokeLinejoin="round">
 <rect x="54" y={seatY} width="58" height="16" fill="#cbd5e1"/>
 <rect x="428" y={seatY} width="58" height="16" fill="#cbd5e1"/>
 <path d={`M54 ${seatY} V${toeY} L110 ${flatY} H430 L486 ${toeY} V${seatY} Z`} fill="#e5c4aa"/>
 </g>
 <g textAnchor="middle" fontSize="12" fill="#111827">
 <text x="82" y="25">Left facet · {number(g.pitchDeg)}°</text><text x="458" y="25">Right facet · {number(g.pitchDeg)}°</text>
 <text x="270" y={flatY+23}>Valley plate · flat centre</text>
 <text x="83" y={seatY+34}>Left ringbeam</text><text x="457" y={seatY+34}>Right ringbeam</text>
 </g>
 </svg>
 <p>Shape each top end to match the foot profile of the adjoining side rafter at that facet’s pitch.</p>
 <p style={caption}>Plan — seating at the house wall</p>
 <svg viewBox="0 0 540 142" role="img" aria-label="Plan showing both ringbeams continuing under the valley plate to the house wall" style={{width:'100%',display:'block'}}>
 <g stroke="#334155">
 <path d="M54 30 H112 V117 H54 Z M428 30 H486 V117 H428 Z" fill="#cbd5e1"/>
 <rect x="54" y="30" width="432" height="24" fill="#e5c4aa"/>
 <path d="M112 31 V54 M428 31 V54" strokeDasharray="3 3"/>
 <path d="M39 30 H501" strokeWidth="2"/>
 </g>
 <g textAnchor="middle" fontSize="12" fill="#111827">
 <text x="270" y="19">House wall</text><text x="270" y="47">Valley plate · {number(g.plateThicknessMM)} mm thick</text>
 <text x="83" y="134">Left ringbeam</text><text x="457" y="134">Right ringbeam</text>
 </g>
 </svg>
 </>;
}

export function doubleEdwardianPickingRows(model){
 return Object.entries(model.sections).map(([key,{lines}])=>[sections[key],lines.filter(row=>!row.excluded&&row.supplyToSite!==false&&summaryOrderQuantity(row)>0).map(row=>[row.label,number(summaryOrderQuantity(row)),row.units,'☐'])]).filter(([,rows])=>rows.length);
}

export default function DoubleEdwardianWorkshop({page}){
 if(!isAdminUser())return <Navigate to="/quote" replace/>;
 return <WorkshopPage key={page} page={page}/>;
}
function WorkshopPage({page}){
 const key='doubleEdwardianGeometryDraft';
 const [inputs,setInputs]=useState(()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{return {};}});
 const [customers,setCustomers]=useState([]);
 useEffect(()=>{if(page!=='technical'&&page!=='plan-manufacture')return;let active=true;getCustomers().then(rows=>{if(active&&Array.isArray(rows))setCustomers(rows);}).catch(()=>{});return ()=>{active=false;};},[page]);
 const update=patch=>{const next={...inputs,...patch};localStorage.setItem(key,JSON.stringify(next));setInputs(next);};
 const model=buildDoubleEdwardianMaterialsModel({inputs,materials:getMaterials()});
 const title=workshopTabs.find(([id])=>id===page)?.[1];
 return <><DoubleEdwardianNavigation showScope={page!=='plan-manufacture'}/><main className={page==='plan-manufacture'?'de-workshop de-book':'de-workshop'}>
 {page!=='plan-manufacture'&&<><h1>{title} — Double Hipped Edwardian</h1>
 <SummaryQuoteIdentity inputs={inputs} family="double-edwardian"/></>}
 {!model.valid?<p role="status">{model.errors.join(' ')} <Link to="/quote/double-edwardian">Open Design/Options</Link></p>:<><WorkshopContent page={page} model={model} inputs={inputs} customers={customers}/>{page==='technical'&&<><DoubleEdwardianValleyReview geometry={model.audits.geometry} inputs={inputs} onChange={update}/><DoubleEdwardianPricing detailed inputs={inputs} materials={getMaterials()} customers={customers} onChange={update}/></>}</>}
 <style>{`
 .de-workshop{max-width:1100px;margin:auto;padding:16px;font:14px Inter,system-ui,Arial;color:#111827}
 .de-book .de-front{width:min(100%,194mm);margin:18px auto;break-after:page}
 @media print{@page{size:A4;margin:6mm}body:has(.de-book){margin:0}.de-book .de-front{margin:0 auto;break-inside:avoid}}
 .de-book .de-sheet{box-sizing:border-box;width:min(100%,194mm);min-height:265mm;margin:18px auto;padding:6mm;border:1px solid #cbd5e1}
 .de-sheet header{border-bottom:1px solid #cbd5e1;padding-bottom:8px}.de-sheet footer{margin-top:18px;border-top:1px solid #cbd5e1;padding-top:6px;font-size:11px}
 @media print{.de-book .de-sheet{width:100%;min-height:0;border:0;margin:0;padding:0;break-after:page}.de-book .de-sheet:last-of-type{break-after:auto}}
 .de-workshop h1{font-size:24px}.de-workshop h2{font-size:17px;margin:18px 0 8px}.de-workshop section{margin-bottom:18px}
 .de-workshop table{border-collapse:collapse;width:100%;font-size:13px}.de-workshop th,.de-workshop td{border:1px solid #cbd5e1;padding:5px 8px;text-align:left}.de-workshop th{background:#f1f5f9}
 @media print{body:has(.de-workshop) .nav-strip,body:has(.de-workshop) .double-edwardian-scope{display:none!important}.de-workshop{max-width:none;padding:0}.de-workshop thead{display:table-header-group}.de-workshop tr,.de-workshop svg{break-inside:avoid}.de-workshop h2{break-after:avoid}}
 `}</style></main></>;
}

function WorkshopContent({page,model,inputs,customers}){
 const {geometry:g,tiles,memberLengths,internalLaths,lathPlan}=model.audits;
 const tileLine=model.sections.tiles.lines.find(r=>r.key==='double_tiles');
 if(page==='idiot-list')return <>
 <p><strong>Provisional picking list.</strong> Check the quantities before dispatch. Factory-use materials and items excluded in Summary are omitted.</p>
 {(!inputs.valleySurface||!inputs.valleyFinish)&&<p>Valley material choices are incomplete. Check Design/Options before picking waterproofing supplies.</p>}
 {inputs.valleyFinish==='grp'&&<p>GRP supplies are priced and picked separately.</p>}
 {doubleEdwardianPickingRows(model).map(([name,rows])=><section key={name}><h2>{name}</h2><Table head={['Item','Order quantity','Unit','Checked']} rows={rows}/></section>)}
 </>;
 if(page==='tiles-laths')return <>
 <p>Main tile estimate: <strong>{tileLine.qty}</strong>{tileLine.excluded?' (excluded from supply)':''}. The rear estimate omits the lowest course. Lath positions are for review pending workshop confirmation.</p>
 {tiles.result.facets.map(r=><section key={r.facet.id}><h2>{r.facet.label}</h2>
 <p>{r.courses.length} tile courses · {number(r.tileQuantityRaw)} calculated tiles before whole-roof rounding/allowance where applicable.</p>
 <Table head={['Lath','Distance up slope (mm)','Width (mm)']} rows={r.lathRows.map(l=>[l.index,number(l.yMM),number(l.widthMM)])}/></section>)}
 </>;
 if(page==='technical')return <>
 <h2>Geometry and quantities</h2>
 <Table head={['Check','Value']} rows={[
 ['Internal width × projection',`${g.widthMM} × ${g.projectionMM} mm`],
 ['External ringbeam width × projection',`${g.externalWidthMM} × ${g.externalProjectionMM} mm`],
 ['Pitch',`${g.pitchDeg}°`],['Ridge',`${g.ridgeOrientation} · ${number(g.ridgeLengthMM)} mm`],
 ['Rear support fittings',`${g.layout.hangers.variable} variable joist hangers · ${g.layout.hangers.hip} hip hangers`],
 ['Internal lath runs',internalLaths.length],['Pooled lath stock',lathPlan.qty],
 ['Known installed weight',`${number(model.installedWeightKg)} kg${model.weightComplete?'':' (partial)'}`]
 ]}/>
 <details><summary>Member positions, spacing and support details</summary><p>R1 is the valley plate. Member numbers proceed counter-clockwise from the rear left corner, followed by the ridge and then left, front and right ringbeams. Positions use the internal outline; no cut allowances are included.</p>
 {g.layout.groups.map(f=><p key={f.id}><strong>{f.name}</strong> — {f.origin}. Centres: {f.centresMM.map(number).join(' · ')} mm. Gaps including end boundaries: {f.gapsMM.map(number).join(' · ')} mm.</p>)}
 <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr>{['Member','Type','Facet','Position (mm)','Rear fitting'].map(h=><th key={h} style={{border:'1px solid #cbd5e1',padding:5,textAlign:'left'}}>{h}</th>)}</tr></thead><tbody>{g.layout.members.map(r=><tr key={r.id}>{[r.id,r.kind,r.facet||'Corner',r.positionMM==null?'—':number(r.positionMM),r.rearSupport||'—'].map((v,i)=><td key={i} style={{border:'1px solid #cbd5e1',padding:5}}>{v}</td>)}</tr>)}</tbody></table></div>
 <p>Matched opposing truss legs: {g.layout.trusses.map(t=>`${t.id}: ${t.legs.join(' / ')}`).join(' · ')||'None'}.</p><p>{g.layout.ridge?`${g.layout.ridge.id}: Ridge. `:''}{g.layout.ringbeams.map(r=>`${r.id}: ${r.kind}`).join(' · ')}.</p></details>
 <h2>Member length comparison</h2>
 <p>Review only. Valley members end at the roof-facing side of the {g.plateThicknessMM} mm plate. Rear hips are measured to the long point at that face. Open eaves retain their existing foot geometry. The comparison applies the regular Edwardian connection allowances. The Manufacture Book uses the reviewed dimensions for the member types checked against the factory roof.</p>
 <Table head={['Member','Type','Lower end','Previous estimate (mm)','Review length (mm)','Upper end']} rows={buildDoubleEdwardianMemberReview(g,memberLengths).map(r=>[r.id,r.kind,r.lowerEnd,number(r.lengthMM),number(r.reviewLengthMM),r.basis])}/>
 <h2>Calculation notes</h2><ul>{[...model.notes,...model.supplyReviews].map(note=><li key={note}>{note}</li>)}</ul>
 </>;
 const memberReview=buildDoubleEdwardianMemberReview(g,memberLengths);
 const rearHips=memberReview.filter(row=>row.kind==='Hip'&&row.lowerEnd==='Valley plate long point');
 const scheduledMembers=memberReview.map(row=>{
  const standardTruss=row.kind==='Rafter / truss leg'&&row.lowerEnd==='Open eaves';
  const valleyRafter=(row.kind==='Jack rafter'||row.kind==='Boss rafter')&&row.lowerEnd==='Valley plate face';
  const rearHip=row.kind==='Hip'&&row.lowerEnd==='Valley plate long point';
  const reviewed=standardTruss||valleyRafter||rearHip;
  return [row.id,row.kind,row.lowerEnd,reviewed&&Number.isFinite(row.reviewLengthMM)?number(row.reviewLengthMM):'Pending'];
 });
 const record=readActiveDesignRecord('double-edwardian');
 const customerId=inputs.selectedCustomerId||record?.customer_id;
 const customer=customers.find(row=>String(row.id)===String(customerId));
 const identity=getSummaryQuoteIdentity({inputs,family:'double-edwardian',customer});
 const {eaves}=model.audits;
 const mm=value=>Number(value).toFixed(1);
 const product=inputs.tileProductId||'britmetShingle';
 const valleyFinish=inputs.valleyFinish?.toUpperCase();
 const roof={
  customerName:identity.customerName,
  reference:identity.reference,
  style:identity.roofLabel,
  pitch:`${mm(g.pitchDeg)}°`,
  frame:`${mm(g.frameMM)}mm`,
  tileType:product.endsWith('Shingle')?`${doubleEdwardianTileLabels[product]} Shingle`:doubleEdwardianTileLabels[product],
  tileColour:inputs.tileColour,
  fasciaColour:inputs.fasciaColour||(inputs.plasticsColour==='foiled'?'Foiled':'White'),
  soffit:`Sides ${mm(eaves.left.manufacturedSoffitMM)}/${mm(eaves.right.manufacturedSoffitMM)}mm · front ${mm(eaves.effectiveReferenceSoffitMM)}mm`,
  gutters:`${inputs.gutterProfile||'square'} · ${inputs.gutterColour||'Black'}`,
  downpipes:'One round downpipe assembly',
  boxGutters:['Rear valley',valleyFinish,inputs.valleyOutlets&&`outlets: ${inputs.valleyOutlets}`].filter(Boolean).join(' · '),
 };
 const facets=[
  {label:'Front',pitch:roof.pitch,support:`${mm(g.frameMM)} mm frame`,soffit:`${mm(eaves.effectiveReferenceSoffitMM)} mm`},
  ...['left','right'].map(side=>({
   label:side==='left'?'Left Side':'Right Side',
   pitch:roof.pitch,
   support:`${mm(g.frameMM)} mm frame`,
   soffit:`${mm(eaves[side].manufacturedSoffitMM)} mm`,
  })),
  {label:'Rear / Valley',pitch:roof.pitch,support:`${g.plateThicknessMM} mm valley plate`,soffit:'—'},
 ];
 const ref=inputs.customerReference||'No reference';
 const job=record?.job_number?`Job ${record.job_number}`:record?.quote_number?`Quote ${record.quote_number}`:'Draft';
 const sheet=(title,content)=><section className="de-sheet"><header><h1>{title}</h1><div>Double Hipped Edwardian · {ref} · {job}</div></header>{content}<footer>Timberlite · {ref} · {job}</footer></section>;
 return <>
 <DoubleEdwardianBookFront supply={manufactureFrontSupply(inputs,getMaterials(),'double-edwardian')} roof={roof} record={record}/>
 <ManufacturePlanPage
  details={{
   customer:roof.customerName,reference:roof.reference,roof:roof.style,frame:roof.frame,
   tiles:[roof.tileType,roof.tileColour].filter(Boolean).join(' — '),
   fascia:roof.fasciaColour,gutter:roof.gutters,
   weight:`${mm(model.installedWeightKg)} kg${model.weightComplete?' incl. plasterboard':' incl. plasterboard (partial)'}`,
  }}
  facets={facets}
 >
  <DoubleEdwardianPlan geometry={g} valleyFinish={inputs.valleyFinish}/>
 </ManufacturePlanPage>
 {sheet('Member schedule — review',<>
 <p>Lengths run along the top edge of the sloping timber. For rear hips, measure along the long edge to the long point at the valley plate face.</p>
 <Table head={['Member','Type','Lower end','Reviewed length (mm)']} rows={scheduledMembers}/>
 </>)}
 {sheet('Valley plate — seating and end profiles',<ValleyPlateSeating geometry={g}/>)}
 {sheet('Rear hip — square upper cut to valley long point',<>
 <p><strong>Reference dimensions only.</strong> The sketches show the left and right cuts in plan. Each dimension is measured along the long edge of the sloping timber, from the square upper cut to the long point at the valley plate face.</p>
 <div style={{display:'flex',gap:16}}>{rearHips.map((r,i)=><ValleyHipSketch key={r.id} right={i===1} id={r.id} length={r.reviewLengthMM}/>)}</div>
 </>)}
 {sheet('Despatch checklist',<><p>Provisional picking quantities. Check before dispatch.</p>{doubleEdwardianPickingRows(model).map(([name,rows])=><section key={name}><h2>{name}</h2><Table head={['Item','Order quantity','Unit','Checked']} rows={rows}/></section>)}</>)}
 </>;
}

function DoubleEdwardianBookFront({roof,record,supply}){
 const draftKey='doubleEdwardianBookDetails';
 const [job,setJob]=useState(null);
 const [message,setMessage]=useState('');
 const [saving,setSaving]=useState(false);
 const [details,setDetails]=useState(()=>{
  if(record)return {};
  try{
   const saved=JSON.parse(localStorage.getItem(draftKey)||'{}');
   return saved.draftId===draftDesignIdentity()?saved.details||{}:{};
  }catch{return {};}
 });
 const recordId=record?.id;
 useEffect(()=>{
  let active=true;
  if(recordId)getQuoteById(recordId).then(row=>{
   if(!active)return;
   if(!row){setMessage('Job details could not be loaded.');return;}
   setJob(row);
   setDetails({
    job_number:row.job_number||'',
    requested_delivery_date:row.requested_delivery_date||'',
    order_notes:row.order_notes||'',
    delivery_address_json:row.delivery_address_json||{},
   });
  }).catch(()=>{if(active)setMessage('Job details could not be loaded.');});
  return ()=>{active=false;};
 },[recordId]);
 const save=async()=>{
  if(recordId&&!job)return;
  setSaving(true);
  try{
   if(job){
    const result=await updateQuote(job.id,details);
    if(!result)throw new Error('Job details could not be saved.');
    setJob(result);
    rememberActiveDesignRecord({...record,...result});
   }else{
    localStorage.setItem(draftKey,JSON.stringify({draftId:draftDesignIdentity(),details}));
   }
   setMessage(job?'Job details saved.':'Draft book details saved on this device.');
  }catch{
   setMessage('Book details could not be saved. Please try again.');
  }finally{setSaving(false);}
 };
 if(recordId&&!job)return <section className="de-front"><p role="status">{message||'Loading job details…'}</p></section>;
 return <section className="de-front">
  <ManufactureBookFront supply={supply} roof={roof} job={job} details={details} onChange={setDetails} onSave={save} message={message} saving={saving}/>
 </section>;
}
