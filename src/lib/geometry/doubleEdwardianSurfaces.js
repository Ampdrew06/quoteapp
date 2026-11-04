// Four roof planes, clipped to an explicit rectangle. The rear valley is never rotated.
export const polygonAreaM2=points=>Math.abs(points.reduce((n,a,i)=>{const b=points[(i+1)%points.length];return n+a.x*b.y-b.x*a.y;},0))/2e6;
function clip(points,f){const out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],fa=f(a),fb=f(b),insideA=fa<=1e-8,insideB=fb<=1e-8;if(insideA)out.push(a);if(insideA!==insideB){const t=fa/(fa-fb);out.push({x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)});}}return out;}
export function doubleEdwardianSurface(g,{extensionMM=0,rearExtensionMM=0,flatWidthMM=0}={}){
 const w=g.widthMM,p=g.projectionMM,tan=Math.tan(g.pitchDeg*Math.PI/180),cos=Math.cos(g.pitchDeg*Math.PI/180);
 const planes=[{id:'left',z:a=>a.x*tan,axis:'x'},{id:'front',z:a=>(p-a.y)*tan,axis:'y'},{id:'right',z:a=>(w-a.x)*tan,axis:'x'},{id:'rear',z:a=>a.y*tan,axis:'y'}];
 const rectangle=[{x:-extensionMM,y:-rearExtensionMM},{x:w+extensionMM,y:-rearExtensionMM},{x:w+extensionMM,y:p+extensionMM},{x:-extensionMM,y:p+extensionMM}];
 const flatHeight=(Math.min(w,p)-flatWidthMM)/2*tan;
 const facets=planes.map(f=>{let points=rectangle;for(const q of planes)if(q!==f)points=clip(points,a=>f.z(a)-q.z(a));if(flatWidthMM)points=clip(points,a=>f.z(a)-flatHeight);return {...f,points,planAreaM2:polygonAreaM2(points),areaM2:polygonAreaM2(points)/cos};});
 let flat=[];if(flatWidthMM){flat=rectangle;for(const f of planes)flat=clip(flat,a=>flatHeight-f.z(a));}
 return {facets,flat:{points:flat,areaM2:polygonAreaM2(flat)},areaM2:facets.reduce((n,f)=>n+f.areaM2,0)+polygonAreaM2(flat),planAreaM2:(w+2*extensionMM)*(p+extensionMM+rearExtensionMM)/1e6};
}
export function developedDoubleEdwardianFacets(g,surface){
 const cos=Math.cos(g.pitchDeg*Math.PI/180);
 return surface.facets.map(f=>{const distance=a=>f.id==='left'?a.x:f.id==='right'?g.widthMM-a.x:f.id==='rear'?a.y:g.projectionMM-a.y;
 const min=Math.min(...f.points.map(distance)),coords=f.points.map(a=>({xMM:f.axis==='x'?a.y:a.x,yMM:(distance(a)-min)/cos}));
 const heightMM=Math.max(...coords.map(a=>a.yMM)),base=coords.filter(a=>a.yMM<1e-5).map(a=>a.xMM),top=coords.filter(a=>Math.abs(a.yMM-heightMM)<1e-5).map(a=>a.xMM);
 return {id:f.id,label:f.id+' roof facet',pitchDeg:g.pitchDeg,outline:coords,heightMM,baseWidthMM:Math.max(...base)-Math.min(...base),topWidthMM:Math.max(...top)-Math.min(...top),topEdgeType:top.length>1?'ridge':undefined};});
}
export function internalDoubleEdwardianLaths(g,surface){
 const rows=[];
 const span=(points,axis,value)=>{const hits=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],other=axis==='x'?'y':'x';if(Math.abs(a[axis]-b[axis])<1e-7){if(Math.abs(value-a[axis])<1e-7)hits.push(a[other],b[other]);}else if(value>=Math.min(a[axis],b[axis])-1e-7&&value<=Math.max(a[axis],b[axis])+1e-7){const t=(value-a[axis])/(b[axis]-a[axis]);hits.push(a[other]+t*(b[other]-a[other]));}}return hits.length?Math.max(...hits)-Math.min(...hits):0;};
 for(const f of surface.facets){const values=f.points.map(a=>a[f.axis]),lo=Math.min(...values),hi=Math.max(...values),bays=Math.max(1,Math.ceil((hi-lo)/Math.cos(g.pitchDeg*Math.PI/180)/400));for(let i=0;i<=bays;i++){const position=lo+(hi-lo)*i/bays,lengthMM=span(f.points,f.axis,position);if(lengthMM>1e-6)rows.push({id:`${f.id}-${i}`,lengthMM});}}
 const axis=g.widthMM>=g.projectionMM?'y':'x',values=surface.flat.points.map(a=>a[axis]);if(values.length){const lo=Math.min(...values),hi=Math.max(...values);for(let i=1;i<=2;i++){const lengthMM=span(surface.flat.points,axis,lo+(hi-lo)*i/3);if(lengthMM>0)rows.push({id:`flat-${i}`,lengthMM});}}
 return rows;
}
