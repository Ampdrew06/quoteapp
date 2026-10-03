const positive = value => Math.max(0, Number(value) || 0);
const price = (materials, keys) => {
  const key = keys.find(item => materials[item] != null);
  return key == null ? null : positive(materials[key]);
};
export function buildHippedGutteringIntegrationAudit({ edgeModel, materials = {}, profile = 'square', legacyLines = [] } = {}) {
  const errors = [];
  profile = String(profile).toLowerCase();
  if (!['square','round','ogee'].includes(profile)) errors.push('Unsupported gutter profile.');
  if (!edgeModel?.valid) errors.push('Valid external edge geometry is required.');
  const stockM = positive(materials.gutter_length_m ?? 4);
  const spacingMM = positive(materials.gutter_bracket_spacing_mm ?? 800);
  if (!stockM || !spacingMM) errors.push('Gutter stock length and bracket spacing must be positive.');
  const rows = (edgeModel?.edges || []).filter(edge => edge.kind === 'eaves').map(edge => {
    const runM = positive(edge.lengthMM)/1000;
    const lengths = stockM ? Math.ceil(runM/stockM) : 0;
    const unions = Math.max(0,lengths-1);
    const baseBrackets = runM && spacingMM ? Math.ceil(runM*1000/spacingMM)+1 : 0;
    return { edgeId:edge.id, side:edge.side, runM, lengths, unions, baseBrackets, brackets:baseBrackets };
  });
  if (!rows.length) errors.push('No active eaves runs found.');
  const total = field => rows.reduce((sum,row)=>sum+row[field],0);
  const sideRows = rows.filter(row => row.side === 'left' || row.side === 'right');
  const counts = { lengths:total('lengths'), unions:total('unions'), brackets:total('brackets'),
    corners90:sideRows.length, stopEnds:2, outlets:1, pipes:1, offsetBends:2, clips:2, shoes:1, adaptors:profile==='round'?0:1 };
  const pipeM = positive(materials.downpipe_length_m ?? materials.dp_length_m ?? 2.5);
  const items = [
    ['g_len','Gutter lengths',counts.lengths,`${stockM}m length`,[`gutter_${profile}_length_4m_price`]],
    ['g_union','Gutter unions',counts.unions,'each',[`gutter_${profile}_union_price`]],
    ['g_brkt','Gutter brackets',counts.brackets,'each',[`gutter_${profile}_bracket_price`]],
    ['g_corner_90','90° external gutter corners',counts.corners90,'each',[`gutter_${profile}_corner_90_ext_price`]],
    ['g_stop','Stop ends',2,'each',[`gutter_${profile}_stop_end_price`]],
    ['g_outlet','Running outlet',1,'each',[`gutter_${profile}_running_outlet_price`]],
    ['dp_len','Round downpipe',1,`${pipeM}m length`,['dp_length_2_5m_price','downpipe_length_2_5m_price','downpipe_length_price']],
    ['dp_bend','Round downpipe offset bends',2,'each',['dp_bend_price','downpipe_bend_price']],
    ['dp_clip','Downpipe clips',2,'each',['dp_clip_price','downpipe_clip_price']],
    ['dp_shoe','Downpipe shoe',1,'each',['dp_shoe_price','downpipe_shoe_price']],
    ['dp_adaptor','Square/ogee to round adaptor',counts.adaptors,'each',['dp_adaptor_price','sq_to_round_adaptor_price']],
  ].filter(item => item[2] > 0).map(([key,label,qty,unit,keys]) => {
    const unitPrice = price(materials,keys);
    return { key,label,qty,unit,unitPrice,cost:unitPrice==null?null:qty*unitPrice };
  });
  return { valid:!errors.length, errors, rows, counts, stockM, spacingMM, pipeM, profile,
    totalRunM:total('runM'), items, totalCost:items.some(item=>item.cost==null)?null:items.reduce((sum,item)=>sum+item.cost,0),
    legacyLines,
    assumptions:[
      'Whole 4m stock is allocated by straight run. Corners are separate fittings, not unions. Suitable offcut optimisation is not applied here.',
      'Brackets are calculated per run: ceiling(run / spacing) + one. Unions and corners require no additional brackets.',
      'Current hipped perimeter: two stop ends, one running outlet, one round downpipe, two offset bends, two clips and one shoe. Outlet position does not remove a stop end.',
      'Square and ogee gutters include one adaptor to round downpipe; round gutters need none. Manual Summary adjustments remain the way to remove the adaptor when square downpipe is requested.',
      'Current rectangular eaves corners use 90-degree fittings. Future 135-degree and unusual-angle roofs require their own corner geometry audit; welding labour is already included in labour.',
      'Summary consumes this calculation for valid hipped roofs. Installed gutter weight uses the external eaves length; costs use whole supplied stock.',
    ] };
}
