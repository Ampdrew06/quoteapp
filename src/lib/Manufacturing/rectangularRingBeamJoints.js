// Horizontal plan cuts for the confirmed hipped Lean-To corner assembly.
// Roof envelope and member slots stay unchanged; each layer owns its joint.
const n = v => Math.max(0, Number(v) || 0);
const area = points => Math.abs(points.reduce((sum,p,i) => {
  const next=points[(i+1)%points.length];return sum+p.xMM*next.yMM-next.xMM*p.yMM;
},0))/2/1e6;
function profile(inner, width, startCap, endCap) {
  const s=Math.min(width,n(startCap)),e=Math.min(width,n(endCap));
  const points=[{xMM:0,yMM:0},{xMM:inner,yMM:0},
    {xMM:inner+e,yMM:e},{xMM:inner+e,yMM:width},
    {xMM:-s,yMM:width},{xMM:-s,yMM:s}]
    .filter((p,i,a)=>i===0||p.xMM!==a[i-1].xMM||p.yMM!==a[i-1].yMM);
  return {widthMM:width,internalEdgeLengthMM:inner,externalEdgeLengthMM:inner+s+e,
    startInnerExtensionMM:0,endInnerExtensionMM:0,startOuterExtensionMM:s,endOuterExtensionMM:e,
    startSquareLegMM:s>0?width-s:width,endSquareLegMM:e>0?width-e:width,
    startMitreDeg:s>0?45:0,endMitreDeg:e>0?45:0,outline:points,areaM2:area(points)};
}
const square = (length,width) => profile(length,width,0,0);
export function applyRectangularRingBeamJoints({facets=[],widthMM,projectionMM,
  externalWidthMM,externalProjectionMM,leftAllowanceMM,rightAllowanceMM}={}) {
  const W=n(widthMM),P=n(projectionMM),F=n(externalProjectionMM)-P;
  if(!W||!P||F<=0)return facets;
  const left=facets.find(f=>f.id==='facet-left-side'&&f.ringBeam?.exists);
  const right=facets.find(f=>f.id==='facet-right-side'&&f.ringBeam?.exists);
  const A={left:n(leftAllowanceMM),right:n(rightAllowanceMM)};
  return facets.map(facet=>{
    const beam=facet.ringBeam;if(!beam?.exists)return facet;
    const front=facet.id==='facet-front';
    const side=facet.id==='facet-left-side'?'left':'right';
    const width=front?F:A[side];
    if(width<=0)return facet;
    const lathWidth=50,pseWidth=95;
    let ply,pse,lath;
    if(front){
      // Front ply reaches the outside side-ply edges; only the lath sits between side laths.
      const start=left?A.left:0;
      const end=right?A.right:0;
      const openStart=left?0:A.left,openEnd=right?0:A.right;
      ply=profile(W+openStart+openEnd,width,start,end);
      pse=profile(W+openStart+openEnd,pseWidth,left?pseWidth:0,right?pseWidth:0);
      lath=square(n(externalWidthMM)-(left?lathWidth:0)-(right?lathWidth:0),lathWidth);
    }else{
      const start=side==='right';
      ply=profile(P,width,start?F:0,start?0:F);
      pse=profile(P,pseWidth,start?pseWidth:0,start?0:pseWidth);
      lath=square(n(externalProjectionMM),lathWidth);
    }
    const materials={...beam.materials,ply9BaseAreaM2:ply.areaM2,
      ply9TotalAreaM2:ply.areaM2+n(beam.materials?.ply9UpstandAreaM2),
      pse30x90LengthM:pse.externalEdgeLengthMM/1000,
      outerFixingLath25x50LengthM:lath.externalEdgeLengthMM/1000};
    return {...facet,ringBeam:{...beam,baseWidthMM:width,
      jointRule:'rectangular-independent-layers',
      layerProfiles:{ply9Base:ply,pse30x90:pse,outerLath25x50:lath},materials}};
  });
}
