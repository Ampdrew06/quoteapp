// Rectangular stock, viewed face-up with the reusable rib on its left.
// Diagonal cut coordinates are measured from that original left edge.
const EPS=1e-7;
function clip(points,inside,cross) {
 const out=[];
 for(let i=0;i<points.length;i++) {
  const a=points[i],b=points[(i+1)%points.length],ai=inside(a),bi=inside(b);
  if(ai)out.push(a);
  if(ai!==bi)out.push(cross(a,b));
 }
 return out;
}
const area=points=>Math.abs(points.reduce((sum,p,i)=>{
 const q=points[(i+1)%points.length];return sum+p.x*q.y-q.x*p.y;
},0))/2;
export function calculateSquaredSteelTileOffcut({tileLengthMM=1340,tileDepthMM=300,
 ribMM=95,minimumVisibleMM=200,cutBottomMM,cutTopMM}={}) {
 const values=[tileLengthMM,tileDepthMM,ribMM,minimumVisibleMM,cutBottomMM,cutTopMM];
 if(!values.every(Number.isFinite)||tileLengthMM<=0||tileDepthMM<=0||ribMM<0||ribMM>=tileLengthMM||minimumVisibleMM<0)
  return {valid:false,error:'Finite stock dimensions and diagonal cut endpoints are required.'};
 const bound=p=>cutBottomMM+(cutTopMM-cutBottomMM)*p.y/tileDepthMM;
 const distance=p=>p.x-bound(p);
 const stock=[{x:0,y:0},{x:tileLengthMM,y:0},{x:tileLengthMM,y:tileDepthMM},{x:0,y:tileDepthMM}];
 const polygon=clip(stock,p=>distance(p)<=EPS,(a,b)=>{
  const t=distance(a)/(distance(a)-distance(b));return {x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)};
 });
 const squareLengthMM=Math.max(0,Math.min(tileLengthMM,cutBottomMM,cutTopMM));
 const squarePolygon=squareLengthMM>0?[{x:0,y:0},{x:squareLengthMM,y:0},{x:squareLengthMM,y:tileDepthMM},{x:0,y:tileDepthMM}]:[];
 const discardedPolygon=clip(polygon,p=>p.x>=squareLengthMM-EPS,(a,b)=>{
  const t=(squareLengthMM-a.x)/(b.x-a.x);return {x:squareLengthMM,y:a.y+t*(b.y-a.y)};
 });
 const visibleCoverageMM=Math.max(0,squareLengthMM-ribMM);
 return {valid:true,tileLengthMM,tileDepthMM,ribMM,cutBottomMM,cutTopMM,
  longestLengthMM:Math.max(0,Math.min(tileLengthMM,Math.max(cutBottomMM,cutTopMM))),
  squareLengthMM,visibleCoverageMM,ribIntact:squareLengthMM+EPS>=ribMM,
  usable:squareLengthMM+EPS>=ribMM+minimumVisibleMM,
  polygon,squarePolygon,discardedPolygon,offcutAreaMM2:area(polygon),
  discardedAreaMM2:Math.max(0,area(polygon)-squareLengthMM*tileDepthMM)};
}
