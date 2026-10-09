import {buildCentralBossTrussAudit} from './centralBossTrussAudit';
const radians=deg=>deg*Math.PI/180;
export function buildGableTrussLayout({externalProjectionMM,rearPackerMM=9,joistWidthMM=45,rearCentreMM=rearPackerMM+joistWidthMM/2,targetSpacingMM=665,secondCentreMM=rearCentreMM+targetSpacingMM,minSpacingMM=400,maxSpacingMM=700}={}) {
 const end=Number(externalProjectionMM)-joistWidthMM/2,start=Number(rearCentreMM);
 if(![end,start,secondCentreMM,targetSpacingMM,minSpacingMM,maxSpacingMM].every(Number.isFinite)||minSpacingMM<=0||maxSpacingMM<minSpacingMM||end<=start)return {valid:false,errors:['Invalid truss layout dimensions.'],centresMM:[],gapsMM:[]};
 const intervals=span=>{
  const minimum=Math.ceil((span-1e-8)/maxSpacingMM),maximum=Math.floor((span+1e-8)/minSpacingMM);
  if(minimum<1||minimum>maximum)return null;
  return Math.max(minimum,Math.min(maximum,Math.round(span/targetSpacingMM)));
 };
 const anchorGap=secondCentreMM-start,anchored=anchorGap>=minSpacingMM&&anchorGap<=maxSpacingMM?intervals(end-secondCentreMM):null;
 const count=anchored??intervals(end-start);
 if(count==null)return {valid:false,errors:['No truss layout can satisfy 400–700mm centres. Admin review is required.'],centresMM:[],gapsMM:[]};
 const origin=anchored?secondCentreMM:start,centresMM=anchored?[start,origin]:[start];
 // Preserve standard centres; redistribute only the smallest necessary tail.
 let standardCount=0;
 if(anchored && targetSpacingMM>=minSpacingMM && targetSpacingMM<=maxSpacingMM) {
  for(let prefix=count-1;prefix>=0;prefix--) {
   const tailGap=(end-origin-prefix*targetSpacingMM)/(count-prefix);
   if(tailGap>=minSpacingMM-1e-8 && tailGap<=maxSpacingMM+1e-8){standardCount=prefix;break;}
  }
 }
 for(let i=1;i<=standardCount;i++)centresMM.push(origin+i*targetSpacingMM);
 const tailOrigin=origin+standardCount*targetSpacingMM,tailCount=count-standardCount;
 for(let i=1;i<=tailCount;i++)centresMM.push(tailOrigin+(end-tailOrigin)*i/tailCount);
 const gapsMM=centresMM.slice(1).map((value,i)=>value-centresMM[i]);
 return {valid:true,errors:[],centresMM,gapsMM,trussCount:centresMM.length,rearCentreMM:start,frontCentreMM:end,secondCentreRetained:!!anchored,minSpacingMM,maxSpacingMM,targetSpacingMM};
}
export function buildGableGeometry({inputs={},materials={}}={}) {
 const widthMM=Number(inputs.widthMM),projectionMM=Number(inputs.projMM),frameMM=Number(inputs.frameThicknessMM??70);
 const leftSoffitMM=Number(inputs.leftSoffitMM??150),rightSoffitMM=Number(inputs.rightSoffitMM??leftSoffitMM),frontOverhangMM=Number(inputs.frontOverhangMM??150);
 const depth=Number(materials.rafter_depth_mm??220),ringHeight=Number(materials.ring_beam_height_mm??40);
 let pitchDeg=Number(inputs.pitchDeg??25);
 const errors=[];
 if(![widthMM,projectionMM,frameMM,leftSoffitMM,rightSoffitMM,frontOverhangMM,depth,ringHeight,pitchDeg].every(Number.isFinite)||widthMM<=0||projectionMM<=0||frameMM<=0||Math.min(leftSoffitMM,rightSoffitMM,frontOverhangMM)<0||pitchDeg<=0||pitchDeg>=90)errors.push('Enter positive roof dimensions and a pitch between 0 and 90 degrees; soffits and overhang may be zero.');
 if(errors.length)return {valid:false,errors};
 const finishDepth=25+3;
 const heightAt=angle=>ringHeight+widthMM/2*Math.tan(radians(angle))+(depth+finishDepth)/Math.cos(radians(angle));
 if(inputs.maxFinishedHeightMM!=null && inputs.maxFinishedHeightMM!=='') {
  const maximum=Number(inputs.maxFinishedHeightMM),target=maximum-5;
  if(!Number.isFinite(maximum)||target<=heightAt(0))return {valid:false,errors:['Maximum finished height is too low for this roof section.']};
  let lo=0,hi=89;
  for(let i=0;i<70;i++){const mid=(lo+hi)/2;if(heightAt(mid)<=target)lo=mid;else hi=mid;}
  pitchDeg=lo;
 }
 const angle=radians(pitchDeg),cos=Math.cos(angle),tan=Math.tan(angle),half=widthMM/2;
 const externalWidthMM=widthMM+2*frameMM+leftSoffitMM+rightSoffitMM,externalProjectionMM=projectionMM+frameMM+frontOverhangMM;
 const frontSoffitClearanceMM=5,manufacturingProjectionMM=externalProjectionMM+frontSoffitClearanceMM;
 const layout=buildGableTrussLayout({externalProjectionMM:manufacturingProjectionMM});
 const feet=[leftSoffitMM,rightSoffitMM].map((soffit,i)=>{const hfcMM=frameMM+soffit;return {side:i?'right':'left',hfcMM,vfcMM:depth/cos-hfcMM*tan,internalSlopeMM:half/cos,externalSlopeMM:(half+hfcMM)/cos};});
 if(feet.some(f=>f.vfcMM<=0))errors.push('Selected side soffit leaves no positive VFC.');
 const truss=buildCentralBossTrussAudit({widthMM,projectionMM,frontPitchDeg:pitchDeg,trussPitchDeg:pitchDeg,memberDepthMM:depth,ringBeamHeightMM:ringHeight,sideHfcMM:feet[0].hfcMM});
 if(!layout.valid)errors.push(...layout.errors);if(!truss.valid)errors.push(...truss.errors);
 return {valid:!errors.length,errors,widthMM,projectionMM,frameMM,pitchDeg,leftSoffitMM,rightSoffitMM,frontOverhangMM,externalWidthMM,externalProjectionMM,manufacturingProjectionMM,frontSoffitClearanceMM,ridgeXMM:half,ridgeLengthMM:manufacturingProjectionMM,
  finishedHeightMM:heightAt(pitchDeg),heightSafetyBufferMM:inputs.maxFinishedHeightMM?5:0,feet,layout,truss,
  ringBeams:[{side:'left',lengthMM:manufacturingProjectionMM},{side:'right',lengthMM:manufacturingProjectionMM}],
  assumptions:['Includes 5mm front soffit clearance—do not add again. Both ring-beams and the front truss use manufacturing projection; customer projection and soffit widths are unchanged.','External dimensions follow the agreed frame + soffit / overhang convention.','Ridge remains centred on the internal width. Each side resolves its own HFC/VFC.','Rear truss has the confirmed rear faceplate/packers; PIR cradles support slabs between trusses.','Finished height uses 220mm joist, 25mm lath and 3mm covering; ridge-cap build-up remains to be confirmed.','This is a geometry preview. Pricing, loading list and manufacture outputs are not yet integrated.']};
}
