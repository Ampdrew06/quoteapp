import SummaryQuoteIdentity from '../../components/SummaryQuoteIdentity';
import React,{useState,useEffect} from 'react';
import {Link,Navigate} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import {getMaterials} from '../../lib/materials';
import {victorianHippedDesignDefaults as victorianHippedDefaults} from '../../lib/geometry/victorianHippedGeometry';
import {buildVictorianHippedSummaryMaterialsModel} from '../../lib/Calculations/victorianHippedSummaryMaterialsModel';
import {buildVictorianHippedQuotation} from '../../lib/Calculations/victorianHippedQuotation';
import {getCustomers} from '../../lib/customers';
import {sortCustomerList} from '../../lib/customerListOrder';
import {getLabourPricingConfig,getDeliveryPricingConfig,getMarkupPricingConfig,saveLabourPricingConfig,saveDeliveryPricingConfig,saveMarkupPricingConfig} from '../../lib/pricing';
import {SummaryElementSection,SummaryPricingOverview} from '../../components/SummaryTemplate';
import VictorianHippedNavigation from './VictorianHippedNavigation';
import '../../components/AppPageLayout.css';
const KEY='victorianHippedPreviewInputs';
export default function VictorianHippedSummary(){return isAdminUser()?<VictorianHippedSummaryContent/>:<Navigate to="/quote" replace/>;}
export function VictorianHippedSummaryContent(){
 const [inputs,setInputs]=useState(()=>{try{return {...victorianHippedDefaults,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{return {...victorianHippedDefaults};}}),[materials,setMaterials]=useState(getMaterials);
 useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(inputs));},[inputs]);
 useEffect(()=>{const refresh=()=>setMaterials(getMaterials());window.addEventListener('materials_updated',refresh);return()=>window.removeEventListener('materials_updated',refresh);},[]);
 const [customers,setCustomers]=useState([]),[labourConfig,setLabourConfig]=useState(getLabourPricingConfig),[deliveryConfig,setDeliveryConfig]=useState(getDeliveryPricingConfig),[markupConfig,setMarkupConfig]=useState(getMarkupPricingConfig);
 useEffect(()=>{let alive=true;const load=()=>getCustomers().then(rows=>{if(alive)setCustomers(sortCustomerList(Array.isArray(rows)?rows:[]));}).catch(()=>{});load();window.addEventListener('quoteapp_customers_updated',load);return()=>{alive=false;window.removeEventListener('quoteapp_customers_updated',load);};},[]);
 const customer=customers.find(c=>c.id===inputs.selectedCustomerId)||null;
 const quotation=buildVictorianHippedQuotation({inputs,materials,customer,labourConfig,deliveryConfig,markupConfig});
 const reconciliation=buildVictorianHippedSummaryMaterialsModel({inputs,materials});
 const {timber:model,tiles,plastics,metalGutter,misc}=reconciliation.audits;
 const patchState=(section,group,key,value)=>setInputs(old=>({...old,[section]:{...old[section],[group]:{...old[section]?.[group],[key]:value}}}));
 const patch=(group,key,value)=>patchState('victorianHippedTimberSummary',group,key,value);
 const adjustMisc=(row,raw)=>{const n=Number(raw);if(raw!==''&&!Number.isFinite(n))return;patchState('victorianHippedMiscSummary','adjustments',row.key,raw===''?0:n);};
 const adjustMetalGutter=(row,raw)=>{const n=Number(raw);if(raw!==''&&!Number.isFinite(n))return;patchState('victorianHippedMetalGutterSummary','adjustments',row.key,raw===''?0:n);};
 const adjustPlastics=(row,raw)=>{const n=Number(raw);if(raw!==''&&!Number.isFinite(n))return;patchState('victorianHippedPlasticsSummary','adjustments',row.key,raw===''?0:n);};
 const adjustTile=(row,raw)=>{const n=Number(raw);if(raw!==''&&!Number.isFinite(n))return;patchState('victorianHippedTileSummary','adjustments',row.key,raw===''?0:n);};
 const adjust=(row,raw)=>{const n=Number(raw);if(raw!==''&&!Number.isFinite(n))return;patch('adjustments',row.key,raw===''?0:n);};
 return <><VictorianHippedNavigation/><main className="app-page-content vh-summary"><h1>Summary — Cost &amp; Weight Breakdown</h1><SummaryQuoteIdentity inputs={inputs} family="victorian-hipped" customer={customer}/>

 <p>Tick Exclude to drop an item’s cost from the quote while its installed weight remains included. Use +/− to adjust supplied quantities.</p>
 {!model.valid?<p role="alert">{model.errors.join(' ')} <Link to="/quote/victorian-hipped">Return to Design/Options</Link></p>:<>
 <SummaryElementSection title="Timber Elements" note="Order Qty shows pooled whole-stock allowances; Shared rows use that stock. Stock counts are allowances, not cutting layouts." rows={model.rows} totals={model.totals} showChargeable showAddItem={false} onAdjust={adjust} onExclude={row=>patch('exclusions',row.key,!row.excluded)}/>
 {model.missingPrices.length>0&&<p role="alert">Configure these prices in <Link to="/materials">Materials</Link>: {model.missingPrices.map(r=>r.label).join('; ')}. The subtotal includes configured prices only.</p>}
 
 <SummaryElementSection title="Tile Elements" rows={tiles.rows} totals={tiles.totals} showAddItem={false} onAdjust={adjustTile} onExclude={row=>patchState('victorianHippedTileSummary','exclusions',row.key,!row.excluded)}/>
 {tiles.missingPrices.length>0&&<p role="alert">Configure Tile Elements prices/coverage in <Link to="/materials">Materials</Link>: {tiles.missingPrices.map(r=>r.label).join('; ')}.</p>}
 {!plastics.valid?<p role="alert">Plastics could not be calculated: {plastics.errors.join(' ')}</p>:<>
 <SummaryElementSection title="Plastics Elements" rows={plastics.rows} totals={plastics.totals} showAddItem={false} onAdjust={adjustPlastics} onExclude={row=>patchState('victorianHippedPlasticsSummary','exclusions',row.key,!row.excluded)}/>
 {plastics.missingPrices.length>0&&<p role="alert">Configure Plastics prices in <Link to="/materials">Materials</Link>: {plastics.missingPrices.map(r=>r.label).join('; ')}.</p>}
 
 </>}
 {!metalGutter.valid?<p role="alert">Metal/guttering could not be calculated: {metalGutter.errors.join(' ')}</p>:<>
 {[['Metal Elements',metalGutter.metal],['Guttering Elements',metalGutter.guttering]].map(([title,section])=><React.Fragment key={title}><SummaryElementSection title={title} rows={section.rows} totals={section.totals} showAddItem={false} onAdjust={adjustMetalGutter} onExclude={row=>patchState('victorianHippedMetalGutterSummary','exclusions',row.key,!row.excluded)}/>{section.missingPrices.length>0&&<p role="alert">Configure {title} prices in <Link to="/materials">Materials</Link>: {section.missingPrices.map(r=>r.label).join('; ')}.</p>}</React.Fragment>)}
 
 </>}
 {!misc.valid?<p role="alert">Insulation/Miscellaneous could not be calculated: {misc.errors.join(' ')}</p>:<>
 <SummaryElementSection title="Miscellaneous" rows={misc.rows} totals={misc.totals} showAddItem={false} onAdjust={adjustMisc} onExclude={row=>patchState('victorianHippedMiscSummary','exclusions',row.key,!row.excluded)}/>
 {misc.missingPrices.length>0&&<p role="alert">Configure Miscellaneous prices in <Link to="/materials">Materials</Link>: {misc.missingPrices.map(r=>r.label).join('; ')}.</p>}
 
 </>}
 

 {quotation.valid?<SummaryPricingOverview sellingPriceReady={quotation.ready} sellingPriceMessage="Complete material prices, customer details and delivery distance before issuing this quotation." baseCost={reconciliation.knownMaterialsCost} materialsCost={reconciliation.knownMaterialsCost} materialsWeight={reconciliation.knownSuppliedWeightKg} installedWeight={reconciliation.knownSuppliedWeightKg+(misc.plasterboard?.weightKg||0)} plasterboardQty={misc.plasterboard?.sheets||0} labour={quotation.labour} delivery={quotation.delivery} pricing={quotation.pricing} labourConfig={labourConfig} deliveryConfig={deliveryConfig} markupConfig={markupConfig} overrideDays={inputs.labourDaysOverride??''} onLabourConfig={value=>{const next={...labourConfig,...value};setLabourConfig(next);saveLabourPricingConfig(next);}} onDeliveryConfig={value=>{const next={...deliveryConfig,...value};setDeliveryConfig(next);saveDeliveryPricingConfig(next);}} onMarkupConfig={value=>{const next={...markupConfig,...value};setMarkupConfig(next);saveMarkupPricingConfig(next);}} onOverride={value=>setInputs(old=>({...old,labourDaysOverride:value}))}>
 <p>Known installed weight includes the separate plasterboard guide once. Unconfigured weights remain excluded pending final review.</p>
 {!quotation.customerReady&&<p role="status">Selected customer details are loading or unavailable.</p>}{!quotation.distanceReady&&<p role="status">Use Quote on Design/Options to calculate delivery from the current postcode.</p>}{!reconciliation.materialRatesComplete&&<p role="status">Configure the missing material rates before issuing the quotation.</p>}
 </SummaryPricingOverview>:<p role="alert">{quotation.errors?.join(' ')}</p>}

 </>}
 <style>{`.vh-summary{font:14px Inter,system-ui,Arial;padding:16px}.vh-summary h1{font-size:22px;margin:8px 0}.vh-summary h2{font-size:18px}.vh-summary>details{margin:16px 0}.vh-summary>details>summary{font-weight:700;cursor:pointer}.vh-summary li{margin:5px 0}`}</style></main></>;
}
