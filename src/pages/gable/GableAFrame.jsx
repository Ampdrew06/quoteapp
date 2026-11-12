import React,{useEffect,useId,useState} from 'react';
import {Link} from 'react-router-dom';
import GableNavigation from './GableNavigation';
import {getSummaryQuoteIdentity} from '../../components/SummaryQuoteIdentity';
import {getCustomers,getCurrentCustomer} from '../../lib/customers';
import {readActiveDesignRecord} from '../../lib/activeDesignRecord';
import {isAdminUser} from '../../lib/userRole';
import {getMaterials} from '../../lib/materials';
import {buildGableGeometry} from '../../lib/geometry/gableGeometry';
import {gableAFrameDimensions,gableStabilityBarIncluded} from '../../lib/geometry/gableAFrame';
import './GableAFrame.css';

const key='gableDesignPreviewInputs';
const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{return {};}};
const mm=n=>n.toFixed(1);
export function AFrameDrawing({dimensions:d}){
 const arrow=useId(), scale=Math.min(500/d.width,170/d.height);
 const x=140+(500-d.width*scale)/2, y=247, right=x+d.width*scale;
 const top=y-d.height*scale, inner=x+d.run*scale, other=right-d.run*scale;
 const dimension=(a,b,c,e,label,tx,ty,rotate)=> <g>
  <line x1={a} y1={b} x2={c} y2={e} markerStart={`url(#${arrow})`} markerEnd={`url(#${arrow})`}/>
  <text x={tx} y={ty} transform={rotate?`rotate(-90 ${tx} ${ty})`:undefined}>{label}</text>
 </g>;
 return <svg className="af-drawing" viewBox="0 0 780 325" role="img" aria-label="Dimensioned front elevation of the A-frame">
  <defs><marker id={arrow} viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 Z" fill="#526977"/></marker></defs>
  <g className="af-extension"><path d={`M${x} ${y}v55 M${right} ${y}v55 M${inner} ${top}V39 M${other} ${top}V39 M${x} ${y}h-58 M${inner} ${top}H${x-58}`}/></g>
  <path className="af-outline" d={`M${x} ${y}L${inner} ${top}H${other}L${right} ${y}Z`}/>
  <path className="af-centre" d={`M390 ${top}V${y}`}/>
  <g className="af-dim">
   {dimension(x,289,right,289,`${mm(d.width)} mm · overall width`,390,315)}
   {dimension(inner,44,other,44,`${mm(d.flat)} mm · top flat`,390,31)}
   {dimension(x-49,top,x-49,y,`${mm(d.height)} mm`,x-62,(top+y)/2,true)}
  </g>
 </svg>;
}
export default function GableAFrame(){
 const [inputs,setInputs]=useState(read),[mode,setMode]=useState('design'),[customers,setCustomers]=useState([]);
 const admin=isAdminUser(), current=getCurrentCustomer(),record=readActiveDesignRecord('gable');
 useEffect(()=>{if(!admin)return;let alive=true;getCustomers().then(rows=>{if(alive)setCustomers(rows||[]);});return()=>{alive=false;};},[admin]);
 const customer=(admin?customers:[current]).find(c=>c&&c.id===inputs.selectedCustomerId)||null;
 const identity=getSummaryQuoteIdentity({inputs,family:'gable',customer});
 const g=buildGableGeometry({inputs,materials:getMaterials()});
 const withBar=mode==='design'?gableStabilityBarIncluded(inputs,g.widthMM):mode==='with';
 const flat=inputs.aFrameFlatMM??595;
 const d=g.valid?gableAFrameDimensions({widthMM:g.widthMM,pitchDeg:g.pitchDeg,flatMM:flat,withBar}):{error:'Complete a valid Gable design in Design/Options first.'};
 const changeFlat=value=>{const next={...read(),aFrameFlatMM:value};localStorage.setItem(key,JSON.stringify(next));setInputs(next);};
 return <><GableNavigation/><main className="af-page">
  <div className="af-controls">
   <label>Top flat (mm)<input type="number" min="0.1" step="any" value={flat} onChange={e=>changeFlat(e.target.value)}/></label>
   <label>Support bar<select value={mode} onChange={e=>setMode(e.target.value)}><option value="design">Match Gable design</option><option value="with">With 6 mm bar</option><option value="without">Without bar</option></select></label>
   <Link to="/quote/gable">Back to Design/Options</Link>
   <button type="button" onClick={()=>window.print()} disabled={!!d.error}>Print / Save PDF</button>
  </div>
  <article className="af-sheet">
   <header><p>TIMBERLITE · GABLE</p><h1>A-Frame order sizes</h1></header>
   <dl className="af-details"><div><dt>Customer</dt><dd>{identity.customerName}</dd></div><div><dt>Reference</dt><dd>{identity.reference}</dd></div>
    <div><dt>Quote</dt><dd>{identity.quoteNumber}</dd></div>{record?.job_number&&<div><dt>Job</dt><dd>{record.job_number}</dd></div>}</dl>
   {d.error?<p role="status">{d.error}</p>:<>
    <h2>Front elevation <span>{withBar?'With 6 mm bar':'Without bar'}</span></h2>
    <AFrameDrawing dimensions={d}/>
    <table><thead><tr><th scope="col">Overall width</th><th scope="col">Top flat</th><th scope="col">Overall height</th><th scope="col">Horizontal run (each side)</th><th scope="col">Slope (each side)</th><th scope="col">Frame pitch</th></tr></thead>
    <tbody><tr>{[d.width,d.flat,d.height,d.run,d.slope].map((n,i)=><td key={i}>{mm(n)} mm</td>)}<td>{d.pitch.toFixed(2)}°</td></tr></tbody></table>
    <p className="af-note">Dimensions are overall frame sizes in millimetres. Use the stated dimensions for ordering; do not scale the printout.</p>
   </>}
  </article>
 </main></>;
}
