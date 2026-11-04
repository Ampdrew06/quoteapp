import {buildRoofPlaneLathRows} from './roofPlaneLathRows';
import {buildRoofPlaneCoveringGeometry} from './roofPlaneCoveringGeometry';
import {calculateRoofTiling} from './facetTilingCalc';
import {getTileProduct} from './tileProductConfig';
import {orderSteelHipRidgeRuns} from './steelHipRidgeOrder';
import {fullCornerHipCoveringAllowance} from './fullCornerHipCoveringAllowance';
// Each facet is the lowest roof plane inside the eaves domain. This preserves
// non-trapezoidal strips where unlike soffits or survey angles meet.
export function buildVictorianHippedCoveringAudit({geometry:g,productId='britmetShingle',materials:m={},maximumInternalSpacingMM=400,surfaceOffset='tiling'}={}){
 const fail=errors=>({valid:false,errors,facets:[],internalRows:[],edges:[]});
 const product=getTileProduct(productId),spacing=Number(maximumInternalSpacingMM);
 if(!['tiling','frame'].includes(surfaceOffset))return fail(['Choose tiling or frame surface offsets.']);
 if(!g?.valid||!product||!Number.isFinite(spacing)||spacing<=0)return fail(['Valid roof geometry, tile product and positive internal lath spacing are required.']);
 const offsetsMM=g.internalOutline.map((a,i)=>{const b=g.internalOutline[(i+1)%g.internalOutline.length],f=g.facets.find(f=>Math.hypot(f.start.xMM-a.xMM,f.start.yMM-a.yMM)<1e-6&&Math.hypot(f.end.xMM-b.xMM,f.end.yMM-b.yMM)<1e-6);return f?(surfaceOffset==='frame'?g.frameMM:f.plyBaseWidthMM+50):0;});
 const surface=buildRoofPlaneCoveringGeometry({internalOutline:g.internalOutline,facets:g.facets,offsetsMM});
 if(!surface.valid)return fail(surface.errors);
 const {facets,internal,domain,lines}=surface;
 const result=calculateRoofTiling({facets,product:productId});if(result.errors.length)return fail(result.errors);
 const internalLaths=buildRoofPlaneLathRows({facets:internal,maximumSpacingMM:spacing});
 if(!internalLaths.valid)return fail(internalLaths.errors);
 const internalRows=internalLaths.rows;
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
