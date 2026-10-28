import React,{useState} from 'react';
import {Navigate} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import {getMaterials} from '../../lib/materials';
import {buildVictorianHippedGeometry} from '../../lib/geometry/victorianHippedGeometry';
import {buildVictorianHippedCoveringAudit} from '../../lib/Calculations/victorianHippedCoveringAudit';
import {RoofTilingTotals,LathScheduleTable} from '../../components/FacetTilingCalculator';
import VictorianHippedNavigation from './VictorianHippedNavigation';
export default function VictorianHippedTilesLaths(){
 const [inputs]=useState(()=>{try{return JSON.parse(localStorage.getItem('victorianHippedPreviewInputs')||'{}');}catch{return {};}});
 if(!isAdminUser())return <Navigate to="/quote" replace/>;
 const materials=getMaterials(),geometry=buildVictorianHippedGeometry({inputs,materials}),audit=buildVictorianHippedCoveringAudit({geometry,materials,productId:inputs.tileProductId||'britmetShingle'});
 return <><VictorianHippedNavigation/><main className="app-page-content" style={{paddingTop:16,fontFamily:'Inter,system-ui,Arial'}}><h1>Tiles &amp; Laths — Victorian Hipped Lean-To</h1><p>Calculated requirements from the current applied design. Summary supply adjustments remain on Summary.</p>{!audit.valid?<p role="status">{audit.errors.join(' ')}</p>:<><RoofTilingTotals result={audit.result} itemWord={audit.steel?'tiles':'slates'}/><p>Hip tiles: <b>{audit.hipTiles}</b> · Hip support laths: <b>{audit.hipSupportM.toFixed(3)}m</b></p>{audit.result.facets.map((f,i)=><section key={f.facet.id}><h2>{f.facet.label}</h2><LathScheduleTable result={f} facetNumber={i+1}/></section>)}</>}</main></>;
}
