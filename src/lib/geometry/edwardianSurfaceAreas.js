const area=points=>Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.x*q.y-q.x*p.y;},0))/2e6;
// Clip a convex polygon by a linear half-plane; keep f(point) <= 0.
function clip(points,f){const out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],fa=f(a),fb=f(b),ina=fa<=1e-8,inb=fb<=1e-8;if(ina)out.push(a);if(ina!==inb){const t=fa/(fa-fb);out.push({x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)});}}return out;}
export function buildEdwardianSurfaceAreas({geometry:g,leftExtensionMM=0,rightExtensionMM=0,frontExtensionMM=0,flatWidthMM=0}={}){
 if(!g?.valid)return {valid:false,errors:['Valid Edwardian geometry is required.']};
 const ext=[leftExtensionMM,rightExtensionMM,frontExtensionMM,flatWidthMM].map(Number);
 if(!ext.every(Number.isFinite)||ext.some(v=>v<0)||flatWidthMM>=g.widthMM)return {valid:false,errors:['Invalid surface extensions or flat width.']};
 const ts=Math.tan(g.pitchDeg*Math.PI/180),tf=Math.tan(g.frontPitchDeg*Math.PI/180);
 const planes=[{id:'left',pitchDeg:g.pitchDeg,z:p=>ts*p.x},{id:'right',pitchDeg:g.pitchDeg,z:p=>ts*(g.widthMM-p.x)},{id:'front',pitchDeg:g.frontPitchDeg,z:p=>tf*(g.projectionMM-p.y)}];
 const rectangle=[{x:-leftExtensionMM,y:0},{x:g.widthMM+rightExtensionMM,y:0},{x:g.widthMM+rightExtensionMM,y:g.projectionMM+frontExtensionMM},{x:-leftExtensionMM,y:g.projectionMM+frontExtensionMM}];
 const flatHeightMM=(g.widthMM-flatWidthMM)/2*ts;
 const facets=planes.map(p=>{let points=rectangle;for(const q of planes)if(q!==p)points=clip(points,v=>p.z(v)-q.z(v));if(flatWidthMM>0)points=clip(points,v=>p.z(v)-flatHeightMM);const planAreaM2=area(points);return {id:p.id,pitchDeg:p.pitchDeg,points,planAreaM2,areaM2:planAreaM2/Math.cos(p.pitchDeg*Math.PI/180)};});
 let flat=[];if(flatWidthMM>0){flat=rectangle;for(const p of planes)flat=clip(flat,v=>flatHeightMM-p.z(v));}
 const flatAreaM2=area(flat),planAreaM2=(g.widthMM+leftExtensionMM+rightExtensionMM)*(g.projectionMM+frontExtensionMM)/1e6;
 return {valid:true,errors:[],facets,flat:{widthMM:flatWidthMM,heightMM:flatHeightMM,points:flat,areaM2:flatAreaM2},planAreaM2,partitionPlanAreaM2:facets.reduce((n,f)=>n+f.planAreaM2,0)+flatAreaM2,areaM2:facets.reduce((n,f)=>n+f.areaM2,0)+flatAreaM2};
}
