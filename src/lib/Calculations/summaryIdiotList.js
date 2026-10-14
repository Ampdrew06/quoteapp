import {buildHippedLeanToRingBeamSchedule} from '../Manufacturing/ringBeamManufactureSchedule';
import { buildHippedLeanToManufacturingMembers } from '../Manufacturing/manufacturingSequenceBuilder';
// Supply checklist adapter for the already integrated Summary model.
// Price exclusion does not remove physically required materials from despatch.
const positive = value => Math.max(0, Number(value) || 0);
const coverage = (value, fallback) => positive(value) || fallback;
const clean = label => String(label || '').replace(/ — weight unconfigured/g, '').replace(/ \(factory use; weight unconfigured\)/g, '');
export function buildSummaryIdiotList(model, materials = {}) {
  const sections = {};
  if (model?.manufactureGeometry) {
    const names = { wallbar:model.manufactureGeometry.bossArrangement==='central'?'Truss members':'Sloping wallbars', hip:'Hips', 'jack-rafter':'Jack rafters', rafter:'Plain rafters', 'boss-rafter':'Boss rafters', wallplate:'Horizontal wallplate', 'ring-beam':'Ring-beams' };
    const members = buildHippedLeanToManufacturingMembers(model.manufactureGeometry);
    sections.assemblies = Object.entries(names).map(([key, item]) => ({key, item,
      qty: members.filter(member => member.type === key).length, units:'Ea'})).filter(row => row.qty > 0);
  }
  for (const [section, data] of Object.entries(model?.sections || {})) {
    sections[section] = (data.lines || []).filter(row => row.usage !== 'factory' && row.supplyToSite !== false && row.key !== 'vent').map(row => {
      // qty is authoritative: Summary applies +/- there, leaving legacy aliases unchanged.
      let qty = positive(row.qty ?? row.order_qty ?? row.orderQty);
      let units = row.units || row.uom || 'Ea';
      let item = clean(row.label || row.name || row.key);
      if (!row.isAddedItem) {
        const stock = {
          steico_220_total_m: [coverage(materials.timber_stock_length_mm, 12000) / 1000, 'Lengths'],
          pse30x90_ringbeam: [coverage(materials.pse30x90?.stock_len_m, 4.8), 'Lengths'],
          laths_25x50_lengths: [coverage(materials.lath_stock_length_m, 4.8), 'Lengths'],
          laths_25x50_total_m: [coverage(materials.lath_stock_length_m, 4.8), 'Lengths'],
          ply9mm_strips_total_m2: [coverage(materials.ply9mm?.sheet_len_m, 2.4) * coverage(materials.ply9mm?.sheet_width_m, 1.2), 'Sheets'],
          ply18mm_wallplate_infill: [coverage(materials.ply18mm?.sheet_len_m, 2.4) * coverage(materials.ply18mm?.sheet_width_m, 1.2), 'Sheets'],
          pir50_cradle: [coverage(materials.pir50_pack_coverage_m2, coverage(materials.pir50?.sheet_w_m, 1.2) * coverage(materials.pir50?.sheet_h_m, 2.4)), 'Sheets'],
          slab100: [coverage(materials.slab100_pack_coverage_m2 ?? materials.pir100_pack_coverage_m2, 2.88), 'Sheets'],
          tile_starter: [coverage(materials.tile_starter_stock_length_m, 3), 'Lengths'],
        }[row.key];
        if (stock) {
          const supplied = positive(row.order_qty ?? row.orderQty);
          const adjusted = Number(model?.quantityAdjustments?.[row.key]) || 0;
          qty = !adjusted && supplied > 0 ? supplied : Math.max(0, Math.ceil((qty - 1e-9) / stock[0]));
          units = stock[1];
        }
      }
      if (row.key === 'h_trim' && !row.isAddedItem) { units = 'mm cut'; }
      if (units === 'each') units = 'Ea';
      if (units === 'Length') units = 'Lengths';
      return { key: row.key, item, qty, units, isAddedItem: !!row.isAddedItem };
    }).filter(row => row.qty > 0);
  }
  const despatchOnly=Boolean(model?.manufactureGeometry);
  if(despatchOnly){
    const g=model.manufactureGeometry;
    if(g.bossArrangement==='central')sections.assemblies=[{key:'truss',item:'Assembled central truss',qty:1,units:'Ea'},...(sections.assemblies||[]).filter(r=>r.key!=='wallbar')];
    const schedule=buildHippedLeanToRingBeamSchedule({geometry:g});
    const fittedLathM=schedule?.valid?positive(schedule.totals.outerFixingLath25x50LengthM)+positive(schedule.totals.finishingLath25x50LengthM):0;
    sections.laths=(sections.timber||[]).filter(r=>['laths_25x50_lengths','laths_25x50_total_m'].includes(r.key)||(r.isAddedItem&&/lath/i.test(r.item))).map(r=>{
      if(r.isAddedItem)return r;
      const source=model.sections.timber.lines.find(x=>x.key===r.key),stockM=coverage(materials.lath_stock_length_m,4.8);
      return {...r,item:`Loose 25×50 laths (${stockM.toFixed(2)}m lengths)`,qty:Math.ceil(Math.max(0,positive(source.qty)-fittedLathM-1e-9)/stockM),units:'Lengths'};
    }).filter(r=>r.qty>0);
    // Explicitly added timber supplies remain visible, even when normal raw stock is fitted.
    const otherTimberExtras=(sections.timber||[]).filter(r=>r.isAddedItem&&!/lath/i.test(r.item));
    sections.misc=[...(sections.misc||[]),...otherTimberExtras];
    sections.timber=[];
    const fittedKeys=new Set(['joist_hangers','jack_rafter_hooks','jack_rafter_brackets','boss_rafter_terminal','spar_hook','pir50_cradle']);
    for(const key of ['metal','misc'])sections[key]=(sections[key]||[]).flatMap(r=>{
      if(r.isAddedItem||!fittedKeys.has(r.key))return [r];
      const extra=positive(model.quantityAdjustments?.[r.key]);if(!extra)return [];
      const qty=r.key==='pir50_cradle'?Math.ceil(extra/coverage(materials.pir50_pack_coverage_m2,coverage(materials.pir50?.sheet_w_m,1.2)*coverage(materials.pir50?.sheet_h_m,2.4))):Math.min(r.qty,extra);
      return qty>0?[{...r,qty,item:r.item+' — extra, supplied loose'}]:[];
    });
    const ceilingM2=positive(model.hippedInsulationIntegration?.superQuilt?.geometricAreaM2)||positive(model.plasterboardWeightKg)/8.5;
    if(ceilingM2>0){
      const addedBoards=(sections.misc||[]).some(r=>r.isAddedItem&&/plasterboard/i.test(r.item));
      (sections.misc||=[]).push({key:'plasterboard_guide',item:addedBoards?'Plasterboard ceiling requirement — supply listed separately':'Plasterboard 2400 × 1200mm — NOT SUPPLIED (customer to purchase)',qty:Math.ceil((ceilingM2-1e-9)/2.88),units:'Sheets',informational:true});
    }
  }
  return { sections, despatchOnly, installedWeightKg: positive(model?.installedWeightKg) };
}
