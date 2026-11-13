import DoubleEdwardianValleyReview from './DoubleEdwardianValleyReview';
import React,{useState,useEffect} from 'react';
import DoubleEdwardianPricing from './DoubleEdwardianPricing';
import {getCustomers} from '../../lib/customers';
import {Link,Navigate} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import {readActiveDesignRecord} from '../../lib/activeDesignRecord';
import {getMaterials} from '../../lib/materials';
import {buildDoubleEdwardianMaterialsModel} from '../../lib/Calculations/doubleEdwardianMaterialsModel';
import {summaryOrderQuantity} from '../../lib/Calculations/summaryOrderQuantity';
import DoubleEdwardianNavigation from './DoubleEdwardianNavigation';
import {DoubleEdwardianPlan} from './DoubleEdwardianDesign';
import SummaryQuoteIdentity from '../../components/SummaryQuoteIdentity';

import {workshopTabs} from './workshopTabs';
const sections={timber:'Timber',tiles:'Tiles and ventilation',metal:'Metalwork',plastics:'Plastics',gutters:'Guttering',misc:'Miscellaneous'};
const number=n=>Number.isFinite(n)?Number(n.toFixed(2)):'—';
const Table=({head,rows})=><table><thead><tr>{head.map(label=><th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((value,j)=><td key={j}>{value}</td>)}</tr>)}</tbody></table>;

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
 useEffect(()=>{if(page!=='technical')return;let active=true;getCustomers().then(rows=>{if(active&&Array.isArray(rows))setCustomers(rows);}).catch(()=>{});return ()=>{active=false;};},[page]);
 const update=patch=>{const next={...inputs,...patch};localStorage.setItem(key,JSON.stringify(next));setInputs(next);};
 const model=buildDoubleEdwardianMaterialsModel({inputs,materials:getMaterials()});
 const title=workshopTabs.find(([id])=>id===page)?.[1];
 return <><DoubleEdwardianNavigation/><main className={page==='plan-manufacture'?'de-workshop de-book':'de-workshop'}>
 {page!=='plan-manufacture'&&<><h1>{title} — Double Hipped Edwardian</h1>
 <SummaryQuoteIdentity inputs={inputs} family="double-edwardian"/></>}
 {!model.valid?<p role="status">{model.errors.join(' ')} <Link to="/quote/double-edwardian">Open Design/Options</Link></p>:<><WorkshopContent page={page} model={model} inputs={inputs}/>{page==='technical'&&<><DoubleEdwardianValleyReview geometry={model.audits.geometry} inputs={inputs} onChange={update}/><DoubleEdwardianPricing detailed inputs={inputs} materials={getMaterials()} customers={customers} onChange={update}/></>}</>}
 <style>{`
 .de-workshop{max-width:1100px;margin:auto;padding:16px;font:14px Inter,system-ui,Arial;color:#111827}
 .de-book .de-sheet{box-sizing:border-box;width:min(100%,194mm);min-height:265mm;margin:18px auto;padding:6mm;border:1px solid #cbd5e1}
 .de-sheet header{border-bottom:1px solid #cbd5e1;padding-bottom:8px}.de-sheet footer{margin-top:18px;border-top:1px solid #cbd5e1;padding-top:6px;font-size:11px}
 @media print{.de-book .de-sheet{width:100%;min-height:0;border:0;margin:0;padding:0;break-after:page}.de-book .de-sheet:last-of-type{break-after:auto}}
 .de-workshop h1{font-size:24px}.de-workshop h2{font-size:17px;margin:18px 0 8px}.de-workshop section{margin-bottom:18px}
 .de-workshop table{border-collapse:collapse;width:100%;font-size:13px}.de-workshop th,.de-workshop td{border:1px solid #cbd5e1;padding:5px 8px;text-align:left}.de-workshop th{background:#f1f5f9}
 @media print{body:has(.de-workshop) .nav-strip,body:has(.de-workshop) .double-edwardian-scope{display:none!important}.de-workshop{max-width:none;padding:0}.de-workshop thead{display:table-header-group}.de-workshop tr,.de-workshop svg{break-inside:avoid}.de-workshop h2{break-after:avoid}}
 `}</style></main></>;
}

function WorkshopContent({page,model,inputs}){
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
 <h2>Calculation notes</h2><ul>{[...model.notes,...model.supplyReviews].map(note=><li key={note}>{note}</li>)}</ul>
 </>;
 const record=readActiveDesignRecord('double-edwardian');
 const ref=inputs.customerReference||'No reference';
 const job=record?.job_number?`Job ${record.job_number}`:record?.quote_number?`Quote ${record.quote_number}`:'Draft';
 const sheet=(title,content)=><section className="de-sheet"><header><h1>{title}</h1><div>Double Hipped Edwardian · {ref} · {job}</div></header>{content}<footer>Timberlite · {ref} · {job}</footer></section>;
 return <>
 {sheet('Manufacture Book',<>
 <p><strong>Workshop review only — not a cutting sheet.</strong> Connection and cut allowances are pending.</p>
 <SummaryQuoteIdentity inputs={inputs} family="double-edwardian"/>
 <Table head={['Roof specification','Value']} rows={[
 ['Internal width × projection',`${g.widthMM} × ${g.projectionMM} mm`],
 ['External ringbeam width × projection',`${g.externalWidthMM} × ${g.externalProjectionMM} mm`],
 ['Pitch / frame',`${g.pitchDeg}° / ${g.frameMM} mm`],
 ['Tiles',`${inputs.tileProductId==='liteSlate'?'LiteSlate':'Britmet'} · ${inputs.tileColour||'—'}`],
 ['Fascia / soffit',`${inputs.fasciaColour||(inputs.plasticsColour==='foiled'?'Foiled':'White')} · ${g.soffitMM} mm requested`],
 ['Guttering',`${inputs.gutterColour||'Black'} · ${inputs.gutterProfile||'square'}`],
 ['Valley',`${inputs.valleySurface||'To confirm'} · ${inputs.valleyFinish?.toUpperCase()||'To confirm'} · outlets: ${inputs.valleyOutlets||'both'}`],
 ['Known installed weight',`${number(model.installedWeightKg)} kg${model.weightComplete?'':' (partial)'}`]
 ]}/>
 </>)}
 {sheet('Roof plan',<DoubleEdwardianPlan geometry={g}/>)}
 {sheet('Member schedule — review',<>
 <p>Estimated slope lengths before connection and cut allowances.</p>
 <Table head={['Member','Type','Estimated slope length (mm)']} rows={memberLengths.map(r=>[r.id,r.kind,number(r.lengthMM)])}/>
 </>)}
 {sheet('Despatch checklist',<><p>Provisional picking quantities. Check before dispatch.</p>{doubleEdwardianPickingRows(model).map(([name,rows])=><section key={name}><h2>{name}</h2><Table head={['Item','Order quantity','Unit','Checked']} rows={rows}/></section>)}</>)}
 </>;
}
