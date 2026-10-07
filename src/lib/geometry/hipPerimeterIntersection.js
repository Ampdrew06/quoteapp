// Plan footprint: the internal corner is (0,0), roof interior is positive
// x/y, and the side/front outside faces are x=-side and y=-front.
// A square initial toe must cover the last exit across the timber's width.
// The 45-degree ply seam is internal to the assembled base and is not an
// outside clipping boundary. Packers do not change this footprint.
export function calculateHipPerimeterIntersection({
  widthRunMM, projectionRunMM, sideBaseWidthMM, frontBaseWidthMM,
  timberWidthMM = 45, centreOffsetMM = 0,
} = {}) {
  const values = [widthRunMM, projectionRunMM, sideBaseWidthMM,
    frontBaseWidthMM, timberWidthMM, centreOffsetMM].map(Number);
  if (!values.every(Number.isFinite) || values.slice(0,5).some(v => v <= 0)) {
    return {valid:false, error:'Positive hip runs, base widths and timber width are required.'};
  }
  const [x,y,side,front,width,offset] = values;
  const length = Math.hypot(x,y), ux=x/length, uy=y/length;
  const low=offset-width/2, high=offset+width/2;
  // At transverse position s, the point is (s*uy,-s*ux)-t*(ux,uy).
  // A point leaves the assembled outside perimeter at the first face hit.
  const sample = s => {
    const sideExit=(side+s*uy)/ux, frontExit=(front-s*ux)/uy;
    const t=Math.min(sideExit,frontExit);
    return {offsetMM:s, distanceMM:t, xMM:s*uy-t*ux,
      yMM:-s*ux-t*uy, face:Math.abs(sideExit-frontExit)<1e-8?'corner':sideExit<frontExit?'side':'front'};
  };
  const samples=[sample(low),sample(high)];
  // The minimum of two affine exit distances can peak at their crossing,
  // so test the outside corner as well as both timber edges.
  const cornerOffset=front*ux-side*uy;
  if(cornerOffset>low && cornerOffset<high) samples.push(sample(cornerOffset));
  const distances=samples.map(p=>p.distanceMM);
  const hfc=Math.max(...distances), first=Math.min(...distances);
  if(first<0) return {valid:false,error:'The proposed inner-corner datum puts part of the hip outside the base at its heel.'};
  return {valid:true, horizontalFootCutMM:hfc, firstTrimDistanceMM:first,
    trimLengthRangeMM:hfc-first, centrelineExitMM:sample(offset).distanceMM,
    centreOffsetMM:offset,timberWidthMM:width,acrossWidthDirection:ux,
    projectionDirection:uy,intersectionPoints:samples};
}

// Angles are off square to the member: following its pitch gives a plumb
// end. Above 18 degrees the hook cut departs from plumb. Hold the existing
// internal endpoint fixed; the external endpoint then follows analytically.
export function calculateSparHookEnd({pitchDeg, depthMM=220}={}) {
  const pitch=Number(pitchDeg), depth=Number(depthMM);
  if(!Number.isFinite(pitch)||pitch<0||pitch>=90||!Number.isFinite(depth)||depth<=0) return {valid:false};
  const angle=Math.min(pitch,18), rad=Math.PI/180;
  return {valid:true,topCutOffSquareDeg:angle,topCutLengthMM:depth/Math.cos(angle*rad),
    externalEdgeAdjustmentMM:depth*(Math.tan(angle*rad)-Math.tan(pitch*rad)),
    departsFromPlumb:pitch>18};
}

// A square jack end must clear the hip at its closest corner. All offsets
// here are in horizontal plan, along the jack direction (not slope lengths).
export function calculateJackHipSetback({hipWidthRunMM,hipProjectionRunMM,
 facet='front',hipTimberWidthMM=45,jackTimberWidthMM=45,closestCornerGapMM=5}={}) {
 const nums=[hipWidthRunMM,hipProjectionRunMM,hipTimberWidthMM,jackTimberWidthMM,closestCornerGapMM].map(Number);
 if(!nums.every(Number.isFinite)||nums.slice(0,4).some(v=>v<=0)||nums[4]<0||!['front','side'].includes(facet)) return {valid:false};
 const [x,y,hipWidth,jackWidth,gap]=nums, length=Math.hypot(x,y);
 const normal=facet==='front'?x/length:y/length;
 const transverse=facet==='front'?y/length:x/length;
 const hipFaceSetbackMM=hipWidth/2/normal;
 const squareEndSetbackMM=jackWidth/2*transverse/normal;
 return {valid:true,hipFaceSetbackMM,squareEndSetbackMM,closestCornerGapMM:gap,
  hipCentrelineSetbackMM:hipFaceSetbackMM+squareEndSetbackMM+gap,
  farCornerGapMM:gap+jackWidth*transverse/normal,
  planDirectionWidthMM:x,planDirectionProjectionMM:y};
}
