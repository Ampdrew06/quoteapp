export const PIR_MEMBER_WIDTH_MM = 45;
// Shared insulation policy. Net installed material and ordering waste are
// deliberately separate; neither sheet rounding nor waste adds roof weight.
export function pirBoardAllowance({areaM2,sheetWidthM=1.2,sheetLengthM=2.4,wastePercent=5}) {
 const [area,w,h,pct]=[areaM2,sheetWidthM,sheetLengthM,wastePercent].map(Number);
 if(![area,w,h,pct].every(Number.isFinite)||area<0||w<=0||h<=0||pct<0)return null;
 const sheetArea=w*h,orderArea=area*(1+pct/100);
 return {area,sheetArea,wastePct:pct,orderArea,sheets:Math.max(0,Math.ceil(orderArea/sheetArea-1e-9))};
}
export function pir50InstalledWeight({cradleAreaM2,ringAreaM2,kgPerM2,cradleMultiplier=1}) {
 const values=[cradleAreaM2,ringAreaM2,kgPerM2,cradleMultiplier];
 if(values.some(v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0))return null;
 return (Number(cradleAreaM2)*Number(cradleMultiplier)+Number(ringAreaM2))*Number(kgPerM2);
}
const area=points=>Math.abs(points.reduce((n,p,i)=>{const q=points[(i+1)%points.length];return n+p.xMM*q.yMM-q.xMM*p.yMM;},0))/2;
function clip(points,f){const out=[];for(let i=0;i<points.length;i++){
 const a=points[i],b=points[(i+1)%points.length],fa=f(a),fb=f(b),ina=fa<=1e-7,inb=fb<=1e-7;
 if(ina)out.push(a);if(ina!==inb){const t=fa/(fa-fb);out.push({xMM:a.xMM+t*(b.xMM-a.xMM),yMM:a.yMM+t*(b.yMM-a.yMM)});}
 }return out;}
// Offset active eaves to the outside frame. House-wall edges stay in place.
// Plane intersections partition the polygon without adding soffit area.
export function frameLineRoofArea({outline,facets,frameMM}) {
 const same=(a,b)=>Math.hypot(a.xMM-b.xMM,a.yMM-b.yMM)<1e-6;
 if(!outline?.length||!facets?.length||!Number.isFinite(frameMM)||frameMM<0)return null;
 const planes=facets.map(f=>{const L=Math.hypot(f.end.xMM-f.start.xMM,f.end.yMM-f.start.yMM),ux=(f.end.xMM-f.start.xMM)/L,uy=(f.end.yMM-f.start.yMM)/L,t=Math.tan(f.pitchDeg*Math.PI/180);return {...f,z:p=>t*(uy*(p.xMM-f.start.xMM)-ux*(p.yMM-f.start.yMM))};});
 const lines=outline.map((p,i)=>{const q=outline[(i+1)%outline.length],L=Math.hypot(q.xMM-p.xMM,q.yMM-p.yMM),nx=-(q.yMM-p.yMM)/L,ny=(q.xMM-p.xMM)/L,active=facets.some(f=>same(f.start,p)&&same(f.end,q));return {nx,ny,c:nx*p.xMM+ny*p.yMM+(active?frameMM:0)};});
 const domain=lines.map((b,i)=>{const a=lines[(i+lines.length-1)%lines.length],d=a.nx*b.ny-b.nx*a.ny;return {xMM:(a.c*b.ny-b.c*a.ny)/d,yMM:(a.nx*b.c-b.nx*a.c)/d};});
 let partition=0,total=0;
 for(const f of planes){let points=domain;for(const q of planes)if(q!==f)points=clip(points,p=>f.z(p)-q.z(p));const plan=area(points);partition+=plan;total+=plan/Math.cos(f.pitchDeg*Math.PI/180)/1e6;}
 return Number.isFinite(total)&&Math.abs(partition-area(domain))<1?{areaM2:total,domain}:null;
}
