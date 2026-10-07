import { getFixedProductWeightKg } from '../utils/weights';
const n = value => Math.max(0,Number(value)||0);
export function buildWatercourseWallbarRequirement(geometry, materials = {}) {
  const runs = [
    { side:'left', lengthMM:n(geometry?.leftExternalWallBarSlopeMM) },
    { side:'right', lengthMM:n(geometry?.rightExternalWallBarSlopeMM) },
  ].filter(run => run.lengthMM > 0).map(run => ({ ...run,
    orderQty:run.lengthMM <= 2500 ? 1 : 1 + Math.ceil((run.lengthMM-2500)/2450) }));
  const qty = runs.reduce((sum,run)=>sum+run.orderQty,0);
  const rate = materials.watercourse_price_each ?? materials.metal?.watercourse?.price_per_piece;
  return {key:'watercourse',label:'Aluminium watercourse / secret gutter (2.5m)',qty,orderQty:qty,
    units:'supplied lengths',runs,basis:'Each accompanying EWBS separately; 2500mm first piece, 2450mm additional cover; installed weight at 0.18kg/m',
    cost:rate==null?null:qty*n(rate),usedM:runs.reduce((sum,run)=>sum+run.lengthMM,0)/1000,
    weightKg:runs.reduce((sum,run)=>sum+run.lengthMM,0)/1000*(0.45/2.5)};
}

export function buildHippedMetalIntegrationAudit({geometry,edgeResult,materials={}}={}) {
  const errors=[];
  if (!geometry || !edgeResult?.edgeModel?.valid || !edgeResult?.bom?.valid) errors.push('Valid hipped member geometry and automatic edge BOM are required.');
  const jackFields=['leftJackRafterCount','rightJackRafterCount','leftSideIntermediateJackCount','rightSideIntermediateJackCount'];
  const jackQty=jackFields.reduce((sum,key)=>sum+n(geometry?.[key]),0);
  const specs=[
    ['joist_hangers','Joist hangers',n(geometry?.plainRafterCount),'One per plain rafter','joist_hanger_price_each',materials.metal?.joist_hanger?.price_each],
    ['jack_rafter_hooks','Jack rafter hooks',jackQty,'One per front/side jack','jack_rafter_hook_price_each',materials.metal?.jack_rafter_hook?.price_each],
    ['jack_rafter_brackets','Jack rafter brackets',jackQty,'One per front/side jack','jack_rafter_bracket_price_each',materials.metal?.jack_rafter_bracket?.price_each],
    ['boss_rafter_terminal','Boss / rafter terminals',n(geometry?.bossQty),'Resolved boss count','boss_rafter_terminal_price_each',materials.boss_price_each ?? materials.metal?.boss_rafter_terminal?.price_each],
    ['spar_hook','Spar hooks',n(geometry?.sparHookQty),geometry?.bossArrangement==='central'?'Three connection pairs at the central boss':'Resolved spar hooks (four per offset boss)','spar_hook_price_each',materials.metal?.spar_hook?.price_each],
  ];
  const rows=specs.map(([key,label,qty,basis,priceKey,fallback])=>{
    const rate=materials[priceKey] ?? fallback;
    const kgEach=key==='joist_hangers' ? n(materials.joist_hanger_weight_kg_each ?? materials.metal?.joist_hanger?.weight_kg_each) : getFixedProductWeightKg(key);
    return {key,label,qty,orderQty:qty,units:'each',basis,cost:rate==null?null:qty*n(rate),weightKg:qty*kgEach};
  });
  const starter=edgeResult?.bom?.lines?.find(row=>row.key==='tile_starter');
  if (starter) rows.unshift({key:'tile_starter',label:'Tile starter',qty:n(starter.qty),orderQty:n(starter.order_qty),units:'m used / stock lengths ordered',basis:'Shared automatic edge BOM; cost and installed weight use metres consumed',cost:n(starter.line),weightKg:n(starter.weight_kg)});
  const watercourse=buildWatercourseWallbarRequirement(geometry,materials);
  if (watercourse.qty > 0) rows.push(watercourse);
  const wallEdges=(edgeResult?.edgeModel?.edges||[]).filter(edge=>edge.kind==='wallAbutment');
  return {valid:!errors.length,errors,rows,watercourse,jackBreakdown:jackFields.map(key=>({key,qty:n(geometry?.[key])})),wallEdges,
    totalCost:rows.some(row=>row.cost==null&&row.qty>0)?null:rows.reduce((sum,row)=>sum+n(row.cost),0),totalWeightKg:rows.reduce((sum,row)=>sum+row.weightKg,0),
    assumptions:[
      'Read-only calculation evidence. These are expected base requirements before manual +/- adjustments and exclusions; this is not a capture of the live Summary table.',
      'Current member counts and lengths remain accepted pending physical testing. Hardware attachment rules are displayed for factory confirmation.',
      'Tile starter already uses the shared edge BOM. Hip/ridge tiles and end caps remain in Tiles, avoiding duplicate metal rows.',
      'Secret gutter follows each accompanying sloping wallbar against the house, including hipped wallbars. Do not substitute the full horizontal rear wallplate width. Cost uses supplied 2.5m aluminium lengths; installed roof weight uses combined EWBS metres at 0.18kg/m (0.45kg per full length).',
      'Joist hanger weights use Materials; jack hardware, bosses and spar hooks use existing fixed technical weights.',
    ]};
}
