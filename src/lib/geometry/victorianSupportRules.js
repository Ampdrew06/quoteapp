// Provisional workshop rule: Victorian layouts allow up to 850mm unsupported.
// Other styles retain their own existing limits and 665mm normal centres.
export const VICTORIAN_MAX_SPACING_MM=850;
// Five-facet roofs cannot fit extra boss rafters. Off-centre positions ensure
// each front support meets a hip rather than the ridge/boss. Prefer a 665mm
// first bay when a single jack is enough; otherwise use an odd number of bays
// so no support sits on the facet centreline.
export function fiveFacetJackPositions(lengthMM){
 const max=VICTORIAN_MAX_SPACING_MM;
 if(lengthMM<=max+1e-7)return [];
 if(lengthMM-665<=max+1e-7&&Math.abs(lengthMM/2-665)>1e-7)return [665];
 let bays=Math.ceil((lengthMM-1e-7)/max);
 if(bays%2===0)bays++;
 return Array.from({length:bays-1},(_,n)=>lengthMM*(n+1)/bays);
}
