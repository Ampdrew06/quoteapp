import React,{useEffect,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {buildSummaryMaterialsModel} from '../lib/Calculations/summaryMaterialsModel';
import {buildCentralBossDesign,isCentralBossDesign} from '../lib/geometry/centralBossDesign';
import {getMaterials} from '../lib/materials';
import NavTabs from './NavTabs';
import CentralBossDesignPreview from './CentralBossDesignPreview';
const readInputs=()=>{try{return JSON.parse(localStorage.getItem('leanToInputs')) || {};}catch{return {};}};
// Central designs must not mount legacy offset-boss cutting pages.
// The manual Home tile calculator remains available, including unusual roofs.
export default function CentralBossIntegrationGate({children,automaticTilesOnly=false,allowCentralCosting=false}) {
 const [inputs,setInputs]=useState(readInputs);
 const location=useLocation();
 useEffect(()=>{const update=()=>setInputs(readInputs());window.addEventListener('leanToInputs_updated',update);window.addEventListener('storage',update);
  return ()=>{window.removeEventListener('leanToInputs_updated',update);window.removeEventListener('storage',update);};},[]);
 if(!isCentralBossDesign(inputs) || (automaticTilesOnly && new URLSearchParams(location.search).get('mode')!=='auto'))return children;
 const materials=getMaterials();
 const design=buildCentralBossDesign({inputs,materials});
 if(allowCentralCosting && design.valid)return children;
 const model=design.valid ? buildSummaryMaterialsModel({inputs,materials}) : null;
 return <><NavTabs /><main style={{maxWidth:1000,margin:'0 auto',padding:16}}>
  <h1>Central-boss design</h1><p>Its Summary and quotation quantities are integrated; truss manufacture drawings are available in the manufacture book.</p>
  <Link to="/quote/lean-to">Return to Design/Options</Link>
  <CentralBossDesignPreview inputs={inputs} materials={materials} pricingReady={!!model?.centralTrussCosts?.pricingReady} />
  {model?.centralTrussCosts?.valid && <section><h2>Central truss material reconciliation</h2>
    <ul>{[['Truss joists', 'trussMembers'],['9mm gussets', 'gussets'],['18mm chevrons', 'chevrons'],['Assembled closures', 'closures'],['Boss / rafter terminal', 'bosses'],['Spar hooks', 'sparHooks']].map(([label,key])=><li key={key}>{label}: {model.centralTrussCosts.quantities[key]}</li>)}</ul>
    <p>Closure cut length: 595mm. Joist and ply requirements are included in Summary timber totals.</p>
    <p>{model.centralTrussCosts.errors.join(' ')}</p>
  </section>}
 </main></>;
}
