import {widthAtFacetPosition} from './facetTilingCalc';

// Include boundary rows; distribute the intermediate rows evenly so no
// sloping gap exceeds the specified maximum. Zero-width apex rows add no lath.
export function buildRoofPlaneLathRows({facets=[],maximumSpacingMM=400}={}){
 const spacing=Number(maximumSpacingMM);
 if(!Number.isFinite(spacing)||spacing<=0)return {valid:false,errors:['Positive internal lath spacing is required.'],rows:[],totalM:0};
 const rows=[];
 for(const f of facets){
  if(!(Number.isFinite(f.heightMM)&&f.heightMM>0))return {valid:false,errors:['Valid developed ceiling facets are required.'],rows:[],totalM:0};
  const intervals=Math.max(1,Math.ceil(f.heightMM/spacing));
  for(let n=0;n<=intervals;n++){
   const positionMM=f.heightMM*n/intervals,lengthMM=widthAtFacetPosition(f,positionMM);
   if(lengthMM>1e-6)rows.push({facetId:f.id,positionMM,lengthMM,spacingMM:f.heightMM/intervals});
  }
 }
 return {valid:true,errors:[],rows,totalM:rows.reduce((n,r)=>n+r.lengthMM/1000,0),maximumSpacingMM:spacing};
}
