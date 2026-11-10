// Convert pricing metres/areas to purchasing allowances; round once per material.
const stock=(value,fallback)=>Number.isFinite(Number(value))&&Number(value)>0?Number(value):fallback;
export function timberStockKind(description){
 const label=String(description||'');
 if(/\bjoist hangers?\b/i.test(label))return null;
 if(/\bjoists?\b|\btruss members\b/i.test(label))return 'joists';
 if(!/\b(ply|plywood|gussets?|chevrons?|front face|ring[- ]beam bases?|ring[- ]beam upstands?)\b/i.test(label))return null;
 if(/\b9\s*mm\b/i.test(label)&&!/\bOSB\b/i.test(label))return 'ply9';
 if(/\b18\s*mm\b/i.test(label)&&!/\bOSB\b/i.test(label))return 'ply18';
 return null;
}
export function convertTimberStock(items,materials){
 const pools=new Map(), retained=[];
 for(const item of items){
  const kind=item.group==='Timber'&&item.status==='needed'&&(!item.specification||item.specification==='Check stock lengths / sheet conversion')&&timberStockKind(item.description);
  const qty=Number(item.qty),unit=String(item.unit||'').trim().toLowerCase();
  if(!kind||!Number.isFinite(qty)||qty<=0||!(kind==='joists'?/^(m|metres?)$/.test(unit):/^(m²|m2|m\^2)$/.test(unit))){
   retained.push(item);continue;
  }
  const pool=pools.get(kind)||{first:item,qty:0};
  pool.qty+=qty;pools.set(kind,pool);
 }
 if(!pools.size)return items;
 const pooled=[...pools].map(([kind,{first,qty}])=>{
  const joists=kind==='joists', ply=materials?.[kind+'mm'];
  const length=joists?stock(materials?.steico?.stock_len_m,12):stock(ply?.sheet_len_m,2.4);
  const width=joists?1:stock(ply?.sheet_width_m,1.2);
  const size=joists?`${length} m stock`:`${length} × ${width} m sheets`;
  return {...first,description:joists?'Joist lengths':kind==='ply9'?'9 mm ply':'18 mm ply',
   qty:String(Math.max(1,Math.ceil(qty/(length*width)-1e-9))),unit:joists?'lengths':'sheets',
   specification:`${size} · allowance from ${Number(qty.toFixed(3))} ${joists?'m':'m²'}; check cutting layout`};
 });
 return [...pooled,...retained];
}
