import {buildVictorianLathAudit} from '../../lib/Calculations/victorianLathAudit';
import {normalizeVictorianFiveDesignInputs} from '../../lib/geometry/victorianFiveDesignInputs';
import React,{useState,useEffect} from 'react';
import {Navigate} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import {getMaterials} from '../../lib/materials';
import {buildGableGeometry} from '../../lib/geometry/gableGeometry';
import {buildEdwardianGeometry} from '../../lib/geometry/edwardianGeometry';
import {buildVictorianGeometry} from '../../lib/geometry/victorianGeometry';
import {buildVictorianFiveGeometry} from '../../lib/geometry/victorianFiveGeometry';
import {buildGableTilingAudit} from '../../lib/Calculations/gableTilingAudit';
import {buildEdwardianTilingAudit} from '../../lib/Calculations/edwardianTilingAudit';
import {buildVictorianTilingAudit} from '../../lib/Calculations/victorianTilingAudit';
import GableNavigation from '../gable/GableNavigation';
import EdwardianNavigation from '../edwardian/EdwardianNavigation';
import VictorianNavigation from '../victorian/VictorianNavigation';
import {RoofTilingTotals,LathScheduleTable} from '../../components/FacetTilingCalculator';
import '../../components/AppPageLayout.css';
const families={gable:{key:'gableDesignPreviewInputs',label:'Gable',geometry:buildGableGeometry,tiling:buildGableTilingAudit,Nav:GableNavigation},edwardian:{key:'edwardianInputs',label:'Edwardian',geometry:buildEdwardianGeometry,tiling:buildEdwardianTilingAudit,Nav:EdwardianNavigation},victorian:{key:'victorianPlanPreviewInputs',label:'3 Facet Victorian',geometry:buildVictorianGeometry,tiling:buildVictorianTilingAudit,Nav:VictorianNavigation},'victorian-five':{key:'victorianFiveInputs',label:'5 Facet Victorian',geometry:buildVictorianFiveGeometry,tiling:buildVictorianTilingAudit,Nav:VictorianNavigation}};
const mm=n=>Number(n).toFixed(1),metres=n=>Number(n).toFixed(3);
export default function DesignedRoofTilesLaths({family}){return isAdminUser()?<DesignedRoofTilesLathsContent key={family} family={family}/>:<Navigate to="/quote" replace/>;}
export function DesignedRoofTilesLathsContent({family}){
 const config=families[family],Nav=config.Nav;
 const [inputs]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem(config.key)||'{}');return family==='victorian-five'?normalizeVictorianFiveDesignInputs(saved):saved;}catch{return {};}}),[materials,setMaterials]=useState(getMaterials);
 useEffect(()=>{const refresh=()=>setMaterials(getMaterials());window.addEventListener('materials_updated',refresh);return()=>window.removeEventListener('materials_updated',refresh);},[]);
 const geometry=config.geometry({inputs,materials}),audit=config.tiling({geometry,materials,productId:inputs.tileProductId||'britmetShingle'});
 const support=family.startsWith('victorian')&&audit.valid?buildVictorianLathAudit({geometry,materials,productId:inputs.tileProductId||'britmetShingle'}).support?.quantities?.additionalLathM:audit.ridgeLathM??audit.support?.quantities?.additionalLathM;
 const result=audit.result,allowance=audit.sequence?.allowanceTiles??result?.orderAllowanceTiles??0;
 const totals=result?{...result,tileQuantityOrdered:audit.mainTiles,tileQuantityRounded:audit.mainTiles-allowance,orderAllowanceTiles:allowance}:null;
 return <><Nav five={family==='victorian-five'}/><main className="app-page-content dr-tiles"><h1>Tiles &amp; Laths — {config.label}</h1><p>Read-only results from the current Design/Options roof.</p>
 {!audit.valid?<p role="alert">{audit.errors.join(' ')}</p>:<section className="dr-results"><h2>Roof tile &amp; lath results</h2><p>{audit.productLabel||({britmetShingle:'Britmet Shingle',metrotileShingle:'Metrotile Shingle',liteSlate:'LiteSlate',tapcoSlate:'TapcoSlate'}[inputs.tileProductId||'britmetShingle'])}</p><RoofTilingTotals result={totals} itemWord={audit.steel?'tiles':'slates'}/>
 <section className="dr-card"><h3>Roof edge coverings</h3>{support!=null&&<p>Hip/ridge support laths: <b>{metres(support)} m</b> · External field and support combined: <b>{metres(result.lathLengthMM/1000+support)} m</b></p>}<p>Ridge tiles: <b>{audit.ridgeTiles??'Pending'}</b>{audit.hipTiles!=null&&<> · Hip tiles: <b>{audit.hipTiles}</b></>}</p><p>External field laths above include the chamfered eaves rows. Hip/ridge support laths are additional; internal ceiling and ringbeam laths are separate uses.</p><details><summary>Edge accessories and support requirements</summary><table><thead><tr><th>Item</th><th>Quantity</th></tr></thead><tbody>{audit.lines.filter(l=>l.key!=='main').map(l=><tr key={l.key}><td>{l.label}</td><td>{l.quantity??'Pending'} {l.unit}</td></tr>)}</tbody></table></details></section>
 {result.facets.map((f,i)=><article className="dr-card" key={f.facet.id}><h3>F{i+1} · {f.facet.label}</h3><div className="dr-values"><span>Bottom edge <b>{mm(f.facet.baseWidthMM)} mm</b></span><span>Top edge <b>{mm(f.facet.topWidthMM)} mm</b></span><span>Tiled height <b>{mm(f.facet.heightMM)} mm</b></span><span>Pitch <b>{mm(f.facet.pitchDeg)}°</b></span><span>Lath rows <b>{f.lathRows.length}</b></span><span>External laths <b>{metres(f.lathRows.reduce((n,r)=>n+r.widthMM,0)/1000)} m</b></span></div><LathScheduleTable result={f} facetNumber={i+1}/></article>)}
 </section>}
 <style>{`.dr-tiles{padding-top:16px;padding-bottom:16px;font:14px Inter,system-ui,Arial}.dr-tiles h1{font-size:24px;margin:12px 0 8px}.dr-results{padding:16px;border:1px solid #93c5fd;border-radius:8px;background:#eff6ff}.dr-results h2{margin-top:0;font-size:20px}.dr-card{padding:14px;margin-top:12px;background:white;border:1px solid #93c5fd;border-radius:7px;overflow-x:auto}.dr-card h3{margin-top:0}.dr-values{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px;margin:12px 0}.dr-values b{display:block}.dr-card table{width:100%;border-collapse:collapse}.dr-card th,.dr-card td{padding:6px;text-align:left;border-bottom:1px solid #cbd5e1}`}</style></main></>;
}
