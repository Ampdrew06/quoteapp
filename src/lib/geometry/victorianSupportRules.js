import {automaticSupportCentres} from './automaticSupportSpacing';
// Existing manual-edit allowance; automatic layouts use shared 665mm set-out.
export const VICTORIAN_MAX_SPACING_MM=850;
// Five-facet roofs cannot fit extra boss rafters. Off-centre positions ensure
// each front support meets a hip rather than the ridge/boss. Prefer a 665mm
// first bay when a single jack is enough; otherwise use an odd number of bays
// so no support sits on the facet centreline.
export function fiveFacetJackPositions(lengthMM){
 const points=automaticSupportCentres({endMM:lengthMM,clearanceMM:72}).slice(1,-1);
 // The five-facet system needs jack-to-hip connections, not a central
 // boss rafter. Replace an exact midpoint with two off-centre jacks.
 const mid=lengthMM/2,index=points.findIndex(p=>Math.abs(p-mid)<1e-7);
 if(index>=0){const left=points[index-1]??0,right=points[index+1]??lengthMM;points.splice(index,1,(left+mid)/2,(mid+right)/2);}
 return points;
}
