import {doubleEdwardianTileLabels,DEFAULT_METROTILE_CARRIAGE_GBP} from '../../lib/doubleEdwardianTileOptions';
import {tileColoursFor} from '../../lib/tileColours';
import DoubleEdwardianValleyReview from './DoubleEdwardianValleyReview';
import CustomerPicker from '../../components/CustomerPicker';
import FrameThicknessEditor from '../../components/FrameThicknessEditor';
import DoubleEdwardianNavigation from './DoubleEdwardianNavigation';
import DoubleEdwardianActions from './DoubleEdwardianActions';
import DoubleEdwardianPricing from './DoubleEdwardianPricing';
import {getMaterials} from '../../lib/materials';
import {getCustomers} from '../../lib/customers';
import DoubleEdwardianMemberEditor from './DoubleEdwardianMemberEditor';
import React,{useState,useEffect} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import {buildDoubleEdwardianGeometry,doubleEdwardianDefaults} from '../../lib/geometry/doubleEdwardianGeometry';
const KEY='doubleEdwardianGeometryDraft';
const mm=n=>Number(n.toFixed(1));
const card={border:'1px solid #e5e7eb',borderRadius:12,padding:12,marginTop:16,background:'#fff'};
export function DoubleEdwardianPlan({geometry:g,valleyFinish}){
 if(!g?.valid||!g.layout?.hangers)return null;
 const width=940;
 const s=Math.min(720/g.externalWidthMM,490/g.externalProjectionMM);
 const left=(width-g.externalWidthMM*s)/2;
 const x=v=>left+(v+g.extensionMM)*s,y=v=>118+v*s;
 const footprintBottom=y(g.externalProjectionMM);
 const dimensionBottom=footprintBottom+64;
 const diagramHeight=dimensionBottom+18;
 const bandTop=y(0)-20;
 const line=(a,b,colour='#111827',width=2)=><line x1={x(a.x)} y1={y(a.y)} x2={x(b.x)} y2={y(b.y)} stroke={colour} strokeWidth={width}/>;
 const dim=(x1,y1,x2,y2,text,vertical=false)=><g stroke="#334155" strokeWidth="0.7"><line x1={x1} y1={y1} x2={x2} y2={y2} markerStart="url(#double-ed-arrow)" markerEnd="url(#double-ed-arrow)"/><text stroke="none" fill="#111827" textAnchor="middle" fontSize="12" x={vertical?0:(x1+x2)/2} y={vertical?0:y1-8} transform={vertical?`translate(${x1-10} ${(y1+y2)/2}) rotate(-90)`:undefined}>{text}</text></g>;
 return <svg viewBox={`0 0 ${width} ${diagramHeight}`} role="img" aria-label="Double Hipped Edwardian plan, valley plate at rear" style={{display:'block',width:'100%',height:'auto',fontFamily:'Inter,system-ui,Arial'}}><defs><marker id="double-ed-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9 Z" fill="#fff" stroke="#334155" strokeLinejoin="round"/></marker></defs>
 <text x={width/2} y="23" textAnchor="middle" fontSize="13" fontWeight="600">Rear / valley side</text>
 <rect x={x(-g.extensionMM)} y={y(0)} width={g.externalWidthMM*s} height={g.externalProjectionMM*s} fill="#f8fafc" stroke="#94a3b8"/>
 <rect x={x(0)} y={y(0)} width={g.widthMM*s} height={g.projectionMM*s} fill="none" stroke="#111827" strokeWidth="2"/>
 <rect x={left} y={bandTop} width={g.externalWidthMM*s} height="20" fill="none" stroke="#111827"/>
 <text x={width/2} y={bandTop+10} dominantBaseline="central" textAnchor="middle" fontSize="11">{valleyFinish==='epdm'?'EPDM Rubber/OSB Valley':'OSB Valley'}</text>
 {g.layout.members.map(r=><g key={r.id}>{line(r.start,r.end,r.kind==='Hip'?'#111827':'#2563eb',r.kind==='Hip'?2:1.3)}<text x={x((r.start.x+r.end.x)/2)+5} y={y((r.start.y+r.end.y)/2)-5} fontSize="10" fill={r.kind==='Hip'?'#111827':'#2563eb'}>{r.id}</text></g>)}{line(...g.ridge)}{g.layout.ridge&&<text x={x((g.ridge[0].x+g.ridge[1].x)/2)+8} y={y((g.ridge[0].y+g.ridge[1].y)/2)-8} fontSize="10" fill="#111827">{g.layout.ridge.id}</text>}
 {g.layout.groups.map(f=>f.centresMM.map((t,index)=>{const a=f.point(t),left=f.id==='left',right=f.id==='right',rear=f.id==='rear';return <text key={f.id+t} x={x(a.x)+(left?-(10+index%2*18):right?10+index%2*18:0)} y={y(a.y)+(rear?-(25+index%2*12):f.id==='front'?16+index%2*12:3)} textAnchor={left?'end':right?'start':'middle'} fontSize="9" fill="#334155">{mm(t)}</text>;}))}
 {g.facets.map(f=>{const c=f.vertices.reduce((r,a)=>({x:r.x+a.x/4,y:r.y+a.y/4}),{x:0,y:0});return <text key={f.name} x={x(c.x)} y={y(c.y)+12} textAnchor="middle" fontSize="16" fontWeight="bold">{g.pitchDeg}°</text>;})}
 {dim(x(0),55,x(g.widthMM),55,`${mm(g.widthMM)} int`)}{dim(x(-g.extensionMM),dimensionBottom,x(g.widthMM+g.extensionMM),dimensionBottom,`${mm(g.externalWidthMM)} ext`)}
 {dim(x(g.widthMM+g.extensionMM)+80,bandTop,x(g.widthMM+g.extensionMM)+80,y(g.projectionMM),`${mm(g.projectionMM)} int`,true)}
 {dim(x(-g.extensionMM)-45,bandTop,x(-g.extensionMM)-45,y(g.externalProjectionMM),`${mm(g.externalProjectionMM)} ext`,true)}
 </svg>;
}
export default function DoubleEdwardianDesign(){
 const location=useLocation();
 const [inputs,setInputs]=useState(()=>{if(location.state?.fresh)return {...doubleEdwardianDefaults};try{return {...doubleEdwardianDefaults,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{return {...doubleEdwardianDefaults};}});
 useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(inputs));},[inputs]);
 const [editing,setEditing]=useState(false);
 const [materials,setMaterials]=useState(getMaterials),[customers,setCustomers]=useState([]);
 useEffect(()=>{let alive=true;getCustomers().then(rows=>{if(alive)setCustomers(Array.isArray(rows)?rows:[]);}).catch(()=>{});const refresh=()=>setMaterials(getMaterials());window.addEventListener('materials_updated',refresh);return()=>{alive=false;window.removeEventListener('materials_updated',refresh);};},[]);
 if(!isAdminUser())return <main style={{padding:20}}><Link to="/quote">Home</Link><p>This geometry preview is available to admin.</p></main>;
 const g=buildDoubleEdwardianGeometry(inputs);
 const layoutReady=g.valid&&Boolean(g.layout?.hangers);
 const quoted=Boolean(inputs.quoteDisplayed)&&layoutReady;
 const defaultTileColour=product=>tileColoursFor(product)[0];
 const quoteInputs={...inputs,tileColour:inputs.tileColour||defaultTileColour(inputs.tileProductId),fasciaColour:inputs.fasciaColour||(inputs.plasticsColour==='foiled'?'Foiled (unspecified)':'White'),gutterColour:inputs.gutterColour||'Black'};
 const patch=values=>setInputs(old=>({...old,...values}));
 const inputStyle={display:'block',width:'100%',height:34,padding:'5px 8px',border:'1px solid #d1d5db',borderRadius:8,boxSizing:'border-box'};
 const field=(label,key,type='number')=><label>{label}<input aria-label={label} style={inputStyle} type={type} min={type==='number'?0:undefined} step={type==='number'?'any':undefined} value={inputs[key]??''} onChange={e=>patch({[key]:e.target.value,...(['widthMM','projMM','pitchDeg','soffitMM'].includes(key)?{memberPositionsMM:undefined,summaryPricingState:undefined}:key==='deliveryPostcode'?{deliveryDistanceMiles:undefined,deliveryDistancePostcode:undefined}:{})})}/></label>;
 const select=(label,key,options,onSelect=value=>patch({[key]:value}))=><label>{label}<select style={inputStyle} value={inputs[key]||(key==='fasciaColour'&&inputs.plasticsColour==='foiled'?'Foiled (unspecified)':options[0][0])} onChange={e=>onSelect(e.target.value)}>{options.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></label>;
 const colourOptions=names=>names.map(name=>[name,name]);
 const tileColours=tileColoursFor(inputs.tileProductId,inputs.tileColour);
 return <><DoubleEdwardianNavigation showScope={false}/><main className="de-design" style={{maxWidth:1100,margin:'auto',padding:16,fontFamily:'Inter,system-ui,Arial',fontSize:13}}>
 <h1 style={{fontSize:24}}>Timberlite Double Hipped Edwardian</h1>
 <p>Enter your sizes and options below. We’ll show a plan preview and your price. Frame thickness defaults to 70 mm; please confirm this when ordering.</p>
 <section style={card}>
 {quoted&&<button type="button" className="de-edit" aria-expanded={editing} aria-controls="de-quote-fields" onClick={()=>setEditing(value=>!value)}>Edit {editing?'▴':'▾'}</button>}
 <div id="de-quote-fields" hidden={quoted&&!editing}><div className="de-design-grid">
 {field('Width (internal, mm)','widthMM')}{field('Projection (internal, mm)','projMM')}
 {select('Tile system','tileProductId',Object.entries(doubleEdwardianTileLabels),value=>patch({tileProductId:value,tileColour:defaultTileColour(value),summaryPricingState:undefined}))}
 {select('Tile colour','tileColour',colourOptions(tileColours))}
 {select('Fascia / soffit colour','fasciaColour',colourOptions(['White','Rosewood','Black','Anthracite','Light Oak','Cream','Foiled (unspecified)']),value=>patch({fasciaColour:value,plasticsColour:value==='White'?'white':'foiled'}))}
 {field('Soffit — open sides (mm)','soffitMM')}
 {select('Gutter profile','gutterProfile',[['square','Square'],['ogee','Ogee'],['round','Round']],value=>patch({gutterProfile:value,summaryPricingState:undefined}))}
 {select('Gutter colour','gutterColour',colourOptions(['Black','White','Anthracite','Brown']))}
 {field('Pitch (degrees)','pitchDeg')}
 <fieldset className="de-outlets"><legend>Valley outlets required</legend>
 {['left','right'].map(side=><label key={side}><input type="checkbox" checked={['both',side].includes(inputs.valleyOutlets||'both')} onChange={e=>{
  const other=side==='left'?'right':'left';
  const keepOther=['both',other].includes(inputs.valleyOutlets||'both');
  patch({valleyOutlets:e.target.checked?(keepOther?'both':side):(keepOther?other:'none')});
 }}/> {side==='left'?'Left':'Right'}</label>)}
 </fieldset>
 </div>
 {inputs.tileProductId==='metrotileShingle'&&<div style={{marginTop:12}}>
 <label>Metrotile supplier carriage (£, ex VAT)
 <input aria-label="Metrotile supplier carriage (£, ex VAT)" style={{...inputStyle,maxWidth:220}} type="number" min="0" step="0.01"
 value={inputs.metrotileCarriageGBP??DEFAULT_METROTILE_CARRIAGE_GBP} onChange={e=>patch({metrotileCarriageGBP:e.target.value})}/>
 </label>
 <small>Default £{DEFAULT_METROTILE_CARRIAGE_GBP}. Enter this roof’s share for a combined order, or clear the field to use the default.</small>
 </div>}
 <div className="de-customer-row"><label>Customer<CustomerPicker customers={customers} value={inputs.selectedCustomerId||'retail'} onChange={e=>patch({selectedCustomerId:e.target.value})}/></label>
 {field('Customer reference','customerReference','text')}
 {field('Delivery postcode','deliveryPostcode','text')}</div>
 {layoutReady&&<DoubleEdwardianValleyReview controlsOnly geometry={g} inputs={inputs} onChange={patch}/>}</div>
 <DoubleEdwardianActions inputs={quoteInputs} materials={materials} customers={customers} onChange={patch} onQuoteView={()=>setEditing(false)} onResetView={()=>setEditing(false)}/></section>
 <style>{`.de-design-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.de-design-grid label{min-width:0}.de-customer-row{display:grid;grid-template-columns:1.5fr 1fr 1fr;align-items:end;gap:10px;margin-top:12px}.de-customer-row>label{min-width:0}.de-outlets{min-width:0;margin:0;padding:3px 7px;border:1px solid #d1d5db;border-radius:8px}.de-outlets label{display:inline-flex;align-items:center;margin-right:6px}@media(max-width:760px){.de-design-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.de-customer-row{grid-template-columns:1fr}}.de-edit{width:100%;background:#0f766e;border:1px solid #0f766e;border-radius:10px;color:white;padding:10px 14px;font-weight:600;cursor:pointer}.de-edit[aria-expanded=true]{margin-bottom:14px}`}</style>
 <FrameThicknessEditor admin value={inputs.frameThicknessMM??70} onApply={value=>setInputs(v=>({...v,frameThicknessMM:value}))}/><DoubleEdwardianMemberEditor inputs={inputs} geometry={g} onChange={positions=>setInputs(v=>({...v,memberPositionsMM:positions,summaryPricingState:undefined}))}/>{quoted?<section style={card}><strong>Plan preview</strong><DoubleEdwardianPlan geometry={g} valleyFinish={inputs.valleyFinish}/><p><strong>Internal:</strong> {g.widthMM} × {g.projectionMM} mm · <strong>External:</strong> {g.externalWidthMM} × {g.externalProjectionMM} mm<br/><strong>Pitch:</strong> {g.pitchDeg}° · <strong>Tile:</strong> {doubleEdwardianTileLabels[quoteInputs.tileProductId||'britmetShingle']} — {quoteInputs.tileColour}<br/><strong>Fascia/Soffit:</strong> {quoteInputs.fasciaColour} · <strong>Gutter:</strong> {inputs.gutterProfile||'square'} / {quoteInputs.gutterColour}</p>
 {g.layout.warnings.map(note=><p key={note} role="alert" style={{color:'#b45309'}}>{note}</p>)}

 </section>:inputs.quoteDisplayed?<p role="status">{g.error||(g.valid?'The member layout has not loaded. Replace all files from the latest update, then restart the app.':'Enter valid roof dimensions.')}</p>:null}{quoted&&<DoubleEdwardianPricing inputs={quoteInputs} materials={materials} customers={customers} onChange={patch}/>}</main></>;
}
