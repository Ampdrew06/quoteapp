const area=p=>Math.abs(p.reduce((n,a,i)=>{const b=p[(i+1)%p.length];return n+a.x*b.y-b.x*a.y;},0))/2e6;
function clip(points,f){const out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],fa=f(a),fb=f(b),ina=fa<=1e-8,inb=fb<=1e-8;if(ina)out.push(a);if(ina!==inb){const t=fa/(fa-fb);out.push({x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)});}}return out;}
export function buildVictorianSurfaceAreas({geometry:g,eavesExtensionMM=0,flatWidthMM=0}={}){
 const fail=message=>({valid:false,errors:[message]});
 if(!g?.valid)return fail('Valid Victorian plan required.');
 const extension=Number(eavesExtensionMM),flatWidth=Number(flatWidthMM);
 if(![extension,flatWidth].every(Number.isFinite)||extension<0||flatWidth<0||flatWidth>=g.widthMM)return fail('Invalid surface extension or ceiling flat width.');
 const polygon=g.internalOutline,lines=polygon.map((a,i)=>{const b=polygon[(i+1)%polygon.length],dx=b.xMM-a.xMM,dy=b.yMM-a.yMM,l=Math.hypot(dx,dy),nx=-dy/l,ny=dx/l;return {nx,ny,c:nx*a.xMM+ny*a.yMM+(i===polygon.length-1?0:extension)};});
 const domain=lines.map((b,i)=>{const a=lines[(i+lines.length-1)%lines.length],d=a.nx*b.ny-b.nx*a.ny;return {x:(a.c*b.ny-b.c*a.ny)/d,y:(a.nx*b.c-b.nx*a.c)/d};});
 const planes=g.facets.map(f=>{const dx=f.end.xMM-f.start.xMM,dy=f.end.yMM-f.start.yMM,l=f.internalLengthMM,t=Math.tan(f.pitchDeg*Math.PI/180);return {id:f.id,pitchDeg:f.pitchDeg,z:p=>t*(dy*(p.x-f.start.xMM)-dx*(p.y-f.start.yMM))/l};});
 const flatHeightMM=(g.widthMM-flatWidth)/2*Math.tan(g.pitchDeg*Math.PI/180);
 const facets=planes.map(p=>{let points=domain;for(const q of planes)if(q!==p)points=clip(points,v=>p.z(v)-q.z(v));if(flatWidth>0)points=clip(points,v=>p.z(v)-flatHeightMM);const planAreaM2=area(points);return {id:p.id,pitchDeg:p.pitchDeg,points,planAreaM2,areaM2:planAreaM2/Math.cos(p.pitchDeg*Math.PI/180)};});
 let flat=[];if(flatWidth>0){flat=domain;for(const p of planes)flat=clip(flat,v=>flatHeightMM-p.z(v));}
 const flatArea=area(flat),planAreaM2=area(domain),partitionPlanAreaM2=facets.reduce((n,f)=>n+f.planAreaM2,0)+flatArea;
 if(Math.abs(partitionPlanAreaM2-planAreaM2)>1e-6)return fail('Victorian surface partition does not close.');
 return {valid:true,errors:[],domain,facets,flat:{widthMM:flatWidth,heightMM:flatHeightMM,points:flat,areaM2:flatArea},planAreaM2,partitionPlanAreaM2,areaM2:facets.reduce((n,f)=>n+f.areaM2,0)+flatArea};
}
// Extend a member's plan trajectory from its internal heel to the offset eaves.
export function victorianFrameExtension(g,member,offsetMM){
 const dx=member.end.xMM-member.start.xMM,dy=member.end.yMM-member.start.yMM,l=Math.hypot(dx,dy),ux=dx/l,uy=dy/l;
 const hits=g.facets.map(f=>{const nx=-(f.end.yMM-f.start.yMM)/f.internalLengthMM,ny=(f.end.xMM-f.start.xMM)/f.internalLengthMM,advance=nx*ux+ny*uy;return advance>1e-9?(offsetMM-nx*(member.end.xMM-f.start.xMM)-ny*(member.end.yMM-f.start.yMM))/advance:Infinity;});
 return Math.min(...hits);
}
