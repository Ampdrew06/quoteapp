// Covering allowance, not a hip timber cut length. Unlike soffit widths can
// put the external corner off the continued internal hip centre line.
// Develop boss-to-corner travel on both adjoining faces and retain the longer
// allowance. This must never shorten the existing centre-line requirement.
export function fullCornerHipCoveringAllowance({hip,facets,internalOutline,externalOutline,centreLineLengthMM}) {
 const same=(a,b)=>Math.hypot(a.xMM-b.xMM,a.yMM-b.yMM)<1e-5;
 const index=internalOutline.findIndex(p=>same(p,hip.end));
 const corner=externalOutline[index];
 const adjacent=facets.filter(f=>same(f.start,hip.end)||same(f.end,hip.end));
 if(!corner||adjacent.length!==2)return null;
 const dx=corner.xMM-hip.start.xMM,dy=corner.yMM-hip.start.yMM;
 const faceAllowances=adjacent.map(f=>{
  const length=Math.hypot(f.end.xMM-f.start.xMM,f.end.yMM-f.start.yMM);
  const ux=(f.end.xMM-f.start.xMM)/length,uy=(f.end.yMM-f.start.yMM)/length;
  const cosine=Math.cos(f.pitchDeg*Math.PI/180);
  return {facetId:f.id,lengthMM:Math.hypot(dx*ux+dy*uy,(dx*uy-dy*ux)/cosine)};
 });
 const lengthMM=Math.max(centreLineLengthMM,...faceAllowances.map(f=>f.lengthMM));
 if(!Number.isFinite(lengthMM)||lengthMM<=0)return null;
 return {lengthMM,centreLineLengthMM,externalCorner:{...corner},faceAllowances,method:'fullCornerAllowance'};
}
