import {buildAutomaticRoofTiling} from './automaticRoofTiling';
import {buildSteelTileCourseAudit} from './steelTileCourseAudit';

// Design ordering adapter. The shared/manual Home calculator remains untouched.
// Retain the original area calculation for Technical comparison and lath data.
export function integrateSteelTileOrdering(automatic) {
 if(!automatic?.result || automatic.errors?.length || automatic.result.errors?.length)return automatic;
 if(automatic?.roofStyle!=='hippedLeanTo' || !['britmetShingle','metrotileShingle'].includes(automatic.productId))return automatic;
 const audit=buildSteelTileCourseAudit({automaticRoofTiling:automatic,minimumStarterMM:200});
 return {...automatic,areaEstimateResult:automatic.result,
  tileOrderIntegration:{applied:true,method:'roofWideEstimate',
   ordered:automatic.result.tileQuantityOrdered,errors:[],courseComparison:audit.staggerOrder},
  result:{...automatic.result,orderingMethod:'roofWideEstimate'}};
}
export function buildIntegratedAutomaticRoofTiling(args={}) {
 return integrateSteelTileOrdering(buildAutomaticRoofTiling(args));
}
