import {buildAutomaticRoofTiling} from './automaticRoofTiling';
import {buildSteelTileCourseAudit} from './steelTileCourseAudit';

// Design ordering adapter. The shared/manual Home calculator remains untouched.
// Retain the original area calculation for Technical comparison and lath data.
export function integrateSteelTileOrdering(automatic) {
 if(automatic?.roofStyle!=='hippedLeanTo' || !['britmetShingle','metrotileShingle'].includes(automatic.productId))return automatic;
 const audit=buildSteelTileCourseAudit({automaticRoofTiling:automatic,minimumStarterMM:200});
 if(!audit.valid || !audit.staggerComplete) {
  return {...automatic,tileOrderIntegration:{applied:false,errors:audit.errors?.length?audit.errors:
   audit.facets.flatMap(f=>f.stagger.errors)}};
 }
 const used=audit.staggerTiles,spares=audit.allowanceTiles;
 return {...automatic,areaEstimateResult:automatic.result,
  tileOrderIntegration:{applied:true,method:'steelStaggeredCourses',minimumPhysicalStarterMM:295,
   minimumVisibleStarterMM:200,tilesUsed:used,spares,ordered:used+spares,
   facets:audit.facets.map(f=>({id:f.id,tilesUsed:f.stagger.newTiles,sequence:f.stagger.sequence})),
   errors:[]},
  result:{...automatic.result,tileQuantityRaw:used,tileQuantityRounded:used,
   tileQuantityOrdered:used+spares,orderingMethod:'steelStaggeredCourses'}};
}
export function buildIntegratedAutomaticRoofTiling(args={}) {
 return integrateSteelTileOrdering(buildAutomaticRoofTiling(args));
}
