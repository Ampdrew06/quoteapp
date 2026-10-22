import {buildVictorianTimberAudit} from './victorianTimberAudit';
import {buildVictorianSurfaceAreas} from '../geometry/victorianSurfaceAreas';
import {calculateRoofTiling} from './facetTilingCalc';
import {getTileProduct} from './tileProductConfig';
import {buildHipRidgeLathIntegrationAudit} from './hipRidgeLathIntegrationAudit';
import {planPlasticsStock} from './plasticsIntegrationAudit';
const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
function span(points,value){const hits=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if(Math.abs(a.y-b.y)<1e-8){if(Math.abs(value-a.y)<1e-7)hits.push(a.x,b.x);}else if(value>=Math.min(a.y,b.y)-1e-7&&value<=Math.max(a.y,b.y)+1e-7){const t=(value-a.y)/(b.y-a.y);hits.push(a.x+t*(b.x-a.x));}}return hits.length?Math.max(...hits)-Math.min(...hits):0;}
function local(g,facet){const f=g.facets.find(p=>p.id===facet.id),ux=(f.end.xMM-f.start.xMM)/f.internalLengthMM,uy=(f.end.yMM-f.start.yMM)/f.internalLengthMM;return facet.points.map(p=>({x:(p.x-f.start.xMM)*ux+(p.y-f.start.yMM)*uy,y:(p.x-f.start.xMM)*uy-(p.y-f.start.yMM)*ux}));}
export function buildVictorianInternalLaths({geometry:g,maximumSpacingMM=400}={}){
 const fail=message=>({valid:false,errors:[message],rows:[]});
 if(!g?.valid||!Number.isFinite(Number(maximumSpacingMM))||Number(maximumSpacingMM)<=0)return fail('Valid Victorian geometry and positive internal lath spacing required.');
 const ceiling=buildVictorianSurfaceAreas({geometry:g,flatWidthMM:595});if(!ceiling.valid)return fail(ceiling.errors.join(' '));
 const rows=[];
 ceiling.facets.forEach(f=>{const points=local(g,f),lo=Math.min(...points.map(p=>p.y)),hi=Math.max(...points.map(p=>p.y)),intervals=Math.max(1,Math.ceil((hi-lo)/Math.cos(f.pitchDeg*Math.PI/180)/maximumSpacingMM));
  for(let n=0;n<=intervals;n++){const positionMM=lo+(hi-lo)*n/intervals,lengthMM=span(points,positionMM);if(lengthMM>1e-7)rows.push({id:`${f.id}-${n}`,surface:f.id,positionMM,lengthMM,slopeSpacingMM:(hi-lo)/Math.cos(f.pitchDeg*Math.PI/180)/intervals});}
 });
 const flat=ceiling.flat.points.map(p=>({x:p.y,y:p.x})),lo=Math.min(...flat.map(p=>p.y)),hi=Math.max(...flat.map(p=>p.y)),flatRows=Math.max(2,Math.ceil((hi-lo)/maximumSpacingMM)-1);
 for(let n=1;n<=flatRows;n++){const positionMM=lo+(hi-lo)*n/(flatRows+1),lengthMM=span(flat,positionMM);if(lengthMM>1e-7)rows.push({id:`flat-${n}`,surface:'flat',positionMM,lengthMM,slopeSpacingMM:(hi-lo)/(flatRows+1)});}
 return {valid:true,errors:[],rows,flatRows,totalLengthM:rows.reduce((n,r)=>n+r.lengthMM/1000,0),maximumSpacingMM:Number(maximumSpacingMM),ceiling};
}
export function buildVictorianLathAudit({geometry:g,materials:m={},productId='britmetShingle',maximumInternalSpacingMM=400}={}){
 const fail=errors=>({valid:false,readOnly:true,errors,lines:[]});
 const product=getTileProduct(productId);if(!product)return fail(['Select a supported covering for the lath set-out.']);
 const timber=buildVictorianTimberAudit({geometry:g,materials:m});if(!timber.valid)return fail(timber.errors);
 const surface=buildVictorianSurfaceAreas({geometry:g,eavesExtensionMM:g.plyBaseWidthMM+50}),internal=buildVictorianInternalLaths({geometry:g,maximumSpacingMM:maximumInternalSpacingMM});
 if(!surface.valid||!internal.valid)return fail([...(surface.errors||[]),...(internal.errors||[])]);
 const steel=product.family==='steelShingle';
 const facets=surface.facets.map(f=>{const p=local(g,f),lo=Math.min(...p.map(a=>a.y)),hi=Math.max(...p.map(a=>a.y));return {id:f.id,label:g.facets.find(a=>a.id===f.id).label,baseWidthMM:span(p,lo),topWidthMM:Math.max(0,span(p,hi)),heightMM:(hi-lo)/Math.cos(f.pitchDeg*Math.PI/180),pitchDeg:Number(f.pitchDeg.toFixed(8)),topEdgeType:steel?'ridge':'gableRidgeWithoutExtraCourse'};});
 const result=calculateRoofTiling({facets,product:productId});if(result.errors.length)return fail(result.errors);
 const fieldRows=result.facets.flatMap((f,i)=>f.lathRows.map((r,n)=>({...r,id:`${facets[i].id}-${n}`,facetId:facets[i].id})));
 const fieldM=fieldRows.filter(r=>r.kind!=='chamferedPerimeter').reduce((n,r)=>n+r.widthMM/1000,0),chamferM=fieldRows.filter(r=>r.kind==='chamferedPerimeter').reduce((n,r)=>n+r.widthMM/1000,0);
 // Undo the timber-end allowance to recover full covering/support edges, including the boss region.
 const edges=[{id:'ridge',kind:'ridge',lengthMM:g.ridgeEndYMM},...timber.memberSchedule.members.filter(r=>r.type==='Hip').map(r=>({id:r.ref,kind:'hip',lengthMM:r.topEdgeMM+timber.memberSchedule.bossTopContinuationMM}))];
 const support=buildHipRidgeLathIntegrationAudit({edgeModel:{valid:true,edges},tileSystem:productId,materials:m,currentLathM:fieldM+chamferM});if(!support.valid)return fail(support.errors);
 const lines=[],weight=rate(m.chamferLath?.weight_kg_per_m);
 const add=(key,label,lengthM,price)=>{const p=rate(price);lines.push({key,label,lengthM,cost:lengthM===0?0:p==null?null:lengthM*p,installedWeightKg:lengthM===0?0:weight==null?null:lengthM*weight});};
 add('field','25×50 external tile-fixing laths',fieldM,m.lath25x50?.price_per_m);
 add('chamfer',`Chamfered eaves laths — ${g.facets.length} facets`,chamferM,m.chamferLath?.price_per_m);
 add('hipSupport','25×50 hip support laths',support.quantities.hipLathM,m.chamferLath?.price_per_m);
 add('ridgeSupport','25×50 ridge support laths',support.quantities.ridgeLathM,m.chamferLath?.price_per_m);
 add('internal','25×50 internal ceiling laths',internal.totalLengthM,m.lath25x50?.price_per_m);
 const alreadyCounted=timber.lines.filter(l=>['outerLaths','finishingLaths'].includes(l.key)).map(l=>({key:l.key,label:l.label,lengthM:l.quantity})),newLathM=lines.reduce((n,l)=>n+l.lengthM,0),ringLathM=alreadyCounted.reduce((n,l)=>n+l.lengthM,0),stockM=Number(m.lath_stock_length_m??4.8);
 if(!Number.isFinite(stockM)||stockM<=0)return fail(['Lath stock length must be positive.']);
 const runs=fieldRows.filter(r=>r.widthMM>1e-7).map(r=>({edgeId:r.id,runM:r.widthMM/1000,widthMM:50}));
 support.rows.forEach(row=>{for(let n=0;n<row.lathQty;n++)runs.push({edgeId:`support-${row.edgeId}-${n}`,runM:row.edgeLengthM,widthMM:50});});
 internal.rows.forEach(r=>runs.push({edgeId:r.id,runM:r.lengthMM/1000,widthMM:50}));
 timber.ringBeams.forEach(b=>{runs.push({edgeId:`${b.reference}-outer`,runM:Math.max(b.layers.outerLath25x50.internalEdgeLengthMM,b.layers.outerLath25x50.externalEdgeLengthMM)/1000,widthMM:50});b.upstands.forEach(u=>runs.push({edgeId:`${b.reference}-finish-${u.bay}`,runM:u.widthMM/1000,widthMM:50}));});
 const stockPlan=planPlasticsStock(runs,stockM),allLathM=newLathM+ringLathM;
 return {valid:true,readOnly:true,errors:[],warnings:result.warnings,productId,productLabel:product.label,steel,facets,result,fieldRows,internal,support,edges,lines,alreadyCounted,newLathM,ringLathM,allLathM,stockM,stockPlan,linearMinimumLengths:Math.ceil(allLathM/stockM),
  knownCost:lines.reduce((n,l)=>n+(l.cost??0),0),knownInstalledWeightKg:lines.reduce((n,l)=>n+(l.installedWeightKg??0),0),costComplete:lines.every(l=>l.cost!=null),weightComplete:lines.every(l=>l.installedWeightKg!=null),
  notes:[`External lath rows reuse the existing tile-product set-out engine on ${g.facets.length} developed roof facets, including the50mm tile-starter extension beyond the ply base. Chamfered perimeter rows are separated from fixing rows and counted once.`,
   'Steel:225mm first fixing offset, then255mm gauge. Slate uses shared pitch bands/eaves support rows. The two side ridge edges retain the agreed no-extra-short-slate-ridge-course rule.',
   'Internal laths follow each finished ceiling slope at no more than the selected spacing, plus two longitudinal runs on the standard595mm closure flat. Surface intersections determine each run length.',
   'Steel uses two25×50 supports per full hip and ridge; slate uses none. Support lengths include the boss region and do not inherit the timber-end deduction. Hip foam tape quantities are shown for the later fittings audit, not charged here.',
   'Outer ring-beam and upstand finishing laths are already charged in Timber & plywood; they are shown here for pooled stock only, without duplicate cost or weight.',
   'New lath costs use net metres at saved rates, matching the existing lath audit convention. No extra percentage waste is added here. Pooled stock is a separate order allowance, not another charge.',
   'Stock planning reuses the shared offcut planner without saw kerf. It is an allowance, not a validated factory cut/numbering list; long-run joints require supported positions. Chamfering suitability of reused offcuts needs workshop review.',
   'Read-only: no live quotation, Summary or manufacture cut-list changes. Tile/accessory quantities are not released by this lath audit.']};
}
