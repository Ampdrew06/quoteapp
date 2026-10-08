import {buildRingBeam,RING_BEAM_MEMBER_SLOT_WIDTH_MM} from '../Manufacturing/ringBeamBuilder';
import {buildRingBeamManufactureSchedule} from '../Manufacturing/ringBeamManufactureSchedule';
const rate=value=>value==null||value===''||!Number.isFinite(Number(value))||Number(value)<0?null:Number(value);
export function buildGableTimberAudit({geometry:g,materials:m={}}={}) {
 if(!g?.valid)return {valid:false,errors:g?.errors||['Valid Gable geometry is required.'],lines:[]};
 const count=g.layout.trussCount,slotWidthMM=RING_BEAM_MEMBER_SLOT_WIDTH_MM;
 const bayWidthsMM=g.layout.gapsMM.map(gap=>gap-slotWidthMM);
 const ringBeams=g.feet.map(foot=>buildRingBeam({id:`gable-${foot.side}`,label:`${foot.side} ring-beam`,lengthMM:(g.manufacturingProjectionMM??g.externalProjectionMM),internalLengthMM:(g.manufacturingProjectionMM??g.externalProjectionMM),externalLengthMM:(g.manufacturingProjectionMM??g.externalProjectionMM),baseWidthMM:foot.hfcMM,pitchDeg:g.pitchDeg,soffitDepthMM:foot.hfcMM-g.frameMM,plumbCutHeightMM:foot.vfcMM,bayWidthsMM,memberSlotWidthMM:slotWidthMM}));
 const schedule=buildRingBeamManufactureSchedule({members:ringBeams.map((ringBeam,i)=>({id:ringBeam.id,side:g.feet[i].side,manufactureRef:`RB${i+1}`,ringBeam}))});
 const totals=schedule.totals,lines=[];
 const add=(key,label,quantity,unit,config,price,weight)=>{
  const waste=rate(config?.waste_percent??config?.waste_pct??m.global_waste_percent??10);
  const pricePerUnit=rate(price),weightPerUnit=rate(weight),chargeableQuantity=waste==null?null:quantity*(1+waste/100);
  lines.push({key,label,quantity,unit,wastePercent:waste,chargeableQuantity,pricePerUnit,weightPerUnit,cost:pricePerUnit==null||chargeableQuantity==null?null:chargeableQuantity*pricePerUnit,installedWeightKg:weightPerUnit==null?null:quantity*weightPerUnit});
 };
 add('joists','220mm truss members',count*g.feet.reduce((sum,f)=>sum+f.externalSlopeMM/1000,0),'m',m.steico,m.steico?.price_per_m,m.steico?.weight_kg_per_m);
 add('gussets','9mm gussets — two per truss',count*2*g.truss.gusset.areaEachM2,'m²',m.ply9mm,m.ply9mm?.price_per_m2,m.ply9mm?.weight_kg_per_m2);
 const facePoints=[{xMM:-g.feet[0].hfcMM,yMM:g.truss.ringBeamHeightMM+g.feet[0].vfcMM},g.truss.apexTop,{xMM:g.widthMM+g.feet[1].hfcMM,yMM:g.truss.ringBeamHeightMM+g.feet[1].vfcMM},{xMM:g.widthMM+g.feet[1].hfcMM,yMM:g.truss.ringBeamHeightMM},{xMM:g.widthMM,yMM:g.truss.ringBeamHeightMM},g.truss.gusset.points[2],g.truss.gusset.points[3],{xMM:0,yMM:g.truss.ringBeamHeightMM},{xMM:-g.feet[0].hfcMM,yMM:g.truss.ringBeamHeightMM}];
 const fullFrontFaceAreaM2=Math.abs(facePoints.reduce((sum,p,i)=>{const q=facePoints[(i+1)%facePoints.length];return sum+p.xMM*q.yMM-q.xMM*p.yMM;},0))/2e6;
 const frontFaceAdditionalAreaM2=Math.max(0,fullFrontFaceAreaM2-g.truss.gusset.areaEachM2);
 add('frontFace','9mm full front face — area beyond existing outer gusset',frontFaceAdditionalAreaM2,'m²',m.ply9mm,m.ply9mm?.price_per_m2,m.ply9mm?.weight_kg_per_m2);
 add('chevrons','18mm chevrons — two per truss',count*2*g.truss.chevron.areaEachM2,'m²',m.ply18mm,m.ply18mm?.price_per_m2,m.ply18mm?.weight_kg_per_m2);
 add('closures','Assembled offcut closure allowance — one per truss',count*g.truss.closure.cutLengthMM/1000,'m',{},m.truss_closure_45x45_price_per_m,m.truss_closure_45x45_weight_kg_per_m);
 add('pse','30×95 PSE — two square-ended runs',totals.pse30x90LengthM,'m',m.pse30x90,m.ringbeam_pse90x30_per_m??m.pse30x90?.price_per_m,m.pse30x90?.weight_kg_per_m);
 add('bases','9mm ring-beam bases',totals.ply9BaseAreaM2,'m²',m.ply9mm,m.ply9mm?.price_per_m2,m.ply9mm?.weight_kg_per_m2);
 add('upstands','9mm ring-beam upstands',totals.ply9UpstandAreaM2,'m²',m.ply9mm,m.ply9mm?.price_per_m2,m.ply9mm?.weight_kg_per_m2);
 const lathWeight=m.chamferLath?.weight_kg_per_m;
 add('outerLaths','25×50 outer ring-beam fixing laths',totals.outerFixingLath25x50LengthM,'m',m.chamferLath,m.lath25x50?.price_per_m,lathWeight);
 add('finishingLaths','25×50 upstand finishing laths',totals.finishingLath25x50LengthM,'m',m.chamferLath,m.lathFinish?.price_per_m,lathWeight);
 add('upstandPir','50mm PIR — upstand faces only',totals.pir50AreaM2,'m²',m.pir50,m.pir50?.price_per_m2,m.pir50?.weight_kg_per_m2);
 const sumKnown=key=>lines.reduce((sum,line)=>sum+(line[key]??0),0);
 return {valid:true,readOnly:true,errors:[],lines,ringBeams,schedule,bayWidthsMM,frontFace:{points:facePoints,fullAreaM2:fullFrontFaceAreaM2,additionalAreaM2:frontFaceAdditionalAreaM2},componentCounts:{trusses:count,trussMembers:count*2,gussets:count*2,chevrons:count*2,closures:count,ringBeams:2,upstands:bayWidthsMM.length*2},knownCost:sumKnown('cost'),knownInstalledWeightKg:sumKnown('installedWeightKg'),allPricesConfigured:lines.every(line=>line.cost!=null),allWeightsConfigured:lines.every(line=>line.installedWeightKg!=null),notes:[
 'Front truss retains its joint arrangement. Full outer 9mm face follows the two members and gusset outline, leaving the A-frame opening clear. Added area excludes its already-counted outer gusset: single-layer coverage assumed, not a second full overlay.',
 'Read-only partial audit: no Gable Summary, quotation or loading quantities are changed.',
 'Two 9mm gussets and two 18mm chevrons per truss; one assembled offcut closure allowance per truss. Closure allowance retains the Materials rate; no new 45×45 stock is ordered.',
 'Ring-beams reuse existing 195mm upstands, 185mm PIR face height, two PIR faces per bay and 48mm member slots. These inherited workshop dimensions need Gable confirmation.',
 'Both ends of each ring-beam layer are square: full external projection on both edges. Base width equals that side’s HFC. Clear bay widths are centre gaps minus 48mm.',
 'Costs use net material quantities plus configured waste; no whole-board or sheet cutting allocation is claimed. Joist weight uses the existing per-metre profile allowance.',
 'Rear 9mm wall packers, internal/external tiling laths, ridge support laths, factory fixings, glue and other materials remain outside this timber audit. Truss cradles and between-truss PIR slabs are shown in the separate insulation audit.',
 'Known subtotals exclude unconfigured rates; they are not complete roof cost or weight totals.'
 ]};
}
