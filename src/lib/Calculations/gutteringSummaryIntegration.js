const n = value => Math.max(0, Number(value) || 0);
export function integrateGutteringSummary(audit, legacyLines, materials = {}) {
  if (!audit?.valid) return legacyLines;
  const weightKeys = {
    g_union:['gutter_union_weight_kg','gutter_union_weight_kg_each'],
    g_brkt:['gutter_bracket_weight_kg','gutter_bracket_weight_kg_each'],
    g_corner_90:[`gutter_${audit.profile}_corner_90_ext_weight_kg`,'gutter_corner_weight_kg'],
    g_stop:['gutter_stop_end_weight_kg','stop_end_weight_kg_each'],
    g_outlet:['gutter_outlet_weight_kg','running_outlet_weight_kg_each'],
    dp_len:['dp_length_weight_kg_each','downpipe_length_weight_kg'],
    dp_bend:['downpipe_bend_weight_kg','dp_bend_weight_kg_each'],
    dp_clip:['downpipe_clip_weight_kg','dp_clip_weight_kg_each'],
    dp_shoe:['downpipe_shoe_weight_kg','dp_shoe_weight_kg_each'],
    dp_adaptor:['downpipe_adaptor_weight_kg','dp_adaptor_weight_kg_each','dp_adapt_weight_kg_each'],
  };
  return audit.items.map(item => {
    const keys = item.key === 'g_len' ? [`gutter_${audit.profile}_weight_kg_per_m`] : weightKeys[item.key] || [];
    const configuredKey = keys.find(key => materials[key] != null);
    const rate = configuredKey == null ? 0 : n(materials[configuredKey]);
    const weight = Number((rate * (item.key === 'g_len' ? audit.totalRunM : item.qty)).toFixed(2));
    // Keep the legacy adaptor key so saved +/- overrides still address it.
    const key = item.key === 'dp_adaptor' ? 'dp_adapt' : item.key;
    return { key, _k:key, label:`${item.label}${item.key.startsWith('g_') ? ` (${audit.profile})` : ''}${configuredKey == null && item.key === 'g_corner_90' ? ' — weight unconfigured' : ''}`,
      qty:item.qty, order_qty:item.qty, units:item.unit,
      unit:item.unitPrice ?? 0, unitPrice:item.unitPrice ?? 0,
      line:Number(n(item.cost).toFixed(2)), total:Number(n(item.cost).toFixed(2)),
      weight_kg:weight, totalWeightKg:weight, total_weight_kg:weight,
      weight_kg_each:item.qty ? weight/item.qty : 0,
      used_m:item.key === 'g_len' ? audit.totalRunM : undefined,
      price_unconfigured:item.cost == null, weight_unconfigured:configuredKey == null };
  });
}
