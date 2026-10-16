import VictorianNavigation from './VictorianNavigation';
import {summaryOrderQuantity} from '../../lib/Calculations/summaryOrderQuantity';
import {summaryInsulationAreaDisplay} from '../../lib/Calculations/summaryInsulationAreaDisplay';
import {Navigate} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import {SummaryHeader,SummaryElementSection,SummaryPricingOverview} from '../../components/SummaryTemplate';
import {buildVictorianQuotation} from '../../lib/Calculations/victorianQuotation';
import {getLabourPricingConfig,getDeliveryPricingConfig,getMarkupPricingConfig,saveLabourPricingConfig,saveDeliveryPricingConfig,saveMarkupPricingConfig} from '../../lib/pricing';
import React,{useState,useEffect} from 'react';
import {Link} from 'react-router-dom';
import {getMaterials} from '../../lib/materials';
import {getCustomers} from '../../lib/customers';
import {buildVictorianSummaryMaterialsModel} from '../../lib/Calculations/victorianSummaryMaterialsModel';
import {buildSummaryItemCatalog,normalizeAddedItems} from '../../lib/Calculations/summaryAddedItems';

const labels={timber:'Timber Elements',tiles:'Tile Elements',plastics:'Plastic Elements',metal:'Metal Elements',gutters:'Guttering Elements',misc:'Miscellaneous Elements'};


export default function VictorianSummary(){return isAdminUser()?<VictorianSummaryContent/>:<Navigate to="/quote" replace/>;}
export function VictorianSummaryContent(){
 const storageKey='victorianPlanPreviewInputs',family='victorian',modelBuilder=buildVictorianSummaryMaterialsModel,quotationBuilder=buildVictorianQuotation;
 const KEY=storageKey;
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{return {};}};
 const [inputs,setInputs]=useState(read),[materials,setMaterials]=useState(getMaterials),[customers,setCustomers]=useState([]);
 const [labourConfig,setLabourConfig]=useState(getLabourPricingConfig),[deliveryConfig,setDeliveryConfig]=useState(getDeliveryPricingConfig),[markupConfig,setMarkupConfig]=useState(getMarkupPricingConfig);
 useEffect(()=>{
  let alive=true;const refresh=()=>setMaterials(getMaterials());
  const load=async()=>{const rows=await getCustomers();if(alive)setCustomers(Array.isArray(rows)?rows:[]);};load();
  window.addEventListener('materials_updated',refresh);window.addEventListener('quoteapp_customers_updated',load);
  return ()=>{alive=false;window.removeEventListener('materials_updated',refresh);window.removeEventListener('quoteapp_customers_updated',load);};
 },[]);
 useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(inputs));},[inputs]);
 const model=modelBuilder({inputs,materials});
 const patch=value=>setInputs(old=>({...old,...value}));
 const addItems=items=>patch({summaryAddedItems:normalizeAddedItems(items)});
 const adjust=(row,raw)=>{
 const value=Number(raw);if(raw!==''&&!Number.isFinite(value))return;
 if(row.source.isAddedItem){addItems((inputs.summaryAddedItems||[]).map(item=>item.section===row.source.section&&item.catalogId===row.source.catalogId?{...item,qty:Math.max(0,1+(value||0))}:item));return;}
 setInputs(old=>({...old,summaryPricingState:{...old.summaryPricingState,adjustments:{...old.summaryPricingState?.adjustments,[row.key]:value||0}}}));
 };
 const exclude=(row,value)=>{
  if(row.isAddedItem){addItems((inputs.summaryAddedItems||[]).map(item=>item.section===row.section&&item.catalogId===row.catalogId?{...item,excluded:value}:item));return;}
  setInputs(old=>({...old,summaryPricingState:{...old.summaryPricingState,exclusions:{...old.summaryPricingState?.exclusions,[row.key]:value}}}));
 };
 const catalog=buildSummaryItemCatalog(materials);
 const timberOrderDisplay={};
 const customer=customers.find(c=>c.id===inputs.selectedCustomerId)||null;
 const quotation=quotationBuilder({inputs,materials,customer,labourConfig,deliveryConfig,markupConfig});
 return <main style={{fontFamily:'Inter,system-ui,Arial',maxWidth:1120,margin:'0 auto',padding:12}}>
 <VictorianNavigation/>
 <h1>Victorian · Summary</h1><p>Admin review. Installed weight is a partial allowance until the final weight review. Save and reopen quotes from Design/Options.</p>
 <section style={{display:'flex',flexWrap:'wrap',gap:12,margin:'12px 0'}}>
 <label>Customer<select value={inputs.selectedCustomerId||'retail'} onChange={e=>patch({selectedCustomerId:e.target.value,customerName:customers.find(c=>c.id===e.target.value)?.name||'Retail'})}><option value="retail">Retail</option>{customers.filter(c=>c.id!=='retail').map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <label>Customer reference<input value={inputs.customerReference||''} onChange={e=>patch({customerReference:e.target.value})}/></label>
 <label>Delivery postcode<input value={inputs.deliveryPostcode||''} onChange={e=>patch({deliveryPostcode:e.target.value,deliveryDistanceMiles:'',deliveryDistancePostcode:''})}/></label>
 <label>One-way delivery miles · admin entry<input type="number" min="0" step="0.1" value={inputs.deliveryDistanceMiles??''} onChange={e=>patch({deliveryDistanceMiles:e.target.value,deliveryDistancePostcode:inputs.deliveryPostcode||''})}/></label>
 </section><p style={{fontSize:12}}>For this admin review, enter the verified one-way road distance. Without a postcode the existing customer/default delivery allowance applies.</p>
 <SummaryHeader/>
 {!model.valid?<p role="status">{model.errors.join(' ')} <Link to={"/quote/"+family}>Return to Design/Options</Link></p>:<>
 {Object.entries(model.sections).map(([section,data])=>{
 const choices=catalog.filter(item=>item.section===section&&!(inputs.summaryAddedItems||[]).some(added=>added.section===section&&added.catalogId===item.id));
 const rows=data.lines.map(row=>({key:row.key,label:row.label+(row.usage==='factory'?' (factory use)':''),qty:row.qty,orderQty:summaryOrderQuantity(row),units:row.units,cost:row.line,chargeableCost:row.line,weightText:row.isAddedItem?'—':row.weight_unconfigured?'Unconfigured':row.weight_kg.toFixed(2)+' kg',excluded:row.excluded,isAddedItem:row.isAddedItem,priceMissing:row.price_unconfigured,adjustment:row.isAddedItem?(row.qty-1||''):(inputs.summaryPricingState?.adjustments?.[row.key]??''),source:row,...(section==='timber'?timberOrderDisplay[row.key]:section==='misc'?summaryInsulationAreaDisplay(row):{})}));
 return <SummaryElementSection note={section==='timber'?'Timber quantities show the accepted net metre/area allowances. Whole-stock optimisation and cutting instructions remain in the audits; no extra stock charge is added here.':''} key={section} title={section==='plastics'?'Plastics Elements':section==='misc'?'Miscellaneous':labels[section]} rows={rows} totals={data.totals} showChargeable={section==='timber'} choices={choices} onAdd={id=>{if(id)addItems([...(inputs.summaryAddedItems||[]),{section,catalogId:id,qty:1}]);}} onAdjust={adjust} onExclude={row=>exclude(row.source,!row.excluded)} onRemove={row=>addItems((inputs.summaryAddedItems||[]).filter(item=>!(item.section===section&&item.catalogId===row.source.catalogId)))}/>;
 })}
 <p><b>Weight review pending:</b> the totals below include known weights only.</p><SummaryPricingOverview sellingPriceReady={quotation.distanceReady} quoteMatchNote={false} baseCost={model.materialsBaseCost} materialsCost={model.materialsCostForPricing} materialsWeight={model.materialsWeightKg} installedWeight={model.installedWeightKg} plasterboardQty={model.plasterboard.sheets} labour={quotation.labour} delivery={quotation.delivery} pricing={quotation.pricing} labourConfig={labourConfig} deliveryConfig={deliveryConfig} markupConfig={markupConfig} overrideDays={inputs.labourDaysOverride??''} onLabourConfig={value=>{const next={...labourConfig,...value};setLabourConfig(next);saveLabourPricingConfig(next);}} onDeliveryConfig={value=>{const next={...deliveryConfig,...value};setDeliveryConfig(next);saveDeliveryPricingConfig(next);}} onMarkupConfig={value=>{const next={...markupConfig,...value};setMarkupConfig(next);saveMarkupPricingConfig(next);}} onOverride={value=>patch({labourDaysOverride:value})}>
 <p style={{fontSize:12}}>Plasterboard: {model.plasterboard.installedAreaM2.toFixed(3)}m²; {model.plasterboardWeightKg.toFixed(2)}kg included once. Supply is excluded unless added. Unconfigured weights are not included. Supply extras and quantity changes do not alter installed geometry.</p>
 <details><summary>Calculation notes</summary><ul>{model.notes.map(note=><li key={note}>{note}</li>)}</ul></details>
 {model.supplyReviews.map(note=><p key={note} role="status">{note}</p>)}
 {model.missingPrices.length>0&&<p role="status">Configure these Materials prices before quoting: {model.missingPrices.map(r=>r.label).join('; ')}.</p>}
 {!quotation.customerReady&&<p role="status">Selected customer details are loading or unavailable.</p>}
 {!quotation.distanceReady&&<p role="status">Calculate delivery distance on Design/Options before issuing the quotation.</p>}
 </SummaryPricingOverview>
 </>}
 </main>;
}
