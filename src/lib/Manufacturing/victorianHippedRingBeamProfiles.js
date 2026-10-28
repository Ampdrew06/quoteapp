import {buildVictorianHippedJointLayers} from './victorianHippedJointProfiles';
import {buildVictorianRingBeamProfiles} from './victorianRingBeamProfiles';
import {RING_BEAM_MEMBER_SLOT_WIDTH_MM} from './ringBeamBuilder';

const area=points=>Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.xMM*q.yMM-q.xMM*p.yMM;},0))/2/1e6;

export function buildVictorianHippedRingBeamProfiles({geometry:g,inputs={}}={}) {
 const fail=errors=>({valid:false,errors,beams:[]});
 if(!g?.valid||!g.rafterLayout?.valid)return fail(g?.errors?.length?g.errors:['Valid Victorian Hipped geometry and rafter positions are required.']);
 const arrangement=inputs.upstandArrangement??(g.soffitMode==='specified'&&g.soffitMM===50?'vertical':'pitched');
 if(!['pitched','vertical'].includes(arrangement))return fail(['Choose pitched or vertical upstands.']);
 const height=arrangement==='vertical'?210:195,slotWidth=RING_BEAM_MEMBER_SLOT_WIDTH_MM;
 // Reuse established 135-degree layer profiles, with only wall/hip seats.
 // Hipped Lean-To members supply the actual remaining slots below.
 const base=buildVictorianRingBeamProfiles({...g,layout:{centresMM:[24]},intermediateBars:[],jackRafters:[],upstandHeightMM:height});
 if(!base.valid)return base;
 const jointMethod=inputs.ringbeamJointMethod??'standard';
 if(!['standard','calculated'].includes(jointMethod))return fail(['Choose a valid ringbeam joint method.']);
 const matchedLayers=(beam,i)=>buildVictorianHippedJointLayers({geometry:g,facet:g.facets[i],index:i,baseLayers:beam.layers,method:jointMethod});
 const errors=[];
 let beams;
 try{beams=base.beams.map((beam,i)=>{
  const f=g.facets[i],length=f.internalLengthMM;
  const seatAt=(point,fallback)=>g.hips.find(h=>Math.hypot(h.end.xMM-point.xMM,h.end.yMM-point.yMM)<1e-6)?.id||fallback;
  const startRef=seatAt(f.start,f.start.yMM===0?'Wall':g.leftEndType==='wall'?'WL':'Wall');
  const endRef=seatAt(f.end,f.end.yMM===0?'Wall':g.rightEndType==='wall'?'WR':'Wall');
  const slots=[
   {left:0,right:slotWidth,widthMM:slotWidth,centreMM:24,reference:startRef,kind:startRef.startsWith('H')?'hip-seat':'wall-seat'},
   {left:length-slotWidth,right:length,widthMM:slotWidth,centreMM:length-24,reference:endRef,kind:endRef.startsWith('H')?'hip-seat':'wall-seat'},
  ];
  const edge={x:(f.end.xMM-f.start.xMM)/length,y:(f.end.yMM-f.start.yMM)/length};
  for(const r of g.rafterLayout.members.filter(r=>r.facetId===f.id)){
   const axis={x:(r.start.xMM-r.end.xMM)/r.planLengthMM,y:(r.start.yMM-r.end.yMM)/r.planLengthMM};
   const normalFraction=Math.min(1,Math.abs(axis.x*edge.y-axis.y*edge.x));
   if(!(normalFraction>1e-7)){errors.push(`${beam.reference}: ${r.reference} has no usable crossing angle at the ringbeam.`);continue;}
   // Project the existing perpendicular slot allowance along the beam.
   const widthMM=slotWidth/normalFraction,centreMM=r.perimeterPositionMM;
   slots.push({left:centreMM-widthMM/2,right:centreMM+widthMM/2,widthMM,centreMM,reference:r.reference,kind:r.role,nominalWidthMM:slotWidth,skewDeg:Math.acos(normalFraction)*180/Math.PI});
  }
  slots.sort((a,b)=>a.left-b.left);
  if(slots.some((s,n)=>![s.left,s.right].every(Number.isFinite)||s.left< -1e-7||s.right>length+1e-7||(n>0&&s.left<slots[n-1].right-1e-7)))errors.push(`${beam.reference}: member slots overlap or cross an end seat. Move the affected rafter.`);
  const upstands=[];
  for(let n=1;n<slots.length;n++){
   const widthMM=slots[n].left-slots[n-1].right;
   if(widthMM>1e-7)upstands.push({bay:upstands.length+1,widthMM,heightMM:height,thicknessMM:9,startMM:slots[n-1].right,endMM:slots[n].left});
  }
  slots.forEach(slot=>{const id=slot.reference==='Wall'?(f.start.yMM===0&&slot.left===0?'WB1':f.end.yMM===0&&slot.right===length?'WB2':'Wall'):slot.reference;slot.reference=g.manufactureNumbering?.byId[id]||slot.reference;});
  return {...beam,reference:g.manufactureNumbering?.byId[`ring:${f.id}`]||beam.reference,layers:matchedLayers(beam,i),facetId:f.id,facetPitchDeg:f.pitchDeg,internalLengthMM:length,slots,upstands,upstandArrangement:arrangement,upstandHeightMM:height};
 });}catch(error){return fail([error.message]);}
 if(errors.length)return fail(errors);
 const totalWidthM=beams.flatMap(b=>b.upstands).reduce((sum,u)=>sum+u.widthMM/1000,0);
 return {valid:true,errors:[],beams,jointMethod,upstandArrangement:arrangement,upstandHeightMM:height,nominalSlotWidthMM:slotWidth,
  totals:{ringBeams:beams.length,upstands:beams.reduce((sum,b)=>sum+b.upstands.length,0),pseLengthM:beams.reduce((sum,b)=>sum+Math.max(b.layers.pse30x90.blankLengthMM??0,b.layers.pse30x90.internalEdgeLengthMM,b.layers.pse30x90.externalEdgeLengthMM)/1000,0),plyBaseAreaM2:beams.reduce((sum,b)=>sum+area(b.layers.ply9Base.outline),0),upstandAreaM2:totalWidthM*height/1000,outerLathLengthM:beams.reduce((sum,b)=>sum+Math.max(b.layers.outerLath25x50.blankLengthMM??0,b.layers.outerLath25x50.internalEdgeLengthMM,b.layers.outerLath25x50.externalEdgeLengthMM)/1000,0),finishingLathLengthM:totalWidthM,pir50FaceAreaM2:totalWidthM*.185}};
}
