import {buildRingBeam,RING_BEAM_MEMBER_SLOT_WIDTH_MM} from '../Manufacturing/ringBeamBuilder';
import {applyRectangularRingBeamJoints} from '../Manufacturing/rectangularRingBeamJoints';
import {buildRingBeamManufactureSchedule} from '../Manufacturing/ringBeamManufactureSchedule';
const slot=RING_BEAM_MEMBER_SLOT_WIDTH_MM;
export function buildEdwardianRingBeamAudit({geometry:g}={}) {
 if(!g?.valid)return {valid:false,errors:['Valid Edwardian geometry is required.'],ringBeams:[],schedule:null};
 const slotsFor=(side)=>{
  const length=side==='front'?g.widthMM:g.projectionMM;
  const slots=side==='front'?[
   {role:'hip-seat',leftMM:0,rightMM:slot},
   ...g.frontRafters.map(r=>({role:r.role,leftMM:r.centreMM-slot/2,rightMM:r.centreMM+slot/2})),
   {role:'hip-seat',leftMM:length-slot,rightMM:length}
  ]:[
   ...g.layout.centresMM.map((p,i)=>({role:i===g.layout.centresMM.length-1?'terminal-truss':'truss',leftMM:p-slot/2,rightMM:p+slot/2})),
   ...g.sideJacks.filter(r=>r.side===side).map(r=>({role:'jack',leftMM:r.positionMM-slot/2,rightMM:r.positionMM+slot/2})),
   {role:'hip-seat',leftMM:length-slot,rightMM:length}
  ];
  return slots.sort((a,b)=>a.leftMM-b.leftMM);
 };
 const definitions=['left','front','right'].map((side,i)=>{
  const front=side==='front',internalLengthMM=front?g.widthMM:g.projectionMM;
  const baseWidthMM=front?g.externalFrontMM:side==='left'?g.externalLeftMM:g.externalRightMM;
  const externalLengthMM=front?g.externalWidthMM:g.externalProjectionMM;
  const raw=front?g.eaves.referenceGeometry.raw:g.eaves[side].geometry.raw;
  const slots=slotsFor(side),bayWidthsMM=slots.slice(1).map((s,j)=>s.leftMM-slots[j].rightMM);
  return {id:front?'facet-front':`facet-${side}-side`,side,manufactureRef:`RB${i+1}`,slots,
   ringBeam:buildRingBeam({id:`edwardian-${side}`,label:`${side} ring-beam`,lengthMM:externalLengthMM,internalLengthMM,externalLengthMM,baseWidthMM,
    startExtensionMM:front?g.externalLeftMM:side==='right'?g.externalFrontMM:0,endExtensionMM:front?g.externalRightMM:side==='left'?g.externalFrontMM:0,
    pitchDeg:front?g.frontPitchDeg:g.pitchDeg,soffitDepthMM:raw.effectiveSoffitMM,plumbCutHeightMM:raw.manufacturedPlumbCutHeightMM,bayWidthsMM,memberSlotWidthMM:slot})};
 });
 if(definitions.some(d=>d.slots.some(s=>s.leftMM<0)||d.slots.slice(1).some((s,i)=>s.leftMM<=d.slots[i].rightMM)))return {valid:false,errors:['Ring-beam member slots overlap or fall outside the internal run.'],ringBeams:[],schedule:null};
 const facets=applyRectangularRingBeamJoints({facets:definitions,widthMM:g.widthMM,projectionMM:g.projectionMM,externalWidthMM:g.externalWidthMM,externalProjectionMM:g.externalProjectionMM,leftAllowanceMM:g.externalLeftMM,rightAllowanceMM:g.externalRightMM});
 const members=facets.map(f=>({id:f.ringBeam.id,side:f.side,manufactureRef:f.manufactureRef,ringBeam:f.ringBeam}));
 const schedule=buildRingBeamManufactureSchedule({members});
 return {valid:schedule.valid,errors:schedule.errors,readOnly:true,ringBeams:facets.map(f=>({...f.ringBeam,side:f.side,manufactureRef:f.manufactureRef,slots:f.slots,
  startOffsetMM:f.slots[0].leftMM,
  upstandRuns:f.slots.slice(1).map((s,i)=>({startMM:f.slots[i].rightMM,endMM:s.leftMM,widthMM:s.leftMM-f.slots[i].rightMM}))})),schedule,notes:[
 'All three beams use the universal ring-beam builder, rectangular corner joint rules and manufacture schedule. No duplicate ring-beam dimension formulas are introduced.',
 '30×95 PSE, 9mm ply bases, 25×50 outer fixing laths, 195mm ply upstands and 185mm PIR faces retain the existing shared dimensions.',
 'Side outer fixing laths run the full external projection. The front outer fixing lath sits between them: external width minus 50mm at each end.',
 'Each material layer has its own corner cut. Unequal base widths can leave a square leg on the wider ply base; they do not change the roof envelope.',
 'Truss and jack slots use the shared 48mm clearance. Front hip seats occupy the existing 48mm boundary slots. Upstand widths are the actual clear distances between slots.',
 'Slot start/end coordinates are authoritative for setting-out. The schedule groups component sizes; its generic packed strip is not an absolute setting-out diagram.',
 'The first rear truss centre remains 31.5mm from the wall. The 7.5mm before its 48mm slot is shown separately, not silently added to an upstand.',
 'Read-only quantities: Summary, pricing, Idiot List and manufacture outputs remain unchanged.'
 ]};
}
