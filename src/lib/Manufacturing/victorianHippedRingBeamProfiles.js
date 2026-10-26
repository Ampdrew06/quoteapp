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
 // Variable-width ply joints follow the actual offset-line intersection.
 const matchedLayers=(beam,i)=>{
  const f=g.facets[i],L=f.internalLengthMM,width=f.plyBaseWidthMM??g.plyBaseWidthMM;
  const u={x:(f.end.xMM-f.start.xMM)/L,y:(f.end.yMM-f.start.yMM)/L};
  const a=g.externalOutline[i],b=g.externalOutline[i+1];
  const start=((f.start.xMM-a.xMM)*u.x+(f.start.yMM-a.yMM)*u.y)/width;
  const end=((b.xMM-f.end.xMM)*u.x+(b.yMM-f.end.yMM)*u.y)/width;
  const layer=(offset,depth)=>{
   const si=offset*start,ei=offset*end,so=(offset+depth)*start,eo=(offset+depth)*end;
   return {widthMM:depth,internalEdgeLengthMM:L+si+ei,externalEdgeLengthMM:L+so+eo,startInnerExtensionMM:si,endInnerExtensionMM:ei,startOuterExtensionMM:so,endOuterExtensionMM:eo,startMitreDeg:Math.atan(start)*180/Math.PI,endMitreDeg:Math.atan(end)*180/Math.PI,startSquareLegMM:Math.abs(start)<1e-9?depth:0,endSquareLegMM:Math.abs(end)<1e-9?depth:0,outline:[{xMM:0,yMM:0},{xMM:L+si+ei,yMM:0},{xMM:L+eo+si,yMM:depth},{xMM:si-so,yMM:depth}]};
  };
  return {...beam.layers,ply9Base:layer(0,width),outerLath25x50:layer(width-50,50)};
 };
 const errors=[];
 const beams=base.beams.map((beam,i)=>{
  const f=g.facets[i],length=f.internalLengthMM;
  const slots=[
   {left:0,right:slotWidth,widthMM:slotWidth,centreMM:24,reference:i===0?'Wall':`H${i}`,kind:i===0?'wall-seat':'hip-seat'},
   {left:length-slotWidth,right:length,widthMM:slotWidth,centreMM:length-24,reference:i===4?'Wall':`H${i+1}`,kind:i===4?'wall-seat':'hip-seat'},
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
  return {...beam,layers:matchedLayers(beam,i),facetId:f.id,facetPitchDeg:f.pitchDeg,internalLengthMM:length,slots,upstands,upstandArrangement:arrangement,upstandHeightMM:height};
 });
 if(errors.length)return fail(errors);
 const totalWidthM=beams.flatMap(b=>b.upstands).reduce((sum,u)=>sum+u.widthMM/1000,0);
 return {valid:true,errors:[],beams,upstandArrangement:arrangement,upstandHeightMM:height,nominalSlotWidthMM:slotWidth,
  totals:{ringBeams:beams.length,upstands:beams.reduce((sum,b)=>sum+b.upstands.length,0),pseLengthM:beams.reduce((sum,b)=>sum+Math.max(b.layers.pse30x90.internalEdgeLengthMM,b.layers.pse30x90.externalEdgeLengthMM)/1000,0),plyBaseAreaM2:beams.reduce((sum,b)=>sum+area(b.layers.ply9Base.outline),0),upstandAreaM2:totalWidthM*height/1000,outerLathLengthM:beams.reduce((sum,b)=>sum+Math.max(b.layers.outerLath25x50.internalEdgeLengthMM,b.layers.outerLath25x50.externalEdgeLengthMM)/1000,0),finishingLathLengthM:totalWidthM,pir50FaceAreaM2:totalWidthM*.185}};
}
