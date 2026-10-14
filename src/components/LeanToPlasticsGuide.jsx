import React from 'react';
import PlasticsCuttingGuide from './PlasticsCuttingGuide';

// Use the established Lean-To fascia geometry in the shared guide. Run
// envelopes are preparation references, not a new stock optimisation model.
export default function LeanToPlasticsGuide({geometry:g,lengthMM,leftWall,rightWall,leftOverhangMM=0,rightOverhangMM=0,colour}) {
  if (!(lengthMM>0)) return <p>No roof dimensions loaded.</p>;
  const row={edgeId:'front',side:'front',runM:lengthMM/1000,
    structuralFasciaHeightMM:g.finishedFasciaHeightMM,
    finishedFasciaHeightMM:g.fasciaExternalCutHeightMM,
    fasciaWidthMM:g.fasciaOrderSizeMM,
    soffitGeometryMM:g.userSoffitMM,
    fasciaCut:g.fasciaCut};
  const plan={runPieces:[{edgeId:'front',lengthsM:[lengthMM/1000]}]};
  const audit={valid:true,rows:[row],fasciaPlan:plan,
    soffitPlan:plan};
  return <div>
    <PlasticsCuttingGuide audit={audit} showSupply={false} runEnvelopesOnly/>
    <div style={{border:'1px solid #cbd5e1',padding:8,fontSize:11,marginTop:8}}>
      <h4 style={{margin:'0 0 6px',fontSize:12}}>Side fascias &amp; overhang soffits · {colour}</h4>
      <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
        {['Side','Outside fascia run','Fascia stock width','90° corners','Side soffit run / width'].map(t=><th key={t} style={{textAlign:'left',border:'1px solid #cbd5e1',padding:6}}>{t}</th>)}
      </tr></thead><tbody>
        {[['Left',leftWall,leftOverhangMM],['Right',rightWall,rightOverhangMM]].map(([side,wall,overhang])=><tr key={side}>
          <td style={{border:'1px solid #cbd5e1',padding:6}}>{side}</td>
          <td style={{border:'1px solid #cbd5e1',padding:6}}>{wall?'Wall present — none':`${Math.floor(g.manufacturedExternalSlopeLengthMM)} mm`}</td>
          <td style={{border:'1px solid #cbd5e1',padding:6}}>{wall?'—':'300 mm'}</td>
          <td style={{border:'1px solid #cbd5e1',padding:6}}>{wall?0:2}</td>
          <td style={{border:'1px solid #cbd5e1',padding:6}}>{!wall&&overhang>0?`${Math.floor(g.manufacturedExternalSlopeLengthMM)} × ${overhang} mm`:'None'}</td>
        </tr>)}
      </tbody></table>
      {[['Left',leftWall,leftOverhangMM],['Right',rightWall,rightOverhangMM]].filter(([,wall])=>!wall).map(([side,,overhang])=><svg key={side} viewBox="0 0 700 135" style={{width:'100%',height:'28mm',display:'block'}} role="img" aria-label={`${side} side fascia and soffit dimensions`}>
        <text x="12" y="22" fontSize="14" fontWeight="700">{side} outside fascia · 300mm stock</text>
        <rect x="115" y="45" width="425" height="36" fill="none" stroke="#111827" strokeWidth="2"/>
        <path d="M115,39V30H540V39 M550,45H570V81H550" fill="none" stroke="#64748b"/>
        <text x="328" y="27" textAnchor="middle" fontSize="15">{Math.floor(g.manufacturedExternalSlopeLengthMM)} mm</text>
        <text x="580" y="68" fontSize="15">300 mm</text>
        <text x="115" y="101" fontSize="14" fill="#dc2626">Wall junction — mark on site</text>
        <text x="540" y="101" textAnchor="end" fontSize="14" fill="#dc2626">Eaves junction — mark on site</text>
        {overhang>0&&<text x="328" y="127" textAnchor="middle" fontSize="14">Side soffit: {Math.floor(g.manufacturedExternalSlopeLengthMM)} × {overhang} mm</text>}
      </svg>)}
      <p>Supply full fascia, soffit and gutter lengths as listed in the Checklist. Mark junctions and fitting clearances before final cutting on site.</p>
    </div>
  </div>;
}
