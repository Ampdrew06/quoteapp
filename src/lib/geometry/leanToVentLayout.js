import { roofVentOptions } from '../glazingOptions';

const rafterThicknessMM = 47;
const clearanceMM = 10;
const minimumGapMM = 49;

export function buildLeanToVentLayout(inputs = {}, materials = {}) {
  const empty = { active: false, openings: [], areaM2: 0, positions: inputs.leanToRafterPositionsMM };
  if ((inputs.roofStyle ?? inputs.roof_style ?? 'leanTo') !== 'leanTo') return empty;

  const quantities = inputs.roofVentQuantities;
  const selections = roofVentOptions.map(option => ({ ...option, quantity: Number(quantities?.[option.code] ?? 0) }))
    .filter(option => Number.isSafeInteger(option.quantity) && option.quantity > 0);
  const count = selections.reduce((sum, option) => sum + option.quantity, 0);
  if (!count) return empty;

  const width = Number(inputs.internalWidthMM ?? inputs.widthMM);
  const projection = Number(inputs.internalProjectionMM ?? inputs.projMM);
  const pitch = Number(inputs.pitchDeg ?? inputs.pitch_deg);
  const cosine = Math.cos(pitch * Math.PI / 180);
  const slope = projection / cosine;
  const fail = error => ({ ...empty, active: true, error });
  if (!(width > 0 && projection > 0 && pitch > 0 && pitch < 90)) {
    return fail('Enter the roof dimensions and pitch to place the vents.');
  }
  if (count > 49 || selections.some(option => option.heightMM >= slope)) {
    return fail('The selected roof vents do not fit inside the Lean-To roof.');
  }

  const vents = selections.flatMap(option => Array.from({ length: option.quantity }, () => ({
    ...option,
    // Use even centres to match the workshop set-out (607 mm becomes 606 mm).
    bayMM: 2 * Math.floor((option.widthMM + rafterThicknessMM + clearanceMM) / 2),
  })));
  const freeGapMM = (width - vents.reduce((sum, vent) => sum + vent.bayMM, 0)) / (count + 1);
  if (freeGapMM < minimumGapMM) return fail('The selected vents do not fit with room between the rafters.');

  const settings = inputs.roofVentOffsetsMM ?? {};
  const hasLegacyOffsets = Object.keys(settings).some(key => /^roof-vent-\d+$/.test(key));
  const legacyPitch = hasLegacyOffsets ? legacyVentPitch(width, vents) : null;
  let nextLeftMM = freeGapMM;
  const openings = vents.map((vent, index) => {
    const id = `roof-vent-${index + 1}`;
    const automaticCentre = nextLeftMM + vent.bayMM / 2;
    nextLeftMM += vent.bayMM + freeGapMM;
    const legacyCentre = legacyPitch == null ? automaticCentre
      : width / 2 + (index - (count - 1) / 2) * legacyPitch + Number(settings[id] ?? 0);
    const centreMM = Number(settings.centres?.[id] ?? legacyCentre);
    const yMM = (slope - vent.heightMM) / 2;
    return {
      ...vent,
      id,
      centreMM,
      type: 'roofVent',
      xMM: centreMM - vent.widthMM / 2,
      yMM,
      planYMM: yMM * cosine,
      planHeightMM: vent.heightMM * cosine,
      leftRafterMM: centreMM - vent.bayMM / 2,
      rightRafterMM: centreMM + vent.bayMM / 2,
    };
  });
  if (openings.some(opening => !Number.isFinite(opening.centreMM))) return fail('Enter numeric vent centres.');
  if (openings[0].leftRafterMM < minimumGapMM || width - openings.at(-1).rightRafterMM < minimumGapMM) {
    return fail('Leave room for a rafter on each side of every roof vent.');
  }

  if (openings.some((opening, index) => index > 0 &&
      opening.leftRafterMM - openings[index - 1].rightRafterMM < minimumGapMM)) {
    return fail('Leave room between the rafters of neighbouring roof vents.');
  }

  const spacing = Number(materials.rafter_spacing_mm ?? 665);
  if (!(spacing >= minimumGapMM)) return fail('Check the rafter spacing in Materials.');
  let positions = [];
  let start = 0;
  for (const opening of [...openings, { leftRafterMM: width, rightRafterMM: width }]) {
    const run = opening.leftRafterMM - start;
    const bays = Math.ceil(run / spacing);
    if (positions.length + bays > 101) return fail('The vent layout requires more than 100 internal rafters.');
    for (let bay = 1; bay < bays; bay += 1) positions.push(start + run * bay / bays);
    if (opening.leftRafterMM !== width) positions.push(opening.leftRafterMM, opening.rightRafterMM);
    start = opening.rightRafterMM;
  }
  if (positions.length > 100) return fail('The vent layout requires more than 100 internal rafters.');
  const automaticPositions = positions;
  const lockedCentresMM = openings.flatMap(opening => [opening.leftRafterMM, opening.rightRafterMM]);
  if (Array.isArray(settings.rafters)) {
    const manual = settings.rafters.map(Number).sort((a,b)=>a-b);
    if (manual.length > 100 ||
        manual.some((centre,index)=>!Number.isFinite(centre) || centre <= 48 || centre >= width-48 ||
          (index > 0 && centre-manual[index-1] <= 48) ||
          openings.some(opening=>centre > opening.leftRafterMM+0.001 && centre < opening.rightRafterMM-0.001)) ||
        lockedCentresMM.some(centre=>!manual.some(value=>Math.abs(value-centre)<0.001))) {
      return fail('Keep both vent rafters in place and leave the vent bays clear.');
    }
    positions=manual;
  }
  const areaM2 = openings.reduce((sum, opening) => sum + opening.widthMM * opening.heightMM, 0) / 1_000_000;
  const noggins = openings.map(opening => ({
    ventId: opening.id,
    quantity: 2,
    lengthMM: opening.bayMM - rafterThicknessMM,
    faceplatesPerNoggin: 2,
    faceHeightMM: 220,
  }));
  return { active: true, openings, positions, automaticPositions, lockedCentresMM, areaM2, noggins };
}

// Keep previously saved arrow offsets relative to their original layout.
function legacyVentPitch(width, vents) {
  const count = vents.length;
  let pitchBetween = width / (count + 1);
  if (count > 1) {
    let minimumPitch = 0;
    for (let index = 1; index < count; index += 1) {
      minimumPitch = Math.max(minimumPitch, (vents[index - 1].bayMM + vents[index].bayMM) / 2 + minimumGapMM);
    }
    const maximumPitch = (width - Math.max(vents[0].bayMM, vents[count - 1].bayMM) - 2 * minimumGapMM) / (count - 1);
    if (minimumPitch > maximumPitch) return null;
    pitchBetween = Math.min(maximumPitch, Math.max(minimumPitch, pitchBetween));
  }
  return pitchBetween;
}
