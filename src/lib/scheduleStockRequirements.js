// Monthly demand from saved purchasing lines, independent of order status.
const stockItems=[
 ['joists','Joist lengths','lengths',/\bjoists?\b(?!\s+hangers?\b)|\btruss members\b/i],
 ['quilt12','SuperQuilt — 12 m²','rolls'],
 ['quilt15','SuperQuilt — 15 m²','rolls'],
 ['pir100','100 mm PIR','sheets',/\b100\s*mm\s+PIR\b|\bPIR\s+100\s*mm\b/i],
 ['membrane','Breather membrane','rolls',/\bbreather membrane\b/i],
 ['foamTape','Expanding foam tape','rolls',/\b(?:expanding |hip )?foam tape\b/i],
 ['starter','Tile starter','lengths',/\btile starters?\b/i],
 ['sparHooks','Spar hooks','each',/\bspar[- ]hooks?\b/i],
 ['joistHangers','Joist hangers','each',/\bjoist hangers?\b/i],
 ['jackBrackets','Jack rafter brackets','each',/\bjack[- ]rafter brackets?\b/i],
 ['jackHooks','Jack rafter hooks','each',/\bjack[- ]rafter hooks?\b/i],
];
function unitsMatch(value,unit){
 const units=String(value??'').trim().toLowerCase();
 if(/^(each|ea\.?|pcs?|pieces?|units?)$/.test(units))return true;
 return unit==='lengths'?/\blengths?$/.test(units):unit==='rolls'?/\brolls?$/.test(units):unit==='sheets'?/\b(?:sheets?|boards?)$/.test(units):false;
}
function quiltSize(item){
 const words=[item.description,item.specification,item.unit].join(' ');
 const sizes=[...new Set(Array.from(words.matchAll(/\b(12|15)\s*m(?:²|\^?2)?(?![\w²])/gi),m=>Number(m[1])))];
 return sizes.length===1?sizes[0]:null;
}
export function monthlyStockRequirements(rows){
 const totals=Object.fromEntries(stockItems.map(([id])=>[id,0]));
 const pending={...totals};
 const review=[];
 let missingChecklists=0;
 for(const row of rows){
  const {data}=row;
  if(!data||data.archived||data.status==='Cancelled')continue;
  const checklist=data.purchaseChecklist;
  if(!checklist?.items?.length&&!checklist?.reviewed)missingChecklists++;
  for(const item of checklist?.items||[]){
   const label=String(item.description||'');
   const quilt=/\bsuper\s*quilt\b/i.test(label);
   const size=quilt?quiltSize(item):null;
   const stock=quilt?stockItems.find(([id])=>id==='quilt'+size):stockItems.find(([, , ,pattern])=>pattern?.test(label));
   if(!quilt&&!stock)continue;
   const qty=Number(item.qty);
   if(!Number.isFinite(qty)||qty<=0)continue;
   if(!stock||!unitsMatch(item.unit,stock[2])){
    review.push({job:data.jobNumber,customer:data.customerName,description:label,qty,unit:item.unit,reason:stock?`Enter quantity in ${stock[2]}.`:'Specify 12 m² or 15 m² per roll.'});
    continue;
   }
   totals[stock[0]]+=qty;
   if(item.status!=='ordered'&&item.status!=='stock')pending[stock[0]]+=qty;
  }
 }
 return {totals:stockItems.map(([id,label,unit])=>({id,label,unit,qty:totals[id],yetToOrder:pending[id]})),review,missingChecklists};
}
