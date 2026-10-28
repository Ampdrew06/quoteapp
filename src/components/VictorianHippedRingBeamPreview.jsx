import React from 'react';
import {buildVictorianHippedRingBeamProfiles} from '../lib/Manufacturing/victorianHippedRingBeamProfiles';
import {victorianBookBeams} from '../lib/Manufacturing/victorianBookBeams';
import {EdwardianRingBeamCutPages} from './EdwardianVisualCutPages';

const mm=n=>Number(n).toFixed(1).replace(/\.0$/,'');
export default function VictorianHippedRingBeamPreview({geometry,inputs}) {
 const result=buildVictorianHippedRingBeamProfiles({geometry,inputs});
 if(!result.valid)return <section><h2>Ringbeam profiles and upstands</h2><p role="alert">{result.errors.join(' ')}</p></section>;
 const beams=victorianBookBeams(result.beams).map(b=>({...b,cuts:{...b.cuts,jointMethod:result.jointMethod,upstandHeightMM:result.upstandHeightMM,upstandArrangement:result.upstandArrangement}}));
 return <section className="vhr-preview">
  <h2>Ringbeam profiles and upstands</h2>
  <p><b>Joint method: {result.jointMethod==='calculated'?'Calculated common joint':'Standard mitre + perimeter trim'}</b>. Use the toggle at the top of the Manufacture Book to display or print either method. All layers follow the selected assembly joint.</p>
  {result.jointMethod==='standard'&&<p>The primary mitre is half the corner turn. Secondary trims follow the adjoining outer edge: square at a 90° corner, potentially a different setting at a 135° corner. Finished outlines include these trims; see the trim list below.</p>}
  <p>9mm ply upstands: <b>{result.upstandHeightMM}mm · {result.upstandArrangement}</b>. The 48mm slot allowance is projected along the ringbeam for skewed rafters; confirm these openings in the workshop.</p>
  <EdwardianRingBeamCutPages beams={beams} layerLabels={{outerLath25x50:'25×50 lath'}}/>
  {result.jointMethod==='standard'&&<div className="vh-table"><h3>Secondary perimeter trims</h3><table><thead><tr><th>Ringbeam</th><th>Layer</th><th>End</th><th>Primary mitre</th><th>Trim off square</th><th>Trim edge length</th><th>Depth affected</th></tr></thead><tbody>{result.beams.flatMap(b=>Object.entries(b.layers).flatMap(([key,p])=>(p.trims||[]).map((t,i)=><tr key={`${b.reference}-${key}-${i}`}><td>{b.reference}</td><td>{{pse30x90:'30×95 PSE',ply9Base:'9mm ply base',outerLath25x50:'25×50 lath'}[key]}</td><td>{t.end}</td><td>{mm(t.end==='start'?p.primaryStartMitreDeg:p.primaryEndMitreDeg)}°</td><td>{mm(t.offSquareDeg)}°</td><td>{mm(t.lengthMM)} mm</td><td>{mm(t.depthMM)} mm</td></tr>)))}</tbody></table></div>}
  <details><summary>Member slots — setting-out review</summary>
   {result.beams.map(b=><div key={b.reference}><h3>{b.reference} · {b.label}</h3><table><thead><tr><th>Member / seat</th><th>Centre</th><th>Opening along beam</th><th>Start</th><th>End</th></tr></thead><tbody>{b.slots.map((s,n)=><tr key={n}><td>{s.reference}</td><td>{mm(s.centreMM)} mm</td><td>{mm(s.widthMM)} mm</td><td>{mm(s.left)} mm</td><td>{mm(s.right)} mm</td></tr>)}</tbody></table></div>)}
   <p>Setting-out follows each ringbeam from its first internal corner. A right-side ringbeam runs from its front hip towards the wall; the rafter editor measures that side from the wall.</p>
  </details>
  <style>{`.vhr-preview .ev-ringbeam{height:auto;min-height:0;border:1px solid #cbd5e1;border-radius:7px;padding:12px;margin:16px 0;background:#fff}.vhr-preview .ev-ringbeam h2{font-size:18px;margin:0 0 10px}.vhr-preview .ev-ringbeam h3{font-size:15px}.vhr-preview .ev-layers svg{height:auto!important;max-height:none!important;margin:4px 0}.vhr-preview .ev-ringbeam .ev-upstands{height:auto!important;max-height:none!important;margin:4px 0}@media print{.vhr-preview .ev-ringbeam{break-after:page}.vhr-preview>details{display:none}}`}</style>
 </section>;
}
