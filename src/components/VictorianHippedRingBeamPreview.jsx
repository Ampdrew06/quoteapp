import React from 'react';
import {buildVictorianHippedRingBeamProfiles} from '../lib/Manufacturing/victorianHippedRingBeamProfiles';
import {victorianBookBeams} from '../lib/Manufacturing/victorianBookBeams';
import {EdwardianRingBeamCutPages} from './EdwardianVisualCutPages';

const mm=n=>Number(n).toFixed(1).replace(/\.0$/,'');
export default function VictorianHippedRingBeamPreview({geometry,inputs}) {
 const result=buildVictorianHippedRingBeamProfiles({geometry,inputs});
 if(!result.valid)return <section><h2>Ringbeam profiles and upstands</h2><p role="alert">{result.errors.join(' ')}</p></section>;
 const beams=victorianBookBeams(result.beams).map(b=>({...b,cuts:{...b.cuts,upstandHeightMM:result.upstandHeightMM,upstandArrangement:result.upstandArrangement}}));
 return <section className="vhr-preview">
  <h2>Ringbeam profiles and upstands</h2>
  <p>9mm ply upstands: <b>{result.upstandHeightMM}mm · {result.upstandArrangement}</b>. The 48mm slot allowance is projected along the ringbeam for skewed rafters; confirm these openings in the workshop.</p>
  <EdwardianRingBeamCutPages beams={beams} layerLabels={{outerLath25x50:'25×50 lath'}}/>
  <details><summary>Member slots — setting-out review</summary>
   {result.beams.map(b=><div key={b.reference}><h3>{b.reference} · {b.label}</h3><table><thead><tr><th>Member / seat</th><th>Centre</th><th>Opening along beam</th><th>Start</th><th>End</th></tr></thead><tbody>{b.slots.map((s,n)=><tr key={n}><td>{s.reference}</td><td>{mm(s.centreMM)} mm</td><td>{mm(s.widthMM)} mm</td><td>{mm(s.left)} mm</td><td>{mm(s.right)} mm</td></tr>)}</tbody></table></div>)}
   <p>Setting-out follows each ringbeam from its first internal corner. RB5 runs from its front hip towards the wall; the rafter editor measures that side from the wall.</p>
  </details>
  <style>{`.vhr-preview .ev-ringbeam{height:auto;min-height:0;border:1px solid #cbd5e1;border-radius:7px;padding:12px;margin:16px 0;background:#fff}.vhr-preview .ev-ringbeam h2{font-size:18px;margin:0 0 10px}.vhr-preview .ev-ringbeam h3{font-size:15px}.vhr-preview .ev-layers svg{height:auto!important;max-height:none!important;margin:4px 0}.vhr-preview .ev-ringbeam .ev-upstands{height:auto!important;max-height:none!important;margin:4px 0}@media print{.vhr-preview .ev-ringbeam{break-after:page}.vhr-preview>details{display:none}}`}</style>
 </section>;
}
