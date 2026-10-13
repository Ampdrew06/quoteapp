import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {SummaryHeader,SummaryElementSection,SummaryPricingOverview} from './SummaryTemplate';
const find=(node,predicate)=>{if(Array.isArray(node)){for(const child of node){const found=find(child,predicate);if(found)return found;}return null;}if(!node||typeof node!=='object')return null;return predicate(node)?node:find(node.props?.children,predicate);};
test('shared material table displays order quantity, weight and separate chargeable cost',()=>{
 const html=renderToStaticMarkup(<SummaryElementSection title="Timber Elements" rows={[{key:'r',label:'Timber',qty:10,orderQty:2,units:'m',weightText:'4.00 kg',cost:20,chargeableCost:25}]} totals={{cost:20,chargeableCost:25,weight:4}} showChargeable choices={[]} onAdd={()=>{}} onExclude={()=>{}} onAdjust={()=>{}} onRemove={()=>{}}/>);
 for(const label of ['Order Qty','Weight','Chargeable Cost','Add item','£20.00','£25.00','4.00 kg'])expect(html).toContain(label);
});
test('shared table preserves adjustment and exclusion callbacks',()=>{
 const calls=[],row={key:'r',label:'Concrete screws',qty:8,adjustment:0};
 const tree=SummaryElementSection({title:'Miscellaneous',rows:[row],totals:{},onAdjust:(r,value)=>calls.push(['adjust',r.key,value]),onExclude:r=>calls.push(['exclude',r.key]),onAdd:()=>{},onRemove:()=>{}});
 find(tree,n=>n.props?.['aria-label']==='Adjustment Concrete screws').props.onBlur({target:{value:'2'}});
 find(tree,n=>n.props?.['aria-label']==='Exclude price Concrete screws').props.onChange();
 expect(calls).toEqual([['adjust','r','2'],['exclude','r']]);
});
test('common totals and controls render supplied pricing without recalculating it',()=>{
 const html=renderToStaticMarkup(<SummaryPricingOverview baseCost={100} materialsCost={125} installedWeight={60} materialsWeight={50} plasterboardQty={4} labour={{labourCost:300,days:1}} delivery={{deliveryCost:40,oneWayMiles:12,returnMiles:24,timeCost:30,fuelCost:10}} pricing={{net:500,vat:100,gross:600,vatRate:.2,profitPct:60,profit:180,marginPct:36}} labourConfig={{dayRate:300,minimumDays:1}} deliveryConfig={{hourlyRate:17.96,vanMpg:26,fuelPricePerLitre:1.99}} markupConfig={{profitPct:60}} onLabourConfig={()=>{}} onDeliveryConfig={()=>{}} onMarkupConfig={()=>{}} onOverride={()=>{}}/>);
 for(const label of ['Overall Totals','Pricing reconciliation','Pricing overview','Controls','Fuel Price Per Litre','£600.00','12.00 miles','4 boards'])expect(html).toContain(label);
});
test('shared controls pass through global configuration and quote-only override separately',()=>{
 const changes=[];
 const tree=SummaryPricingOverview({onLabourConfig:v=>changes.push(v),onDeliveryConfig:()=>{},onMarkupConfig:()=>{},onOverride:v=>changes.push(v)});
 find(tree,n=>n.props?.['aria-label']==='Day Rate (£)').props.onChange({target:{value:'325'}});
 find(tree,n=>n.props?.['aria-label']==='Override Days (this quote only)').props.onChange({target:{value:'1.8'}});
 expect(changes).toEqual([{dayRate:325},'1.8']);expect(renderToStaticMarkup(<SummaryHeader/>)).toContain('Summary — Cost');
});
