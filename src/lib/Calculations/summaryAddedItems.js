/* global globalThis */
const round = n => Number(Number(n).toFixed(2));
const at = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);
const first = (m, ...paths) => paths.map(path => at(m, path)).find(value => value != null && Number.isFinite(Number(value)));
export const addedItemSections = ['timber','tiles','plastics','metal','gutters','misc'];
export function buildSummaryItemCatalog(m = {}) {
  const items = [];
  const add = (section, id, label, units, price) => items.push({section,id,label,units,
    unitPrice: price == null || !Number.isFinite(Number(price)) ? null : Math.max(0,Number(price))});
  const field = (section,id,label,units,...paths) => add(section,id,label,units,first(m,...paths));
  const stock = (section,id,label,units,length,...paths) => {
    const rate=first(m,...paths); add(section,id,label,units,rate == null ? null : Number(rate)*length);
  };
  const steicoStock=Number(m.steico?.stock_len_m)||12;
  stock('timber','steico',`Steico 220 I-joist — ${steicoStock}m stock`,'Length',steicoStock,'steico.price_per_m');
  const pseStock=Number(m.ringBeam?.stock_len_m ?? m.pse30x90?.stock_len_m)||4.8;
  stock('timber','pse',`30×95 PSE — ${pseStock}m stock`,'Length',pseStock,'ringBeam.timber_price_per_m','ringbeam_pse90x30_per_m','pse30x90.price_per_m');
  stock('timber','lath25','25×50 lath — 4.8m stock','Length',4.8,'lath25x50.price_per_m','lath_50x25_per_m','chamferLath.price_per_m');
  field('timber','lath19','19×38 lath — 4.8m stock','Length','lath19x38_bar_price');
  for (const [id,label,key,path] of [['ply9','9mm structural ply','ply9_sheet_price','ply9mm.price_per_m2'],['ply18','18mm structural ply','ply18_sheet_price','ply18mm.price_per_m2'],['osb18','18mm OSB','osb18_sheet_price','osb18.price_per_m2']]) {
    const sheet=first(m,key),rate=first(m,path);add('timber',id,`${label} — 2.4×1.2m sheet`,'Sheet',sheet??(rate==null?null:Number(rate)*2.88));
  }
  for (const [system, label, definitions] of [
    ['britmet','Britmet',[
      ['tile','Tile','tile_britmet_price_each'],['ridge','Hip / ridge tile','britmet_ridge_tile_price_each'],['y','Y adaptor','britmet_y_adaptor_price_each'],['five','5-way adaptor','britmet_5way_adaptor_price_each'],['universal','Universal ridge adaptor','britmet_universal_ridge_adaptor_price_each'],['cap90','90° hip end cap','britmet_hip_end_cap_90_price_each'],['cap135','135° hip end cap','britmet_hip_end_cap_135_price_each'],['gable','Gable end cap','britmet_gable_end_cap_price_each'],['barge','2-part barge','verge_trim_price_each'],['vent','Vent strip','britmet_vent_strip_price_each'],['touchup','Touch-up kit','touchup_kit_britmet_price_each']]],
    ['liteslate','LiteSlate',[
      ['tile','Tile','liteslate_tile_price_each'],['ridge','Hip / ridge tile','liteslate_ridge_tile_price_each'],['adaptor','Ridge / hip adaptor','liteslate_ridge_hip_adaptor_price_each'],['cap90','90° hip end cap','liteslate_hip_end_cap_90_price_each'],['verge','Dry verge','liteslate_dry_verge_price_each']]],
  ]) for (const [id,name,key] of definitions) field('tiles',`${system}_${id}`,`${label} ${name}`,'Ea',key);
  for (const band of ['white','foiled']) {
    for (const [kind,label] of [['fascia','Reveal liner'],['soffit','Soffit board']]) {
      const sizes=m[`${kind}_price_per_length_${band}_mm`] || {};
      for(const size of Object.keys(sizes).sort((a,b)=>Number(a)-Number(b)))
        field('plastics',`${kind}_${band}_${size}`,`${label} ${size}mm × 5m — ${band}`,'Length',`${kind}_price_per_length_${band}_mm.${size}`);
    }
    for(const [id,label,key] of [
      ['j','Soffit starter / J-trim — 5m','fascia_j_section'],['h','H-trim — full 5m length','fascia_h_section'],
      ['corner90','90° external fascia corner (300mm)','fascia_corner_90_ext_300'],['double90','90° double external fascia corner (500mm)','fascia_corner_90_double_ext_500'],['cornerint','Internal fascia corner (500mm)','fascia_corner_int_500'],['joint300','Fascia joint (300mm)','fascia_joint_300'],['joint500','Fascia joint (500mm)','fascia_joint_500'],['corner135','135° fascia corner (300mm)','fascia_corner_135_300'],['ventdisc','Vent disc','fascia_vent_disc'],['bead','Plaster bead','plaster_bead'],
    ]) field('plastics',`${id}_${band}`,`${label} — ${band}`,'Ea',`${key}_${band}_price`);
  }
  field('metal','starter','Tile starter — 3m length','Length','tile_starter_price_each','metal.tile_starter.price_each');
  field('metal','watercourse','Aluminium watercourse / secret gutter — 2.5m','Length','watercourse_price_each','metal.watercourse.price_per_piece');
  for(const [id,label] of [['joist_hanger','Joist hanger'],['joist_hanger_variable','Variable joist hanger'],['spar_hook','Spar hook'],['jack_rafter_hook','Jack rafter hook'],['jack_rafter_bracket','Jack rafter bracket'],['corner_hanger','Corner hanger'],['boss_rafter_terminal','Boss / rafter terminal'],['reinforcement_plate','Reinforcement plate'],['gable_strap','Gable strap']])
    field('metal',id,label,'Ea',`${id}_price_each`);
  for(const profile of ['square','round','ogee']) for(const [id,label,suffix,unit] of [
    ['length','Gutter — 4m length','length_4m','Length'],['union','Gutter union','union','Ea'],['outlet','Running outlet','running_outlet','Ea'],['stopoutlet','Stop-end outlet','stop_end_outlet','Ea'],['stop','Stop end','stop_end','Ea'],['corner90','90° external gutter corner','corner_90_ext','Ea'],['corner90int','90° internal gutter corner','corner_90_int','Ea'],['corner135','135° external gutter corner','corner_135_ext','Ea'],['bracket','Gutter bracket','bracket','Ea'],
  ]) field('gutters',`${profile}_${id}`,`${label} — ${profile}`,unit,`gutter_${profile}_${suffix}_price`);
  for(const [id,label,key,unit] of [['dp','Round downpipe — 2.5m','dp_length_2_5m_price','Length'],['adaptor','Square / ogee to round adaptor','dp_adaptor_price','Ea'],['bend','Round downpipe offset bend','dp_bend_price','Ea'],['clip','Round downpipe clip','dp_clip_price','Ea'],['shoe','Round downpipe shoe','dp_shoe_price','Ea']]) field('gutters',id,label,unit,key);
  for(const [id,label,key,unit] of [
    ['sq12','SuperQuilt — 12m² roll','superquilt_12m_price_each','Roll'],['sq15','SuperQuilt — 15m² roll','superquilt_15m_price_each','Roll'],['membrane','Breather membrane — 1×50m roll','breather_membrane_price_each','Roll'],['foam','Expanding foam can','expanding_foam_can_price_each','Can'],['hipfoam','Expanding foam tape — 5.6m roll','expanding_foam_roll_price_each','Roll'],['alu','Aluminium tape — 50m roll','aluminium_tape_roll_price_each','Roll'],['duct','Duct tape','duct_tape_roll_price_each','Roll'],['glue','D4 glue — spare tub','d4_glue_price_per_tub','Tub'],['deck','Deck adhesive — 2.5ltr','deck_adhesive_2_5l_price_each','Tub'],['bond','Bond adhesive — 2.5ltr','bond_adhesive_2_5l_price_each','Tub'],['bondcan','Bond adhesive — can','bond_adhesive_can_price_each','Can'],['pins','Polytop pins — 50-pin allowance','polytop_pins_price_per_box','Pack'],['screw1','1″ × 8 screws','screws_1x8_price_per_box','Box'],['screw2','2″ × 8 screws — 250/box','screws_2x8_price_per_box','Box'],['screw3','3″ × 10 screws','screws_3x10_price_per_box','Box'],['screw15','1½″ × 10 screws — spare box','screws_1_5x10_price_per_box','Box'],['rivets','Spar-hook rivets — spare box','spar_hook_rivets_price_per_box','Box'],['dry32','32mm drywall screws','drywall_screws_32mm_price_per_box','Box'],['dry50','50mm drywall screws','drywall_screws_50mm_price_per_box','Box'],['concrete','Concrete screws','concrete_screws_price_per_box','Box'],['epdm','EPDM rubber','epdm_rubber_price_per_m2','m²'],
  ]) field('misc',id,label,unit,key);
  field('misc','pir50','50mm PIR — full sheet','Sheet','pir50.price_per_sheet');
  field('misc','pir100','100mm PIR — full sheet','Sheet','pir100.price_per_sheet');
  return items;
}
export function normalizeAddedItems(items) {
  if(!Array.isArray(items))return [];
  const seen=new Set();
  return items.filter(item=>{
    if(!item || !addedItemSections.includes(item.section) || typeof item.catalogId!=='string')return false;
    const key=`${item.section}:${item.catalogId}`;
    if(seen.has(key))return false;seen.add(key);return true;
  }).map(item=>({section:item.section,catalogId:item.catalogId,
    qty:Math.max(0,Number.isFinite(Number(item.qty))?Number(item.qty):1),excluded:item.excluded===true}));
}
export function buildSummaryAddedItemLines(items, materials = {}) {
  const catalog=buildSummaryItemCatalog(materials);
  return normalizeAddedItems(items).map(item=>{
    const product=catalog.find(row=>row.section===item.section&&row.id===item.catalogId);
    if(!product)return null;
    const cost=round(item.qty*(product.unitPrice??0));
    return {key:`extra:${item.section}:${item.catalogId}`,section:item.section,catalogId:item.catalogId,
      label:`Extra — ${product.label}`,qty:item.qty,order_qty:item.qty,units:product.units,
      unit:product.unitPrice??0,unitPrice:product.unitPrice??0,line:cost,total:cost,
      weight_kg:0,totalWeightKg:0,isAddedItem:true,extraExcluded:item.excluded,
      price_unconfigured:product.unitPrice==null,supplyToSite:true};
  }).filter(Boolean);
}
export const addedItemsCost = lines => round(lines.reduce((sum,row)=>sum+(row.extraExcluded?0:row.line),0));
export function readSummaryAddedItems(storage = globalThis.localStorage) {
  try{return normalizeAddedItems(JSON.parse(storage.getItem('leanToInputs')||'{}')?.summaryAddedItems);}catch{return [];}
}
export function writeSummaryAddedItems(items, storage = globalThis.localStorage) {
  let inputs={};try{inputs=JSON.parse(storage.getItem('leanToInputs')||'{}')||{};}catch{ /* retain new items */ }
  const normalized=normalizeAddedItems(items);
  storage.setItem('leanToInputs',JSON.stringify({...inputs,summaryAddedItems:normalized}));
  return normalized;
}
