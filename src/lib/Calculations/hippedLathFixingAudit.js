import { buildFrontRafterManufactureProfiles } from '../Manufacturing/frontRafterManufactureProfiles';
import { buildJackRafterManufactureAudit } from './jackRafterManufactureAudit';

const n = value => Math.max(0, Number(value) || 0);
const pitchCos = value => Math.cos(Number(value) * Math.PI / 180);

// A conservative supply allowance, not a factory fixing layout.
export function buildHippedLathFixingAudit({ roofInputs = {}, geometry,
  automaticResult, insulationAudit, edgeModel, spacingMM = 500 } = {}) {
  const errors = [];
  if (!geometry || !automaticResult?.facets?.length || !insulationAudit?.valid || !edgeModel?.valid)
    errors.push('Resolved member profiles, facet lath rows and roof edges are required.');
  if (!(Number(spacingMM) > 0)) errors.push('Positive support-lath fixing spacing is required.');
  if ((automaticResult?.facets || []).some(f => n(f.openingAreaM2) > 0))
    errors.push('Lath fixing allowances around roof openings require their own review.');
  if (errors.length) return { valid: false, errors, rows: [], totalBoxes: null };
  const frontMembers = buildFrontRafterManufactureProfiles({ geometry });
  const jackAudit = buildJackRafterManufactureAudit({ roofInputs, geometry });
  const expectedJacks = ['leftJackRafterCount','rightJackRafterCount','leftSideIntermediateJackCount','rightSideIntermediateJackCount'].reduce((sum,key) => sum+n(geometry[key]),0);
  if (!jackAudit.valid && expectedJacks > 0) return { valid: false, errors: jackAudit.errors, rows: [], totalBoxes: null };
  if (jackAudit.jacks.length !== expectedJacks || frontMembers.length !== n(geometry.plainRafterCount)+n(geometry.bossRafterCount))
    return { valid: false, errors: ['Resolved manufacture profiles do not match the roof member counts.'], rows: [], totalBoxes: null };
  const groups = [
    { key: 'front', facetId: 'facet-front', jackId: 'F2', pitch: geometry.frontPitchDeg, members: frontMembers },
    { key: 'left', facetId: 'facet-left-side', jackId: 'F1', pitch: geometry.leftSidePitchDeg, members: [] },
    { key: 'right', facetId: 'facet-right-side', jackId: 'F3', pitch: geometry.rightSidePitchDeg, members: [] },
  ];
  const rows = [];
  for (const group of groups) {
    const facet = automaticResult.facets.find(f => f.facet?.id === group.facetId);
    if (!facet) continue;
    if (!facet.lathRows?.length || !insulationAudit.internalLaths?.[group.key]?.rows?.length)
      return { valid: false, errors: [`Missing lath rows for ${group.key} facet.`], rows: [], totalBoxes: null };
    const members = [...group.members, ...jackAudit.jacks.filter(j => j.facetId === group.jackId)];
    // End supports are hips on the front, and wallbar/hip on side facets.
    // Keep both end allowances at short rows and boss junctions for supply safety.
    const count = (positionMM, surface) => 2 + members.filter(m =>
      n(m.profile?.[`${surface}SlopeLengthMM`]) + 24 >= positionMM).length;
    const overhangSlopeMM = n(roofInputs.eaves_overhang_mm ?? 50) / pitchCos(group.pitch);
    for (const row of facet.lathRows || []) {
      if (!(n(row.widthMM) > 0)) continue;
      const positionMM = Math.max(0, n(row.yMM) - overhangSlopeMM);
      rows.push({ facet: group.key, use: 'external', positionMM: n(row.yMM),
        screws: count(positionMM, 'external'), kind: row.kind });
    }
    for (const row of insulationAudit.internalLaths?.[group.key]?.rows || []) {
      if (!(n(row.lengthMM) > 0)) continue;
      rows.push({ facet: group.key, use: 'internal', positionMM: n(row.positionMM),
        screws: count(n(row.positionMM), 'internal'), kind: 'internalFixing' });
    }
  }
  const steel = /britmet|metrotile/i.test(automaticResult.facets[0]?.productId || roofInputs.tileSystem || roofInputs.tile_system || 'britmet');
  const supportRows = steel ? edgeModel.edges.filter(e => e.kind === 'hip' || e.kind === 'ridge')
    .map(e => ({ edgeId: e.id, lengthMM: n(e.lengthMM), laths: 2,
      screws: n(e.lengthMM) > 0 ? 2 * (Math.ceil(n(e.lengthMM) / spacingMM) + 1) : 0 })) : [];
  // Additional 25x50 outer-edge and upstand finishing uses also need a loose
  // screw allowance. Budget two runs at 500mm centres, with end fixings.
  const perimeterRows = edgeModel.edges.filter(e => e.kind === 'eaves')
    .map(e => ({ edgeId: e.id, lengthMM: n(e.lengthMM), laths: 2,
      screws: n(e.lengthMM) > 0 ? 2 * (Math.ceil(n(e.lengthMM) / spacingMM) + 1) : 0 }));
  const sum = list => list.reduce((total, row) => total + row.screws, 0);
  const internalScrews = sum(rows.filter(r => r.use === 'internal'));
  const externalRowScrews = sum(rows.filter(r => r.use === 'external'));
  const supportScrews = sum(supportRows), perimeterScrews = sum(perimeterRows);
  const externalScrews = externalRowScrews + supportScrews + perimeterScrews;
  const internalBoxes = Math.ceil(internalScrews / 250);
  const externalBoxes = Math.ceil(externalScrews / 250);
  return { valid: true, errors: [], rows, supportRows, perimeterRows, spacingMM,
    internalScrews, externalRowScrews, supportScrews, perimeterScrews, externalScrews,
    internalBoxes, externalBoxes, totalBoxes: internalBoxes + externalBoxes, unitsPerBox: 250,
    assumptions: [
      'One screw per transverse lath/member intersection; member reach uses the existing manufacture profiles.',
      'Both end supports are allowed on every non-zero row, including short rows; a 24mm member-face tolerance keeps the allowance conservative.',
      'Steel hip/ridge support laths use approximately 500mm centres plus an end fixing; no support-lath screws for slate.',
      'A conservative additional allowance covers the two perimeter outer-edge/upstand lath runs at 500mm centres plus end fixings.',
      'Internal and external allowances each round up separately to boxes of 250; suitable surplus stays available to the fitter.',
    ] };
}
