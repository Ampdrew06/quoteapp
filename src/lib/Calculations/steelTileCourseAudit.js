import {calculateSquaredSteelTileOffcut} from './squaredSteelTileOffcut';
import { auditRightToLeftTileStagger } from './steelTileStaggerAudit';
import { getTileProduct } from './tileProductConfig';

// Course-layout calculation and Technical comparison; not a manufacture cutting schedule.
// Track rectangular cover lengths right-to-left and carry the final remainder
// into the next course on the SAME facet. Actual angled cuts/ribs must still
// be checked before these stock lengths can be treated as usable pieces.
export function buildSteelTileCourseAudit({automaticRoofTiling, tileOverhangMM=50, minimumStarterMM=200}={}) {
 const result=automaticRoofTiling?.result;
 const product=getTileProduct(automaticRoofTiling?.productId);
 const fail=message=>({valid:false,readOnly:true,errors:[message],facets:[],rows:[]});
 if(product?.strategy!=='steelShingleCourses')return fail('Course carry-over audit applies to steel shingles only.');
 if(!result || result.errors?.length || !result.facets?.length)return fail('Valid automatic tiling facets are required.');
 const cover=Number(product.effectiveCoverWidthMM);
 const allowance=Number(result.orderAllowanceTiles);
 if(!(cover>0) || !Number.isFinite(allowance) || allowance<0)return fail('Valid tile cover and order allowance are required.');
 const facets=[];
 for(const facetResult of result.facets) {
  if(facetResult.facet?.openings?.length)return fail('Openings need their own cutting layout; carry-over is not estimated for this roof.');
  const courses=facetResult.courses;
  if(!courses?.length)return fail('Steel courses are missing.');
  let carry=0,opened=0,requiredTotal=0,independentTotal=0;
  const rows=[];
  for(const course of courses) {
   const start=Number(course.startWidthMM),end=Number(course.endWidthMM);
   const y0=Number(course.startYMM),y1=Number(course.endYMM);
   if(![start,end,y0,y1].every(Number.isFinite) || start<0 || end<0 || y0<0 || y1<=y0 || !(Math.max(start,end)>0))return fail('Course widths and positions must be valid.');
   const required=Math.max(start,end); // Full-width rectangular envelope.
   const carriedIn=carry;
   const deficit=Math.max(0,required-carriedIn);
   const fresh=Math.ceil(Math.max(0,deficit-1e-7)/cover);
   carry=Math.max(0,carriedIn+fresh*cover-required);
   opened+=fresh;requiredTotal+=required;
   const independent=Math.ceil(Math.max(0,required-1e-7)/cover);
   independentTotal+=independent;
   rows.push({index:course.index,startYMM:y0,endYMM:y1,startWidthMM:start,endWidthMM:end,
    averageWidthMM:Number(course.widthMM),requiredWidthMM:required,carriedInMM:carriedIn,
    newTiles:fresh,carriedOutMM:carry,independentTiles:independent,
    shortenedCourse:y1-y0<Number(product.subsequentGaugeMM)});
  }
  const base=Number(facetResult.facet.baseWidthMM);
  const id=facetResult.facet.id;
  // Viewed from outside: left-side triangle has its wall edge on the left;
  // right-side triangle has its wall edge on the right; front is centred.
  const staggerCourses=rows.map(row=>({...row,rightEdgeMM:
   id==='facet-left-side' ? row.startWidthMM :
   id==='facet-front' ? (base+row.startWidthMM)/2 : base}));
  const stagger=auditRightToLeftTileStagger({courses:staggerCourses,coverWidthMM:cover,minimumStarterMM:minimumStarterMM ?? 200,allowFreshStarter:true});
  // Britmet's measured 300mm depth is distinct from the 255mm gauge.
  // These diagrams project the existing nominal tile positions onto a full
  // depth cut. They do not replace the stagger/ordering engine.
  const depth=product.id==='britmetShingle'?300:null;
  const facetHeight=Number(facetResult.facet.heightMM);
  const topWidth=Number(facetResult.facet.topWidthMM);
  const leftAt=y=>{
   const w=base+(topWidth-base)*y/facetHeight;
   return id==='facet-left-side'?0:id==='facet-front'?(base-w)/2:base-w;
  };
  const physicalOffcuts=depth?stagger.rows.map(row=>{
   const nominalLeft=row.rightEdgeMM-row.requiredWidthMM;
   const stockLeft=nominalLeft-row.carriedOutMM-95;
   const freshCount=row.newTiles-(row.source==='starter cut from new tile'?1:0);
   const stockLength=freshCount>0?1340:row.carriedInMM+95;
   const piece=calculateSquaredSteelTileOffcut({tileLengthMM:stockLength,tileDepthMM:depth,
    minimumVisibleMM:minimumStarterMM ?? 200,cutBottomMM:leftAt(row.startYMM)-stockLeft,
    cutTopMM:leftAt(row.startYMM+depth)-stockLeft});
   return {index:row.index,...piece,nominalRemainderMM:row.carriedOutMM,
    topCourse:row.startYMM+depth>facetHeight,
    coverageDifferenceMM:piece.valid?piece.visibleCoverageMM-row.carriedOutMM:null};
  }):[];
  facets.push({id:facetResult.facet.id,label:facetResult.facet.label,rows,
   stagger,physicalOffcuts,currentRawTiles:facetResult.tileQuantityRaw,rectangularCoverMM:requiredTotal,
   newTiles:opened,finalRemainderMM:carry,independentTiles:independentTotal});
 }
 const newTiles=facets.reduce((sum,f)=>sum+f.newTiles,0);
 const independentTiles=facets.reduce((sum,f)=>sum+f.independentTiles,0);
 const staggerComplete=facets.every(f=>f.stagger.complete);
 const staggerTiles=staggerComplete?facets.reduce((sum,f)=>sum+f.stagger.newTiles,0):null;
 const geometry=automaticRoofTiling.geometry;
 const endpointChecks=['left','right'].flatMap(side=>{
  const joint=geometry?.wallplateAssembly?.[side];
  const facet=geometry?.facets?.find(f=>f.id===`facet-${side}-side`);
  if(!joint?.valid || !facet)return [];
  const pitch=Number(joint.pitchDeg)*Math.PI/180;
  const externalSlope=Number(joint.externalSlopeMM);
  const extension=Number(tileOverhangMM)/Math.cos(pitch);
  const currentHeight=Number(facet.geometry?.tiling?.heightMM);
  if(![pitch,externalSlope,extension,currentHeight].every(Number.isFinite))return [];
  return [{side,topJointPositionMM:joint.A.xMM,bossCentrePositionMM:joint.B.xMM,
   wallbarExternalSlopeMM:externalSlope,tileExtensionSlopeMM:extension,
   wallbarPlusExtensionMM:externalSlope+extension,currentTilingHeightMM:currentHeight,
   differenceMM:currentHeight-externalSlope-extension}];
 });
 return {valid:true,readOnly:true,errors:[],coverWidthMM:cover,allowanceTiles:allowance,
  currentRawTiles:result.tileQuantityRaw,currentRoundedTiles:result.tileQuantityRounded,
  currentOrderedTiles:result.tileQuantityOrdered,rectangularCarryTiles:newTiles,
  rectangularCarryOrder:newTiles+allowance,independentCourseTiles:independentTiles,
  independentCourseOrder:independentTiles+allowance,facets,endpointChecks,
  minimumStarterMM,starterMinimumConfigured:minimumStarterMM!==null,
  staggerComplete,staggerTiles,staggerOrder:staggerComplete?staggerTiles+allowance:null,
  rows:facets.flatMap(f=>f.rows.map(r=>({...r,facetId:f.id,facetLabel:f.label}))),
  limitations:[
   'Right-to-left on every facet. A usable remainder starts the next row. If none is available or nominal joints would align, try the row above and use its remainder for the skipped row. If reuse and the row-above alternative cannot supply a usable starter, cut a nominal staggered starter from a new tile and count the whole tile. Its remaining trim is not credited as reusable. Any unresolved cases have no stagger comparison total.',
   'Nominal stagger checks compare joint positions from a shared facet datum. Left/right triangular facets are viewed from outside and the front trapezoid is centred. No minimum joint separation is assumed; angled cuts, actual ribs and practical tolerances still require validation.',
   'Britmet squared-offcut diagrams use the measured 300mm full depth and the existing nominal stock positions. The shortest diagonal edge is the retained square length; the longer triangular projection is discarded. Already-reserved full-width envelopes must not have this triangle deducted twice. Full-depth rib orientation, first-course placement and top-course cut sequence still require validation.',
   'The factory minimum is 200mm nominal coverage plus an intact 95mm rib (295mm physical length). The length test cannot establish whether an angled offcut retains that rib. The carry-over columns use full-width rectangular envelopes with no kerf. Rib position, joint overlap, angled-end trimming and shortened-course reuse are not modelled. This is not a validated cut list.',
   'The current calculation uses average course widths and rounds once across the roof. It does not track individual pieces.',
   'Endpoint comparison uses the wallbar top joint A and its upper edge plus the configured gutter extension. Chamfered-lath and covering-surface offsets are not included in that reference, so it is not a replacement facet height.',
   'This diagnostic audit does not itself change Summary quantities. The separate design-ordering adapter selects the accepted sequence; the Home calculator retains its existing calculation.'
  ]};
}
