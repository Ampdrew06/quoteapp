import React from 'react';
import {WorkshopShape} from '../../components/ManufacturingGableTrussPage';
export default function CombinationMemberCutPages({members=[]}){
 const pages=[];
 for(const [title,rows] of [['Hips',members.filter(m=>m.type==='Hip')],['Rafters & jack rafters',members.filter(m=>m.type!=='Hip')]]){
  const grouped=new Map();for(const m of rows){const key=JSON.stringify([m.type,m.pricingOnly,Number(m.pitchDeg.toFixed(6)),Number(m.topCutOffSquareDeg.toFixed(6)),m.points.map(p=>[Number(p.xMM.toFixed(3)),Number(p.yMM.toFixed(3))])]);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(m);}
  const groups=[...grouped.values()];for(let n=0;n<groups.length;n+=6)pages.push({title:title+(n?' — continued':''),groups:groups.slice(n,n+6)});
 }
 return <>{pages.map((page,i)=><section className="em-page cmb-members" key={i}><h2>{page.title}</h2><div className="cmb-member-grid">{page.groups.map(rows=>{const m=rows[0];return <div className="cmb-member-card" key={m.ref}><h3>{rows.map(r=>r.ref).join(' / ')} · {m.type} × {rows.length}</h3><WorkshopShape points={m.points} title={`${m.ref} cutting profile`} showAngles={false} cutPitch={m.topCutOffSquareDeg} footPitch={m.pitchDeg} compact/><p>Dimensions in mm · 220mm I-joist · 45mm flanges.</p>{m.pricingOnly?<p>Provisional jack connection profile: includes hip setback and hook/bracket clearance. Verify connection fit before cutting production stock.</p>:<p>Existing sloping boss-end allowance retained. Outside toe follows this roof’s calculated perimeter.</p>}</div>;})}</div></section>)}<style>{`.cmb-members{height:279mm;break-inside:avoid}.cmb-member-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.cmb-member-card{border:1px solid #cbd5e1;border-radius:6px;padding:8px;min-width:0;break-inside:avoid}.cmb-member-card h3{font-size:12px;margin:0 0 4px}.cmb-member-card svg{height:43mm!important}.cmb-member-card p{font-size:10px!important;line-height:1.25;margin:5px 0}`}</style></>;
}
