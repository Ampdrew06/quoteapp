import {buildEdwardianSurfaceAreas} from '../geometry/edwardianSurfaceAreas';
const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
function span(points,axis,value){const hits=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],va=a[axis],vb=b[axis],other=axis==='x'?'y':'x';if(Math.abs(va-vb)<1e-8){if(Math.abs(value-va)<1e-7)hits.push(a[other],b[other]);}else if(value>=Math.min(va,vb)-1e-7&&value<=Math.max(va,vb)+1e-7){const t=(value-va)/(vb-va);hits.push(a[other]+t*(b[other]-a[other]));}}return hits.length?Math.max(...hits)-Math.min(...hits):0;}
export function buildEdwardianInternalLathAudit({geometry:g,materials:m={},maximumSpacingMM=400}={}){
 const fail=message=>({valid:false,readOnly:true,errors:[message],rows:[]});
 if(!g?.valid||!Number.isFinite(Number(maximumSpacingMM))||maximumSpacingMM<=0)return fail('Valid geometry and positive internal lath spacing are required.');
 const ceiling=buildEdwardianSurfaceAreas({geometry:g,flatWidthMM:595});if(!ceiling.valid)return fail(ceiling.errors.join(' '));
 const rows=[];
 for(const f of ceiling.facets){const axis=f.id==='front'?'y':'x',coords=f.points.map(p=>p[axis]),lo=Math.min(...coords),hi=Math.max(...coords),slopeRunMM=(hi-lo)/Math.cos(f.pitchDeg*Math.PI/180),intervals=Math.max(1,Math.ceil(slopeRunMM/maximumSpacingMM));
  for(let i=0;i<=intervals;i++){const positionMM=lo+(hi-lo)*i/intervals,lengthMM=span(f.points,axis,positionMM);if(lengthMM>1e-7)rows.push({id:`${f.id}-${i}`,surface:f.id,positionMM,lengthMM});}
 }
 const flatPoints=ceiling.flat.points,minX=Math.min(...flatPoints.map(p=>p.x)),maxX=Math.max(...flatPoints.map(p=>p.x)),flatRows=Math.max(2,Math.ceil(595/maximumSpacingMM)-1);
 for(let i=1;i<=flatRows;i++){const positionMM=minX+(maxX-minX)*i/(flatRows+1);rows.push({id:`flat-${i}`,surface:'flat',positionMM,lengthMM:span(flatPoints,'x',positionMM)});}
 const totalLengthM=rows.reduce((n,r)=>n+r.lengthMM/1000,0),price=rate(m.lath25x50?.price_per_m),weight=rate(m.chamferLath?.weight_kg_per_m);
 return {valid:true,readOnly:true,errors:[],rows,rowCount:rows.length,flatRows,maximumSpacingMM,totalLengthM,cost:price==null?null:totalLengthM*price,installedWeightKg:weight==null?null:totalLengthM*weight,notes:[
  'Internal fixing laths follow the finished three slopes and 595mm flat, over compressed SuperQuilt. Lower runs are at the foot-cut/ring-beam junction; rows are at no more than approximately 400mm.',
  'Side rows run longitudinally from the house wall to the hip boundary; front rows span between hips. Two longitudinal rows serve the standard flat and continue to its intersection with the front slope.',
  'These are net ceiling-profile runs, not a validated saw cutting list. Joint support and small overlaps at the slope/flat boundaries remain workshop allowances.',
  'Internal, external and ring-beam 25×50 stock will be pooled once in the later reconciliation, rather than ordering separately rounded packs from these audits.',
  'Read-only: no Summary, quotation or manufacture quantities are changed.'
 ]};
}
