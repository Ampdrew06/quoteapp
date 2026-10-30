import {calculateRoofTiling,widthAtFacetPosition} from './facetTilingCalc';
import {getTileProduct} from './tileProductConfig';
import {orderSteelHipRidgeRuns} from './steelHipRidgeOrder';
import {fullCornerHipCoveringAllowance} from './fullCornerHipCoveringAllowance';
const area=p=>Math.abs(p.reduce((n,a,i)=>{const b=p[(i+1)%p.length];return n+a.xMM*b.yMM-b.xMM*a.yMM;},0))/2;
function clip(points,f){const out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],fa=f(a),fb=f(b),ina=fa<=1e-7,inb=fb<=1e-7;if(ina)out.push(a);if(ina!==inb){const t=fa/(fa-fb);out.push({xMM:a.xMM+t*(b.xMM-a.xMM),yMM:a.yMM+t*(b.yMM-a.yMM)});}}return out;}
// Each facet is the lowest roof plane inside the eaves domain. This preserves
// non-trapezoidal strips where unlike soffits or survey angles meet.
export function buildVictorianHippedCoveringAudit({geometry:g,productId='britmetShingle',materials:m={},maximumInternalSpacingMM=400,surfaceOffset='tiling'}={}){
 const fail=errors=>({valid:false,errors,facets:[],internalRows:[],edges:[]});
 const product=getTileProduct(productId),spacing=Number(maximumInternalSpacingMM);
 if(!['tiling','frame'].includes(surfaceOffset))return fail(['Choose tiling or frame surface offsets.']);
 if(!g?.valid||!product||!Number.isFinite(spacing)||spacing<=0)return fail(['Valid roof geometry, tile product and positive internal lath spacing are required.']);
 const planes=g.facets.map(f=>{const ux=(f.end.xMM-f.start.xMM)/f.internalLengthMM,uy=(f.end.yMM-f.start.yMM)/f.internalLengthMM,t=Math.tan(f.pitchDeg*Math.PI/180);return {...f,ux,uy,z:p=>t*(uy*(p.xMM-f.start.xMM)-ux*(p.yMM-f.start.yMM))};});
 const lines=g.internalOutline.map((a,i)=>{const b=g.internalOutline[(i+1)%g.internalOutline.length],L=Math.hypot(b.xMM-a.xMM,b.yMM-a.yMM),nx=-(b.yMM-a.yMM)/L,ny=(b.xMM-a.xMM)/L,f=planes.find(f=>Math.hypot(f.start.xMM-a.xMM,f.start.yMM-a.yMM)<1e-6&&Math.hypot(f.end.xMM-b.xMM,f.end.yMM-b.yMM)<1e-6);return {nx,ny,c:nx*a.xMM+ny*a.yMM+(f?(surfaceOffset==='frame'?g.frameMM:f.plyBaseWidthMM+50):0)};});
 const domain=lines.map((b,i)=>{const a=lines[(i+lines.length-1)%lines.length],d=a.nx*b.ny-b.nx*a.ny;return {xMM:(a.c*b.ny-b.c*a.ny)/d,yMM:(a.nx*b.c-b.nx*a.c)/d};});
 const develop=(f,domain)=>{let points=domain;for(const q of planes)if(q!==f)points=clip(points,p=>f.z(p)-q.z(p));
  const raw=points.map(p=>({xMM:(p.xMM-f.start.xMM)*f.ux+(p.yMM-f.start.yMM)*f.uy,yMM:((p.xMM-f.start.xMM)*f.uy-(p.yMM-f.start.yMM)*f.ux)/Math.cos(f.pitchDeg*Math.PI/180)}));
  const lo=Math.min(...raw.map(p=>p.yMM)),hi=Math.max(...raw.map(p=>p.yMM)),minX=Math.min(...raw.map(p=>p.xMM)),outline=raw.map(p=>({xMM:p.xMM-minX,yMM:p.yMM-lo})),facet={id:f.id,label:f.label,pitchDeg:Number(f.pitchDeg.toFixed(8)),heightMM:hi-lo,outline,topEdgeType:'wall',points,areaM2:area(raw)/1e6};
  return {...facet,baseWidthMM:widthAtFacetPosition(facet,0),topWidthMM:widthAtFacetPosition(facet,hi-lo)};
 };
 const facets=planes.map(f=>develop(f,domain)),internal=planes.map(f=>develop(f,g.internalOutline));
 if(facets.some(f=>!Number.isFinite(f.areaM2)||f.heightMM<=0||f.baseWidthMM<=0))return fail(['The external roof surfaces could not be developed.']);
 const partition=facets.reduce((n,f)=>n+area(f.points),0);if(Math.abs(partition-area(domain))>1)return fail(['The external facet areas do not close to the roof outline.']);
 const result=calculateRoofTiling({facets,product:productId});if(result.errors.length)return fail(result.errors);
 const internalRows=[];internal.forEach(f=>{const intervals=Math.max(1,Math.ceil(f.heightMM/spacing));for(let i=0;i<=intervals;i++){const positionMM=f.heightMM*i/intervals,lengthMM=widthAtFacetPosition(f,positionMM);if(lengthMM>1e-6)internalRows.push({facetId:f.id,positionMM,lengthMM,spacingMM:f.heightMM/intervals});}});
 // Retain the complete centre-line run, then include the full outside corner
 // on both adjoining faces. This is a covering allowance, not a timber cut.
 const edges=g.hips.map(h=>{const dx=h.end.xMM-h.start.xMM,dy=h.end.yMM-h.start.yMM;
  const t=Math.min(...lines.map(l=>{const advance=l.nx*dx+l.ny*dy;return advance>1e-8?(l.c-l.nx*h.start.xMM-l.ny*h.start.yMM)/advance:Infinity;}));
  const allowance=fullCornerHipCoveringAllowance({hip:h,facets:g.facets,internalOutline:g.internalOutline,externalOutline:domain,centreLineLengthMM:Math.hypot(dx,dy,g.riseMM)*t});
  return allowance?{id:h.id,kind:'hip',...allowance}:null;
 });
 if(edges.some(e=>!e))return fail(['The full outside corner could not be resolved for a hip covering allowance.']);
 const steel=product.family==='steelShingle',prefix={britmetShingle:'britmet',metrotileShingle:'metrotile',liteSlate:'liteslate',tapcoSlate:'tapco'}[productId],density=Number(m[`${prefix}_ridge_units_per_m`]??(productId==='liteSlate'?5.5:NaN));
 const allocations=steel?orderSteelHipRidgeRuns(edges):edges.map(e=>({...e,tileQty:Number.isFinite(density)&&density>0?Math.ceil(e.lengthMM/1000*density):null}));
 const fieldRows=result.facets.flatMap(f=>f.lathRows.map(r=>({...r,facetId:f.facet.id}))),fieldM=fieldRows.filter(r=>r.kind!=='chamferedPerimeter').reduce((n,r)=>n+r.widthMM/1000,0),chamferM=fieldRows.filter(r=>r.kind==='chamferedPerimeter').reduce((n,r)=>n+r.widthMM/1000,0),hipSupportM=steel?edges.reduce((n,e)=>n+2*e.lengthMM/1000,0):0;
 return {valid:true,errors:[],productId,steel,facets,internal,domain,result,edges:allocations,fieldRows,internalRows,fieldM,chamferM,hipSupportM,internalM:internalRows.reduce((n,r)=>n+r.lengthMM/1000,0),hipTiles:allocations.some(e=>e.tileQty===null)?null:allocations.reduce((n,e)=>n+e.tileQty,0),roofAreaM2:facets.reduce((n,f)=>n+f.areaM2,0),notes:['External tiling perimeter uses each facet’s calculated ply-base projection plus the established 50mm tile-starter extension. House walls are not extended. Geometry accepted provisionally for integration; revisit with measured build data.','Main steel tiles use shared Home calculator courses, roof-wide rounding and two extra tiles. Polygon courses integrate actual widths across corner changes. Slate uses the shared pitch bands and doubled first course.','Internal laths follow the internal roof slopes at no more than 400mm, including boundary rows; this wallplate roof has no invented ridge flat. Factory fixing positions still require review.','Full-corner hip covering allowances retain the longer developed boss-to-outside-corner distance from the adjoining faces, and never shorten the centre-line run. These are supply allowances, not timber cutting dimensions.','Steel hip supports use two runs per full external hip allowance; slate uses none. There is no horizontal ridge on this roof.','Hip allocations use compatible half pieces for calculation only; whole tiles are ordered. Tile pricing and end caps are handled in Tile Elements. Hip tops are finished with lead flashing, with no terminating cap/adaptor. Hip tape is charged once in Miscellaneous.']};
}
