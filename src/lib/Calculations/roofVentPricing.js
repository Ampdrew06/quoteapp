import { defaultGlazingSettings, glazingDimensions, glazingPriceKey, roofVentOptions, slateFlashing } from '../glazingOptions';

export const roofVentLabel = option => `${glazingDimensions(option)} · ${option.finish}`;

function selectedRoofVents(quantities) {
  return roofVentOptions.flatMap(option => {
    const quantity = Number(quantities?.[option.code]);
    return Number.isSafeInteger(quantity) && quantity > 0 ? [{ ...option, quantity }] : [];
  });
}

function roofVentSupplyLines(selections) {
  const lines = new Map();
  const addLine = (key, label, quantity) => {
    const previous = lines.get(key);
    lines.set(key, { key, label, quantity: (previous?.quantity ?? 0) + quantity, batches: [...(previous?.batches ?? []), quantity] });
  };
  for (const item of selections) {
    const kit = slateFlashing.find(kit => kit.widthMM === item.widthMM && kit.heightMM === item.heightMM);
    addLine(glazingPriceKey(item.code), `Roof vent · ${roofVentLabel(item)}`, item.quantity);
    addLine(glazingPriceKey(kit.code), `Slate flashing kit · ${glazingDimensions(kit)}`, item.quantity);
  }
  if (selections.length) addLine(glazingPriceKey('ZCA200'), 'Telescopic pole opener', 1);
  return [...lines.values()];
}

export function roofVentSupplies(quantities) {
  return roofVentSupplyLines(selectedRoofVents(quantities)).map(({key, label, quantity}) => ({key, label, quantity}));
}

export function calculateRoofVentPricing(quantities, materials, pitchDeg) {
  const selections = selectedRoofVents(quantities);
  const count = selections.reduce((total, item) => total + item.quantity, 0);
  const specification = selections.map(item => `${item.quantity} × ${roofVentLabel(item)}`).join('; ');
  if (!count) return { count, specification, net: 0 };
  if (Number(pitchDeg) < 15 || Number(pitchDeg) > 90) {
    return { count, specification, error: 'Liteleader roof vents require a roof pitch of 15° to 90°.' };
  }

  const read = key => {
    const value = materials?.[key] ?? defaultGlazingSettings[key];
    return value === '' ? NaN : Number(value);
  };
  const margin = read('glazing_vent_margin_pct');
  const costs = [
    ...roofVentSupplyLines(selections),
    { key: 'glazing_vent_carriage_cost', label: 'Vent supplier carriage', quantity: 1, batches: [1] },
  ].map(({batches, ...line}) => {
    const unitCost = read(line.key);
    return { ...line, unitCost, costPence: batches.reduce((sum, qty) => sum + Math.round(unitCost * qty * 100), 0) };
  });
  if (!Number.isFinite(margin) || margin < 0 || margin >= 100 || costs.some(({unitCost,costPence}) => !Number.isSafeInteger(costPence) || unitCost < 0)) {
    return { count, specification, error: 'Check the selected vent costs and gross margin in Materials → Glazing Options.' };
  }
  const cost = costs.reduce((total, line) => total + line.costPence, 0) / 100;
  const rows = costs.map(({costPence,...line}) => ({...line, cost:costPence/100}));
  return { count, specification, cost, rows, margin, net: Number((cost / (1 - margin / 100)).toFixed(2)) };
}

export function addRoofVentPricing(roof, vents) {
  if (!vents.net) return roof;
  const net = roof.net + vents.net;
  return { ...roof, net, retailNet: roof.retailNet + vents.net, vat: net * roof.vatRate, gross: net * (1 + roof.vatRate) };
}
