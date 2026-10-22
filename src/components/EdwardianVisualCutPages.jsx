import React from 'react';
import {WorkshopShape} from './ManufacturingGableTrussPage';
import {LayerDrawing} from './ManufacturingRingBeamDrawing';

const mm=n=>Number(n).toFixed(1).replace(/\.0$/,'');
function Card({title,points,pitch}) {return <div className="ev-card"><h3>{title}</h3><WorkshopShape points={points} title={title} showAngles={pitch==null} cutPitch={pitch}/></div>;}
export function EdwardianTrussCutPage({schedule:s,assembly}) {
  const t=s.truss,members=t.members;
  const same=members.length===2&&Math.abs(Math.max(...members[0].points.map(p=>p.xMM))-Math.min(...members[0].points.map(p=>p.xMM))-(Math.max(...members[1].points.map(p=>p.xMM))-Math.min(...members[1].points.map(p=>p.xMM))))<0.01;
  return <section className="em-page ev-truss"><h2>Truss manufacture</h2>
    <div className="ev-assembly">{assembly}</div>
    <div className="ev-member">{same?<Card title={`Truss Members × ${s.counts.trusses*2}`} points={members[0].points} pitch={s.geometry.pitchDeg}/>:members.map(m=><Card key={m.side} title={`${m.side} truss members × ${s.counts.trusses}`} points={m.points} pitch={s.geometry.pitchDeg}/>)}</div>
    <div className="ev-joints"><Card title={`18mm chevrons × ${s.counts.chevrons}`} points={t.chevron.points}/><Card title={`9mm gussets × ${s.counts.gussets}`} points={t.gusset.points}/><Card title={`45mm closures × ${s.counts.closures}`} points={t.closure.points}/></div>
    <style>{`.ev-truss{height:279mm;break-inside:avoid}.ev-assembly svg{height:68mm!important}.ev-card{border:1px solid #cbd5e1;border-radius:6px;padding:6px;break-inside:avoid}.ev-card h3{font-size:12px;margin:0 0 2px}.ev-member{display:flex;gap:8px;margin:8px 0}.ev-member>.ev-card{flex:1;min-width:0}.ev-member svg{height:44mm!important}.ev-joints{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.ev-joints svg{height:48mm!important}.ev-joints>.ev-card:last-child{grid-column:1/-1}.ev-joints>.ev-card:last-child svg{height:32mm!important}`}</style>
  </section>;
}

// Group mirrored cutting patterns only when all three layers AND bay widths match.
export function groupEdwardianRingBeams(beams=[]) {
  const number=n=>Number(Number(n||0).toFixed(3));
  const groups=new Map();
  beams.forEach(b=>{
    const key=JSON.stringify({layers:Object.values(b.cuts.continuous).map(p=>({width:number(p.widthMM),inner:number(p.internalEdgeLengthMM),outer:number(p.externalEdgeLengthMM),ends:[[p.startOuterExtensionMM,p.startSquareLegMM,p.startMitreDeg],[p.endOuterExtensionMM,p.endSquareLegMM,p.endMitreDeg]].map(a=>a.map(number)).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))})),bays:b.bays.map(r=>number(r.widthMM)),height:b.cuts.upstandHeightMM});
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(b);
  });return [...groups.values()];
}

function Upstands({beams,bays}) {
  const height=beams[0].cuts.upstandHeightMM;
  const rows=[];for(let n=0;n<bays.length;n+=4)rows.push(bays.slice(n,n+4));
  return <div>{rows.map((row,n)=><svg key={n} viewBox="0 0 760 165" className="ev-upstands" role="img" aria-label="Dimensioned ring-beam upstand cuts">
    <path d="M40,48V118 M34,48H46 M34,118H46" fill="none" stroke="#64748b"/>
    <text x="29" y="83" textAnchor="middle" transform="rotate(-90 29 83)" fontSize="16" fontWeight="700">{height} mm</text>
    {row.map(({bay,index},j)=>{const x=65+j*170;return <g key={index}>
      <rect x={x} y="48" width="150" height="70" fill="none" stroke="#111827" strokeWidth="2"/>
      <path d={`M${x},44V29H${x+150}V44`} fill="none" stroke="#64748b"/>
      <text x={x+75} y="23" textAnchor="middle" fontSize="17" fontWeight="700">{mm(bay.widthMM)} mm</text>
      {Array.from({length:Math.ceil(beams.length/2)},(_,k)=>beams.slice(k*2,k*2+2)).map((pair,k)=><text key={k} x={x+75} y={88-(Math.ceil(beams.length/2)-1)*9+k*18} textAnchor="middle" fontSize={beams.length>1?12:15} fontWeight="700">{pair.map(b=>`${b.manufactureRef} B${b.upstandBayOrder?.[index]??index+1}`).join(' / ')}</text>)}
    </g>;})}
  </svg>)}</div>;
}
export function EdwardianRingBeamCutPages({beams=[]}) {
  return <>{groupEdwardianRingBeams(beams).flatMap(group=>{
    const base=group[0],all=base.bays.map((bay,index)=>({bay,index})),chunks=[all.slice(0,8)];
    for(let n=8;n<all.length;n+=16)chunks.push(all.slice(n,n+16));
    return chunks.map((bays,n)=><section key={`${base.manufactureRef}-${n}`} className="em-page ev-ringbeam"><h2>{group.map(b=>b.manufactureRef).join(' & ')} · Ring-beam{n?' — upstands continued':` × ${group.length}`}</h2>
      {!n&&<div className="ev-layers">{[['30×95 PSE','pse30x90'],['9mm ply base','ply9Base'],['25×50 outer lath','outerLath25x50']].map(([label,key])=><LayerDrawing key={key} label={label} profile={base.cuts.continuous[key]} markerId=""/>)}</div>}
      <h3>9mm ply upstands{base.cuts.upstandArrangement==='vertical'?' · vertical · 210mm cut (195 visible + 15 groove)':''}</h3><Upstands beams={group} bays={bays}/>
    </section>);
  })}<style>{`.ev-ringbeam{height:279mm;break-inside:avoid}.ev-ringbeam h3{font-size:12px;margin:8px 0 4px}.ev-layers svg{height:37mm!important;max-width:none}.ev-ringbeam .ev-upstands{height:39mm!important;max-width:none}`}</style></>;
}
