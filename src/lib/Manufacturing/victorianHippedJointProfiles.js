const EPS=1e-7;
const rad=d=>d*Math.PI/180;
// Clip a local layer polygon to the unchanged outer ply perimeter.
function clip(points,g,world){
 let result=points;
 for(let i=0;i<g.externalOutline.length;i++){
  const a=g.externalOutline[i],b=g.externalOutline[(i+1)%g.externalOutline.length],nx=-(b.yMM-a.yMM),ny=b.xMM-a.xMM;
  const value=p=>{const q=world(p);return nx*(q.xMM-a.xMM)+ny*(q.yMM-a.yMM);};
  const next=[];
  result.forEach((p,k)=>{const q=result[(k+1)%result.length],vp=value(p),vq=value(q),inside=vp<=EPS,nextInside=vq<=EPS;
   if(inside)next.push(p);
   if(inside!==nextInside){const t=vp/(vp-vq);next.push({xMM:p.xMM+t*(q.xMM-p.xMM),yMM:p.yMM+t*(q.yMM-p.yMM)});}
  });
  result=next.filter((p,k,all)=>!k||Math.hypot(p.xMM-all[k-1].xMM,p.yMM-all[k-1].yMM)>EPS);
  if(result.length>1&&Math.hypot(result[0].xMM-result[result.length-1].xMM,result[0].yMM-result[result.length-1].yMM)<EPS)result.pop();
 }
 return result;
}
export function buildVictorianHippedJointLayers({geometry:g,facet:f,index,baseLayers,method}){
 const L=f.internalLengthMM,width=f.plyBaseWidthMM??g.plyBaseWidthMM,u={x:(f.end.xMM-f.start.xMM)/L,y:(f.end.yMM-f.start.yMM)/L},n={x:-u.y,y:u.x};
 const world=p=>({xMM:f.start.xMM+u.x*p.xMM+n.x*p.yMM,yMM:f.start.yMM+u.y*p.xMM+n.y*p.yMM});
 const e=f.edgeIndex??index,a=g.externalOutline[e],b=g.externalOutline[e+1];
 const primaryStart=baseLayers.pse30x90.startMitreDeg,primaryEnd=baseLayers.pse30x90.endMitreDeg;
 const start=method==='calculated'?((f.start.xMM-a.xMM)*u.x+(f.start.yMM-a.yMM)*u.y)/width:Math.tan(rad(primaryStart));
 const end=method==='calculated'?((b.xMM-f.end.xMM)*u.x+(b.yMM-f.end.yMM)*u.y)/width:Math.tan(rad(primaryEnd));
 const layer=(offset,depth)=>{
  let points=[{xMM:-offset*start,yMM:offset},{xMM:L+offset*end,yMM:offset},{xMM:L+(offset+depth)*end,yMM:offset+depth},{xMM:-(offset+depth)*start,yMM:offset+depth}];
  if(method==='standard')points=clip(points,g,world);
  const inner=points.filter(p=>Math.abs(p.yMM-offset)<EPS),outer=points.filter(p=>Math.abs(p.yMM-offset-depth)<EPS);
  if(points.length<3||inner.length<2||outer.length<2)throw new Error(`${f.id}: the selected ringbeam joint leaves no usable layer.`);
  const innerMin=Math.min(...inner.map(p=>p.xMM)),innerMax=Math.max(...inner.map(p=>p.xMM)),outerMin=Math.min(...outer.map(p=>p.xMM)),outerMax=Math.max(...outer.map(p=>p.xMM));
  const trims=[];
  for(let i=0;i<points.length;i++){
   const p=points[i],q=points[(i+1)%points.length],dx=q.xMM-p.xMM,dy=q.yMM-p.yMM;
   if(Math.abs(dy)<EPS)continue;
   const side=(p.xMM+q.xMM)/2<L/2?'start':'end',slope=dx/dy,nominal=side==='start'?-start:end;
   if(Math.abs(slope-nominal)>1e-6)trims.push({end:side,offSquareDeg:Math.atan(Math.abs(slope))*180/Math.PI,lengthMM:Math.hypot(dx,dy),depthMM:Math.abs(dy),from:{xMM:p.xMM-innerMin,yMM:p.yMM-offset},to:{xMM:q.xMM-innerMin,yMM:q.yMM-offset}});
  }
  const angle=(side,slope)=>{const edges=points.map((p,i)=>[p,points[(i+1)%points.length]]).filter(([p,q])=>Math.abs(p.yMM-q.yMM)>EPS&&((p.xMM+q.xMM)/2<L/2)===(side==='start'));
   return edges.length===1?Math.atan(Math.abs((edges[0][1].xMM-edges[0][0].xMM)/(edges[0][1].yMM-edges[0][0].yMM)))*180/Math.PI:Math.atan(slope)*180/Math.PI;};
  return {blankLengthMM:Math.max(...points.map(p=>p.xMM))-Math.min(...points.map(p=>p.xMM)),widthMM:depth,internalEdgeLengthMM:innerMax-innerMin,externalEdgeLengthMM:outerMax-outerMin,startInnerExtensionMM:-innerMin,endInnerExtensionMM:innerMax-L,startOuterExtensionMM:-outerMin,endOuterExtensionMM:outerMax-L,startMitreDeg:angle('start',start),endMitreDeg:angle('end',end),primaryStartMitreDeg:Math.atan(start)*180/Math.PI,primaryEndMitreDeg:Math.atan(end)*180/Math.PI,startSquareLegMM:0,endSquareLegMM:0,jointMethod:method,trims,outline:points.map(p=>({xMM:p.xMM-innerMin,yMM:p.yMM-offset}))};
 };
 return {pse30x90:layer(0,95),ply9Base:layer(0,width),outerLath25x50:layer(width-50,50)};
}
