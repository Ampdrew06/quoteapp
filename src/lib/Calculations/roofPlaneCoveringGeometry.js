import {widthAtFacetPosition} from './facetTilingCalc';
const area=p=>Math.abs(p.reduce((n,a,i)=>{const b=p[(i+1)%p.length];return n+a.xMM*b.yMM-b.xMM*a.yMM;},0))/2;
function clip(points,f){const out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],fa=f(a),fb=f(b),ina=fa<=1e-7,inb=fb<=1e-7;if(ina)out.push(a);if(ina!==inb){const t=fa/(fa-fb);out.push({xMM:a.xMM+t*(b.xMM-a.xMM),yMM:a.yMM+t*(b.yMM-a.yMM)});}}return out;}

// Develop the actual polygon on each roof plane. Offsets describe the outer
// boundary only; planes continue from their original internal frame datums.
export function buildRoofPlaneCoveringGeometry({internalOutline,facets,offsetsMM}={}){
 const fail=message=>({valid:false,errors:[message],facets:[],internal:[]});
 if(!Array.isArray(internalOutline)||internalOutline.length<3||!Array.isArray(facets)||!facets.length||offsetsMM?.length!==internalOutline.length)return fail('A closed roof outline, facets and an offset for each boundary are required.');
 if(internalOutline.some(p=>![p.xMM,p.yMM].every(Number.isFinite))||offsetsMM.some(n=>!Number.isFinite(n)||n<0)||facets.some(f=>!Number.isFinite(f.pitchDeg)||f.pitchDeg<=0||f.pitchDeg>=90||!(f.internalLengthMM>0)))return fail('Valid roof points, pitches and non-negative boundary offsets are required.');
 const planes=facets.map(f=>{const ux=(f.end.xMM-f.start.xMM)/f.internalLengthMM,uy=(f.end.yMM-f.start.yMM)/f.internalLengthMM,t=Math.tan(f.pitchDeg*Math.PI/180);return {...f,ux,uy,z:p=>t*(uy*(p.xMM-f.start.xMM)-ux*(p.yMM-f.start.yMM))};});
 const lines=internalOutline.map((a,i)=>{const b=internalOutline[(i+1)%internalOutline.length],L=Math.hypot(b.xMM-a.xMM,b.yMM-a.yMM),nx=-(b.yMM-a.yMM)/L,ny=(b.xMM-a.xMM)/L;return {nx,ny,c:nx*a.xMM+ny*a.yMM+offsetsMM[i]};});
 const domain=lines.map((b,i)=>{const a=lines[(i+lines.length-1)%lines.length],d=a.nx*b.ny-b.nx*a.ny;return {xMM:(a.c*b.ny-b.c*a.ny)/d,yMM:(a.nx*b.c-b.nx*a.c)/d};});
 if(domain.some(p=>![p.xMM,p.yMM].every(Number.isFinite)))return fail('The outside roof boundary could not be offset.');
 const develop=(f,domain)=>{let points=domain;for(const q of planes)if(q!==f)points=clip(points,p=>f.z(p)-q.z(p));
  const raw=points.map(p=>({xMM:(p.xMM-f.start.xMM)*f.ux+(p.yMM-f.start.yMM)*f.uy,yMM:((p.xMM-f.start.xMM)*f.uy-(p.yMM-f.start.yMM)*f.ux)/Math.cos(f.pitchDeg*Math.PI/180)}));
  const lo=Math.min(...raw.map(p=>p.yMM)),hi=Math.max(...raw.map(p=>p.yMM)),minX=Math.min(...raw.map(p=>p.xMM)),outline=raw.map(p=>({xMM:p.xMM-minX,yMM:p.yMM-lo})),facet={id:f.id,label:f.label,pitchDeg:Number(f.pitchDeg.toFixed(8)),heightMM:hi-lo,outline,topEdgeType:'wall',points,areaM2:area(raw)/1e6};
  return {...facet,baseWidthMM:widthAtFacetPosition(facet,0),topWidthMM:widthAtFacetPosition(facet,hi-lo)};
 };
 const developed=planes.map(f=>develop(f,domain)),internal=planes.map(f=>develop(f,internalOutline));
 if(developed.some(f=>!Number.isFinite(f.areaM2)||f.heightMM<=0||f.baseWidthMM<=0))return fail('The external roof surfaces could not be developed.');
 if(Math.abs(developed.reduce((n,f)=>n+area(f.points),0)-area(domain))>1)return fail('The external facet areas do not close to the roof outline.');
 return {valid:true,errors:[],domain,lines,facets:developed,internal,roofAreaM2:developed.reduce((n,f)=>n+f.areaM2,0)};
}
