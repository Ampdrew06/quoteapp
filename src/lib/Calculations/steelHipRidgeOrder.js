// Quotation allowance, not a cutting schedule. Only whole stock is supplied.
export function steelHipRidgeAllocation(lengthMM) {
 const length=Math.max(0,Number(lengthMM)||0);
 // Half pieces get nominal cover only. Tolerance is credited to full pieces.
 let halves=Math.max(0,Math.ceil(length/1230*2-1e-9));
 while(halves>0){const candidate=halves-1;
  if(candidate*615+Math.floor(candidate/2)*30+1e-7<length)break;
  halves=candidate;
 }
 return halves/2;
}
export function orderSteelHipRidgeRuns(edges=[]) {
 let pendingHalf=false;
 return edges.map(edge=>{
  const allocation=steelHipRidgeAllocation(edge.lengthMM);
  let tileQty=Math.floor(allocation);
  if(allocation%1){if(!pendingHalf)tileQty++;pendingHalf=!pendingHalf;}
  // A paired half is costed to the first run; allocation records its use on both.
  return {...edge,allocationTiles:allocation,tileQty};
 });
}
