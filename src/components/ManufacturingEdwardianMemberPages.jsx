import React from 'react';
import {WorkshopShape} from './ManufacturingGableTrussPage';

function points(p) {
  const angle=(p.facetPitchDeg??p.hipPitchDeg)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),h=p.horizontalFootCutMM,v=p.verticalFootCutMM;
  return [{xMM:0,yMM:0},{xMM:p.internalSlopeLengthMM*c,yMM:p.internalSlopeLengthMM*s},{xMM:-h+p.externalSlopeLengthMM*c,yMM:v+p.externalSlopeLengthMM*s},{xMM:-h,yMM:v},{xMM:-h,yMM:0}].map(a=>({...a,xMM:-a.xMM}));
}
const mm=n=>Number(n).toFixed(1);
export default function ManufacturingEdwardianMemberPages({groups=[],tiling}) {
  const pages=[];for(let n=0;n<groups.length;n+=6)pages.push(groups.slice(n,n+6));
  return <>{pages.map((groups,n)=><section key={n} className="em-page em-members"><h2>Hips &amp; Rafters{n?' — continued':''}</h2>
    <div className="em-member-grid">{groups.map(rows=>{
      const m=rows[0],p=m.profile;
      return <div key={m.ref} className="em-member-card">
        <h3>{rows.map(r=>r.ref).join(' / ')} · {m.type==='hip'?'Hip':m.type==='boss-rafter'?'Boss rafter':'Jack rafter'} · ×{rows.length}</h3>
        <WorkshopShape points={points(p)} title={`${m.ref} cutting profile`} showAngles={false} cutPitch={p.topCutOffSquareDeg??p.facetPitchDeg} footPitch={p.facetPitchDeg??p.hipPitchDeg} compact/>
        <p>Dimensions in mm · connection left · eaves right · 220mm I-joist · 45mm flanges.</p>
        {m.type==='hip'?<p>First trim {mm(p.perimeterFootprint.firstTrimDistanceMM)}mm · toe trim range {mm(p.perimeterFootprint.trimLengthRangeMM)}mm · maximum trimmed VFC {mm(p.trimmedVfcMaxMM)}mm. Retain centred foot and 156mm plan terminal deduction. Covering {mm(tiling.edges.find(e=>e.side===m.id.replace('hip-',''))?.lengthMM)}mm is separate.</p>:m.type==='boss-rafter'?<p>Lower endpoint {mm(p.bossLowerEndpointMM)}mm from wall. Retain 118mm horizontal gap from terminal front face ({mm(p.terminalFrontFaceMM)}mm).</p>:<p>Retain jack hook/bracket clearance at hip. Hip setback {mm(m.connection.hipCentrelineSetbackMM)}mm includes closest-corner clearance.</p>}
      </div>;
    })}</div>
  </section>)}<style>{`.em-member-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;align-items:start}.em-member-card{border:1px solid #cbd5e1;border-radius:6px;padding:8px;break-inside:avoid;min-width:0}.em-member-card h3{font-size:12px;margin:0 0 4px;overflow-wrap:anywhere}.em-member-card svg{height:40mm!important;max-width:none}.em-member-card p{font-size:10px!important;line-height:1.25!important;margin:4px 0}.em-members{height:279mm;min-height:279mm;break-inside:avoid}`}</style></>;
}
