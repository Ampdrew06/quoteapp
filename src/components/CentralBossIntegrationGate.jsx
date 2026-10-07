import React,{useEffect,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {isCentralBossDesign} from '../lib/geometry/centralBossDesign';
import {getMaterials} from '../lib/materials';
import NavTabs from './NavTabs';
import CentralBossDesignPreview from './CentralBossDesignPreview';
const readInputs=()=>{try{return JSON.parse(localStorage.getItem('leanToInputs')) || {};}catch{return {};}};
// Central designs must not mount legacy offset-boss pricing/cutting pages.
// The manual Home tile calculator remains available, including unusual roofs.
export default function CentralBossIntegrationGate({children,automaticTilesOnly=false}) {
 const [inputs,setInputs]=useState(readInputs);
 const location=useLocation();
 useEffect(()=>{const update=()=>setInputs(readInputs());window.addEventListener('leanToInputs_updated',update);window.addEventListener('storage',update);
  return ()=>{window.removeEventListener('leanToInputs_updated',update);window.removeEventListener('storage',update);};},[]);
 if(!isCentralBossDesign(inputs) || (automaticTilesOnly && new URLSearchParams(location.search).get('mode')!=='auto'))return children;
 return <><NavTabs /><main style={{maxWidth:1000,margin:'0 auto',padding:16}}>
  <h1>Central-boss design</h1><p>This design is at the preview stage. Its Summary, automatic tile ordering and manufacture outputs are pending truss integration.</p>
  <Link to="/quote/lean-to">Return to Design/Options</Link>
  <CentralBossDesignPreview inputs={inputs} materials={getMaterials()} />
 </main></>;
}
