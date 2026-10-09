import {planPlasticsStock} from './plasticsIntegrationAudit';
import {buildGableInternalLathAudit} from './gableInternalLathAudit';
import {coveringWeightRates} from './installedCoveringWeights';

// Reconciles existing requirements without changing their source audits.
export function buildGableLathMembraneAudit({geometry:g,timberAudit:t,tilingAudit:tiles,insulationAudit:i,materials:m={}}={}) {
 const fail=message=>({valid:false,readOnly:true,errors:[message],lathUses:[]});
 if(!g?.valid||!t?.valid||!tiles?.valid||!i?.valid)return fail('Valid geometry, timber, tiling and insulation audits are required.');
 const stockM=Number(m.lath_stock_length_m??4.8);
 if(!Number.isFinite(stockM)||stockM<=0)return fail('Lath stock length must be positive.');
 const internal=buildGableInternalLathAudit({geometry:g,materials:m});
 if(!internal.valid)return fail(internal.errors.join(' '));
 const lathUses=[
  {key:'field',label:'External field laths, including chamfered eaves rows',lengthM:tiles.fieldLathM},
  {key:'ridge',label:'Ridge support laths',lengthM:tiles.ridgeLathM},
  {key:'outer',label:'Outer ring-beam fixing laths',lengthM:t.schedule.totals.outerFixingLath25x50LengthM},
  {key:'finishing',label:'Upstand finishing laths',lengthM:t.schedule.totals.finishingLath25x50LengthM},
  {key:'internal',label:'Internal slopes and central flat fixing laths',lengthM:internal.totalLengthM},
 ];
 const knownLathM=lathUses.reduce((sum,row)=>sum+row.lengthM,0);
 const linearMinimumLengths=Math.ceil(knownLathM/stockM);
 // Preserve continuous long runs instead of treating all offcuts as freely
 // interchangeable metres. Reuse fitting finishing pieces where possible.
 const projectionM=(g.manufacturingProjectionMM??g.externalProjectionMM)/1000;
 const runs=[];
 const addRun=(edgeId,runM)=>runs.push({edgeId,runM,widthMM:50});
 tiles.result.facets.forEach(f=>f.lathRows.forEach((row,n)=>addRun(f.facet.id+'-field-'+n,row.widthMM/1000)));
 if(tiles.ridgeLathM>0){addRun('ridge-left',projectionM);addRun('ridge-right',projectionM);}
 t.ringBeams.forEach((beam,n)=>addRun('outer-'+n,beam.lengthMM/1000));
 t.bayWidthsMM.forEach((width,n)=>{addRun('finish-left-'+n,width/1000);addRun('finish-right-'+n,width/1000);});
 internal.rows.forEach(row=>addRun('internal-'+row.id,row.lengthMM/1000));
 const stockPlan=planPlasticsStock(runs,stockM);
 const knownStockLengths=stockPlan.qty;
 const memberFaceAreaM2=g.feet.reduce((sum,f)=>sum+f.externalSlopeMM,0)*(g.manufacturingProjectionMM??g.externalProjectionMM)/1e6,tileFaceAreaM2=i.membrane.installedAreaM2;
 const kgPerM2=coveringWeightRates(m).membraneKgPerM2;
 return {valid:true,readOnly:true,errors:[],lathUses,stockM,knownLathM,knownStockLengths,linearMinimumLengths,stockPlan,
  internal,internalLathsConfirmed:true,complete:true,
  membrane:{memberFaceAreaM2,tileFaceAreaM2,edgeAreaM2:tileFaceAreaM2-memberFaceAreaM2,
   memberFaceWeightKg:memberFaceAreaM2*kgPerM2,tileFaceWeightKg:tileFaceAreaM2*kgPerM2,
   kgPerM2,rolls:i.membrane.rolls,rollCost:i.membrane.cost,coverageReview:Math.max(memberFaceAreaM2,tileFaceAreaM2)>50},
  notes:[
   'The external field subtotal already includes the chamfered eaves rows. Do not add those rows again.',
   'All five 25×50 requirements, including the internal ceiling laths, are pooled before stock rounding. Long runs are kept continuous within stock length, and suitable offcuts are reused for finishing pieces. Total metres alone can understate the required stock.',
   'The stock candidate uses the existing shared offcut planner, without saw-kerf allowance. It remains a fitting allowance, not a validated factory cutting list; longer-than-stock joints need support-position review. No new lath cost is added to the existing audit subtotals.',
   'The membrane comparison shows external member faces versus tile coverage including the 50mm plan extension at each eaves. The confirmed whole-roof membrane requirement uses the tile-starter boundary, matching the insulation audit.',
   'Overlap, surplus and a full unopened roll are excluded from installed roof weight. One supplied 50m² roll remains the ordering allowance; a larger roof needs coverage review.',
   'Internal laths follow the confirmed foot-cut junction and full house-to-front run length. The standard 595mm flat has two runs; the slope positioning allowance remains approximately 400mm.',
   'Read-only reconciliation: tile ordering, Summary, quotations, manufacture book and Idiot List are unchanged.',
  ]};
}
