import React from 'react';
import {LayerDrawing} from './ManufacturingRingBeamDrawing';
import {buildVictorianRingBeamProfiles} from '../lib/Manufacturing/victorianRingBeamProfiles';
export default function VictorianRingBeamPreview({geometry}) {
  const result=buildVictorianRingBeamProfiles(geometry);
  if(!result.valid)return <p role="alert">{result.errors.join(' ')}</p>;
  const groups=new Map();
  result.beams.forEach(b=>{const key=JSON.stringify(Object.values(b.layers).map(p=>[p.widthMM,p.internalEdgeLengthMM.toFixed(3),p.externalEdgeLengthMM.toFixed(3),[p.startMitreDeg,p.endMitreDeg].sort((a,b)=>a-b)]));if(!groups.has(key))groups.set(key,[]);groups.get(key).push(b);});
  return <section className="vrp"><h2>Ring-beam cutting profiles · review</h2>
    <p>Dimensions in mm. PSE flush to the internal edge; outer lath flush to the external edge. Mitred outer-lath joints shown for workshop confirmation. Upstands: 9mm ply, 195mm high.</p>
    {[...groups.values()].map(rows=><div key={rows[0].reference} className="vrp-card"><h3>{rows.map(b=>b.reference).join(' / ')} · ×{rows.length}</h3>
      {Object.entries(rows[0].layers).map(([key,profile])=><LayerDrawing key={key} label={{pse30x90:'30×95 PSE',ply9Base:'9mm ply base',outerLath25x50:'25×50 outer lath'}[key]} profile={profile} markerId=""/>)}
    </div>)}
    {result.beams.map(b=><div className="vrp-card" key={b.reference+'upstands'}><h3>{b.reference} · 9mm ply upstands ×2 faces</h3><svg viewBox={`0 0 1000 ${Math.ceil(b.upstands.length/4)*150}`} role="img" aria-label={`${b.reference} upstand cutting widths`}>
      {b.upstands.map((u,i)=>{const x=55+(i%4)*245,y=40+Math.floor(i/4)*150;return <g key={u.bay} fontFamily="Arial" fontSize="16"><rect x={x} y={y} width="180" height="85" fill="none" stroke="#111827"/><text x={x+90} y={y-12} textAnchor="middle">{u.widthMM.toFixed(1)} mm</text><text x={x-12} y={y+43} textAnchor="middle" transform={`rotate(-90 ${x-12} ${y+43})`}>195</text><text x={x+90} y={y+48} textAnchor="middle" fontWeight="700">{b.reference} B{u.bay}</text></g>;})}
    </svg></div>)}
    <style>{`.vrp-card{border:1px solid #cbd5e1;padding:12px;margin:12px 0;background:white;break-inside:avoid}.vrp-card h3{font-size:15px;margin:0 0 8px}.vp .vrp-card svg{border:0;margin:0;height:auto;max-height:none}`}</style>
  </section>;
}
