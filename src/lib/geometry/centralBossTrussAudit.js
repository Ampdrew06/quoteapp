// Read-only proposed truss. No live roof, Summary or manufacture-book mutation.
const pt = (xMM,yMM) => ({xMM,yMM});
const area = points => Math.abs(points.reduce((sum,p,i)=>{
 const q=points[(i+1)%points.length];return sum+p.xMM*q.yMM-q.xMM*p.yMM;
},0))/2/1e6;
export function buildCentralBossTrussAudit({widthMM=4050,projectionMM=2885,frontPitchDeg=15,
 memberDepthMM=220,flangeWidthMM=45,ringBeamHeightMM=40,sideHfcMM=153,
 chevronArmMM=300,chevronWidthMM=143,gussetWidthMM=595}={}) {
 const values=[widthMM,projectionMM,frontPitchDeg,memberDepthMM,flangeWidthMM,ringBeamHeightMM,sideHfcMM,chevronArmMM,chevronWidthMM,gussetWidthMM].map(Number);
 if(values.some(v=>!Number.isFinite(v)||v<=0)||Number(frontPitchDeg)>=90) return {valid:false,errors:['Positive finite dimensions and a front pitch below 90° are required.']};
 [widthMM,projectionMM,frontPitchDeg,memberDepthMM,flangeWidthMM,ringBeamHeightMM,sideHfcMM,chevronArmMM,chevronWidthMM,gussetWidthMM]=values;
 const half=widthMM/2,front=frontPitchDeg*Math.PI/180;
 const rise=projectionMM*Math.tan(front);
 // Preserve the current horizontal wallplate joint-centre height as the
 // proposed central boss datum. This is an explicit factory-review assumption.
 const bossHeightMM=ringBeamHeightMM+rise+memberDepthMM/2;
 const target= bossHeightMM-ringBeamHeightMM;
 let lo=0,hi=Math.PI/2-1e-8;
 for(let i=0;i<80;i++) {
  const mid=(lo+hi)/2;
  if(half*Math.tan(mid)+memberDepthMM/(2*Math.cos(mid))<target)lo=mid;else hi=mid;
 }
 const pitch=(lo+hi)/2,c=Math.cos(pitch),s=Math.sin(pitch),t=Math.tan(pitch);
 const vfc=memberDepthMM/c-sideHfcMM*t;
 if(vfc<=0) return {valid:false,errors:['Proposed HFC leaves no positive VFC.']};
 const apexBottom=pt(half,ringBeamHeightMM+half*t);
 const apexTop=pt(half,apexBottom.yMM+memberDepthMM/c);
 const boss=pt(half,bossHeightMM);
 const left={side:'left',pitchDeg:pitch*180/Math.PI,hfcMM:sideHfcMM,vfcMM:vfc,
  internalSlopeMM:half/c,externalSlopeMM:(half+sideHfcMM)/c,
  topCutLengthMM:memberDepthMM/c,topCutOffSquareDeg:pitch*180/Math.PI,
  points:[pt(0,ringBeamHeightMM),apexBottom,apexTop,pt(-sideHfcMM,ringBeamHeightMM+vfc),pt(-sideHfcMM,ringBeamHeightMM)]};
 const right={...left,side:'right',points:left.points.map(p=>pt(widthMM-p.xMM,p.yMM))};
 // Constant perpendicular strip width; the two arms are mitred on x=centre.
 const plate=(armMM,width,thicknessMM)=>{
  const top=pt(half,bossHeightMM+width/(2*c));
  const bottom=pt(half,bossHeightMM-width/(2*c));
  const centreArmMM=armMM-width*t/2;
  const centre=pt(half+centreArmMM*c,bossHeightMM-centreArmMM*s);
  const upper=pt(centre.xMM+width*s/2,centre.yMM+width*c/2);
  const lower=pt(centre.xMM-width*s/2,centre.yMM-width*c/2);
  const mirror=p=>pt(widthMM-p.xMM,p.yMM);
  const points=[top,upper,lower,bottom,mirror(lower),mirror(upper)];
  return {quantity:2,thicknessMM,armMM,widthMM:width,points,areaEachM2:area(points),
   blankWidthMM:Math.max(...points.map(p=>p.xMM))-Math.min(...points.map(p=>p.xMM)),
   blankHeightMM:Math.max(...points.map(p=>p.yMM))-Math.min(...points.map(p=>p.yMM))};
 };
 // Factory-confirmed bottom corners meet the underside of both joists.
 // The 45mm-high closure shares that horizontal bottom edge.
 const gussetHalf=gussetWidthMM/2;
 const gussetBottomMM=apexBottom.yMM-gussetHalf*t;
 const gussetPoints=[apexTop,pt(half+gussetHalf,apexTop.yMM-gussetHalf*t),
  pt(half+gussetHalf,gussetBottomMM),pt(half-gussetHalf,gussetBottomMM),
  pt(half-gussetHalf,apexTop.yMM-gussetHalf*t)];
 const gusset={quantity:2,thicknessMM:9,widthMM:gussetWidthMM,points:gussetPoints,
  slopeEdgeMM:gussetHalf/c,sideHeightMM:memberDepthMM/c,
  blankWidthMM:gussetWidthMM,blankHeightMM:apexTop.yMM-gussetBottomMM,
  areaEachM2:area(gussetPoints),bottomDatumConfirmed:true};
 const closureDepthMM=45;
 const insetMM=closureDepthMM/t;
 const shortEdgeMM=gussetWidthMM-2*insetMM;
 if(gussetWidthMM>widthMM || shortEdgeMM<=0) return {valid:false,errors:['The gusset must fit within the internal span and leave a positive closure top edge at 45mm height.']};
 const closurePoints=[pt(half-gussetHalf,gussetBottomMM),pt(half+gussetHalf,gussetBottomMM),
  pt(half+gussetHalf-insetMM,gussetBottomMM+closureDepthMM),
  pt(half-gussetHalf+insetMM,gussetBottomMM+closureDepthMM)];
 return {valid:true,errors:[],readOnly:true,widthMM,projectionMM,frontPitchDeg,memberDepthMM,flangeWidthMM,
  ringBeamHeightMM,designRiseMM:rise,boss,apexTop,apexBottom,sidePitchDeg:left.pitchDeg,
  members:[left,right],chevron:plate(chevronArmMM,chevronWidthMM,18),gusset,
  closure:{sectionMM:[45,45],quantity:1,cutLengthMM:gussetWidthMM,shortEdgeMM,
   endInsetMM:insetMM,endLengthMM:closureDepthMM/s,endAngleToLongEdgeDeg:left.pitchDeg,
   endCutOffSquareDeg:90-left.pitchDeg,points:closurePoints,bottomDatumConfirmed:true,
   status:'Bottom corners and angled ends follow the confirmed joist underside datum'},
  eavesStiffenerQuantity:0,
  assumptions:[
   'Boss centre height retained from the existing horizontal wallplate joint: 40 + projection × tan(front pitch) + 110mm. Confirm this datum against the front boss-rafter connection.',
   'Symmetric central boss at half the internal width; two plumb apex cuts, with no horizontal member and no spar-hook deduction on the truss joint.',
   '153mm side HFC retained for the 100mm requested side-soffit envelope. Chamfered-lath alignment with the front facet is not yet re-solved for this roof arrangement.',
   'Chevron longest outer edge is 300mm, with 143mm perpendicular strip width. Solid 9mm pentagonal gussets and the closure share the confirmed 595mm overall width (editable for future review).',
   'Factory-confirmed: both gusset bottom corners and closure bottom corners meet the lower joist edges. The closure rises 45mm from that flat bottom; its ends follow the joist undersides.',
   '45mm flange width replaces the old 47mm detail. Obsolete eaves stiffeners excluded. No cost or loading quantities are integrated yet.'
  ]};
}
