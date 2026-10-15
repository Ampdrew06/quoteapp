// Full-length ripping allowance only. No facet mitre/end cuts or numbering.
export function buildVictorianSoffitSupply(geometry,materials={}) {
  const fail=message=>({valid:false,errors:[message]});
  if(!geometry?.valid)return fail('Valid Victorian geometry required.');
  const stockLengthMM=Number(materials.soffit_stock_length_m??5)*1000;
  const stripWidthMM=Number(geometry.soffitStripWidthMM),kerfMM=Number(materials.soffit_rip_kerf_mm??3);
  const widths=(materials.soffit_board_widths_mm??[100,150,175,200]).map(Number).filter(n=>Number.isFinite(n)&&n>0).sort((a,b)=>a-b);
  if(!(stockLengthMM>0)||!Number.isFinite(stripWidthMM)||stripWidthMM<0||!Number.isFinite(kerfMM)||kerfMM<0)return fail('Valid stock length, strip width and saw kerf are required.');
  const totalRunMM=geometry.facets.reduce((n,f)=>n+f.externalLengthMM,0);
  if(stripWidthMM===0)return {valid:true,totalRunMM,stripWidthMM,stockLengthMM,kerfMM,stripCount:0,order:[],ripInstructions:[]};
  const stripCount=Math.ceil((totalRunMM-1e-6)/stockLengthMM);
  // Minimise purchased stock area for this uniform strip width. Keep stock
  // wider than the requested standard board out of standard-board supply.
  const options=widths.filter(w=>geometry.soffitMode!=='standard'||w>=stripWidthMM).map(widthMM=>({widthMM,capacity:Math.floor((widthMM+kerfMM)/(stripWidthMM+kerfMM))})).filter(o=>o.capacity>0);
  if(!options.length)return fail('No configured soffit board can supply this strip width.');
  const best=Array(stripCount+1).fill(null);best[0]={area:0,boards:[]};
  for(let n=1;n<=stripCount;n++)for(const o of options){const before=best[Math.max(0,n-o.capacity)],candidate={area:before.area+o.widthMM,boards:[...before.boards,o]};if(!best[n]||candidate.area<best[n].area||(candidate.area===best[n].area&&candidate.boards.length<best[n].boards.length))best[n]=candidate;}
  let remaining=stripCount;
  const boards=best[stripCount].boards.map(o=>{const strips=Math.min(remaining,o.capacity);remaining-=strips;return {...o,strips};});
  const order=[...new Set(boards.map(b=>b.widthMM))].sort((a,b)=>a-b).map(widthMM=>({widthMM,qty:boards.filter(b=>b.widthMM===widthMM).length}));
  return {valid:true,totalRunMM,stripWidthMM,stockLengthMM,kerfMM,stripCount,order,ripInstructions:boards.map(b=>({boardWidthMM:b.widthMM,strips:b.strips,stripWidthMM,lengthMM:stockLengthMM}))};
}
