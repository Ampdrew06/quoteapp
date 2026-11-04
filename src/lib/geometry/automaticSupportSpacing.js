// Shared automatic set-out. Fixed datums and manual layouts belong to callers.
export function automaticSupportCentres({startMM=0,endMM,firstCentreMM=startMM+665,spacingMM=665,clearanceMM=48}){
 const start=Number(startMM),end=Number(endMM),first=Number(firstCentreMM),step=Number(spacingMM);
 if(![start,end,first,step].every(Number.isFinite)||end<=start||step<=0)return [];
 const centres=[start];
 let next=first;
 while(next<end-clearanceMM){centres.push(next);next+=step;}
 const last=centres[centres.length-1],remaining=end-last;
 if(remaining>step+1e-7)centres.push(last+remaining/2);
 centres.push(end);
 return centres;
}
// Retain existing fixed/symmetric set-out, filling only oversized bays.
export function splitOversizedSupportBays(centres,spacingMM=665){
 const sorted=[...new Set(centres)].sort((a,b)=>a-b),result=[];
 sorted.forEach((p,i)=>{if(i){const a=sorted[i-1],gap=p-a;if(gap>spacingMM+1e-7){const bays=2**Math.ceil(Math.log2(gap/spacingMM));for(let n=1;n<bays;n++)result.push(a+gap*n/bays);}}result.push(p);});
 return result;
}
