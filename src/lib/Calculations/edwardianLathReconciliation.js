import {planPlasticsStock} from './plasticsIntegrationAudit';
import {buildEdwardianRingBeamAudit} from './edwardianRingBeamAudit';
import {buildEdwardianTilingAudit} from './edwardianTilingAudit';
import {buildEdwardianInternalLathAudit} from './edwardianInternalLathAudit';
export function buildEdwardianLathReconciliation({geometry:g,materials:m={},productId='britmetShingle'}={}){
 const ring=buildEdwardianRingBeamAudit({geometry:g}),tiles=buildEdwardianTilingAudit({geometry:g,materials:m,productId}),internal=buildEdwardianInternalLathAudit({geometry:g,materials:m});
 if(!ring.valid||!tiles.valid||!internal.valid)return {valid:false,errors:['Valid ring-beam, tiling and internal lath audits are required.']};
 const stockM=Number(m.lath_stock_length_m??4.8);if(!Number.isFinite(stockM)||stockM<=0)return {valid:false,errors:['Positive lath stock length is required.']};
 const runs=[],add=(edgeId,runM)=>{if(runM>0)runs.push({edgeId,runM,widthMM:50});};
 tiles.result.facets.forEach(f=>f.lathRows.forEach((r,i)=>add(`${f.facet.id}-field-${i}`,r.widthMM/1000)));
 if(tiles.steel)tiles.edges.forEach(e=>{add(`${e.id}-support-1`,e.lengthMM/1000);add(`${e.id}-support-2`,e.lengthMM/1000);});
 ring.ringBeams.forEach(b=>{add(`${b.id}-outer`,b.layerProfiles.outerLath25x50.externalEdgeLengthMM/1000);b.bayWidthsMM.forEach((w,i)=>add(`${b.id}-finish-${i}`,w/1000));});
 internal.rows.forEach(r=>add(`internal-${r.id}`,r.lengthMM/1000));
 const lathUses=[{label:'External field, including perimeter rows',lengthM:tiles.fieldLathM},{label:'Hip/ridge support',lengthM:tiles.support.quantities.additionalLathM},{label:'Ring-beam outer fixing',lengthM:ring.schedule.totals.outerFixingLath25x50LengthM},{label:'Ring-beam finishing',lengthM:ring.schedule.totals.finishingLath25x50LengthM},{label:'Internal ceiling',lengthM:internal.totalLengthM}];
 const usedM=lathUses.reduce((n,r)=>n+r.lengthM,0),plan=planPlasticsStock(runs,stockM),price=m.lath25x50?.price_per_m,weight=m.chamferLath?.weight_kg_per_m;
 const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
 return {valid:true,readOnly:true,errors:[],stockM,lathUses,usedM,linearMinimum:Math.ceil(usedM/stockM),stockQty:plan.qty,purchasedM:plan.qty*stockM,stockPlan:plan,cost:rate(price)==null?null:plan.qty*stockM*rate(price),installedWeightKg:rate(weight)==null?null:usedM*rate(weight),notes:['All five 25×50 uses are pooled once. Field perimeter rows are already included; support and ring-beam uses are added once.',
 'The stock candidate uses the same practical offcut planner as Gable. It retains individual run lengths and shares suitable offcuts; total metres alone is only a lower bound.',
 'No saw kerf is added by the inherited fitting planner. Longer-than-stock joints need workshop support-position review; this is not a validated cutting list.',
 'Cost is purchased stock metres at the saved rate. Installed weight uses net used metres. At integration this replaces separate lath cost rows rather than adding another charge.',
 'Read-only: no Summary or quotation changes.']};
}
