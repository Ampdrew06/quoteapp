import { buildHippedLeanToManufacturingMembers } from '../Manufacturing/manufacturingSequenceBuilder';
// Supply checklist adapter for the already integrated Summary model.
// Price exclusion does not remove physically required materials from despatch.
const positive = value => Math.max(0, Number(value) || 0);
const coverage = (value, fallback) => positive(value) || fallback;
const clean = label => String(label || '').replace(/ — weight unconfigured/g, '').replace(/ \(factory use; weight unconfigured\)/g, '');
export function buildSummaryIdiotList(model, materials = {}) {
  const sections = {};
  if (model?.manufactureGeometry) {
    const names = { wallbar:'Sloping wallbars', hip:'Hips', 'jack-rafter':'Jack rafters', rafter:'Plain rafters', 'boss-rafter':'Boss rafters', wallplate:'Horizontal wallplate', 'ring-beam':'Ring-beams' };
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
  return { sections, installedWeightKg: positive(model?.installedWeightKg) };
}
