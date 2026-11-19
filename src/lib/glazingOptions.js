// Liteleader supplier costs from Vent Prices March 26, plus order carriage.
export const roofVentOptions = [
  { widthMM: 550, heightMM: 780, finish: 'Pine', code: 'DVYC2AB900', cost: 155.74 },
  { widthMM: 550, heightMM: 780, finish: 'White Painted', code: 'AAYC2AB910', cost: 170.75 },
  { widthMM: 550, heightMM: 780, finish: 'PVC', code: 'APYC2AB900', cost: 203.55 },
  { widthMM: 550, heightMM: 980, finish: 'Pine', code: 'DVYC4AB900', cost: 167.88 },
  { widthMM: 550, heightMM: 980, finish: 'White Painted', code: 'AAYC4AB910', cost: 184.06 },
  { widthMM: 550, heightMM: 980, finish: 'PVC', code: 'APYC4AB900', cost: 218.69 },
  { widthMM: 780, heightMM: 980, finish: 'Pine', code: 'DVYM4AB900', cost: 183.73 },
  { widthMM: 780, heightMM: 980, finish: 'White Painted', code: 'AAYM4AB910', cost: 202.20 },
  { widthMM: 780, heightMM: 980, finish: 'PVC', code: 'APYM4AB900', cost: 238.31 },
];

export const slateFlashing = [
  { widthMM: 550, heightMM: 780, code: 'SFXC2A', cost: 42.52 },
  { widthMM: 550, heightMM: 980, code: 'SFXC4A', cost: 44.77 },
  { widthMM: 780, heightMM: 980, code: 'SFXM4A', cost: 48.67 },
];

export const glazingDimensions = ({ widthMM, heightMM }) => `${widthMM} × ${heightMM} mm`;
export const glazingPriceKey = code => `glazing_${code.toLowerCase()}_cost`;

export const glazingElements = [
  ...roofVentOptions.map(item => ({
    ...item,
    key: glazingPriceKey(item.code),
    label: `Roof vent · ${glazingDimensions(item)} · ${item.finish}`,
  })),
  ...slateFlashing.map(item => ({
    ...item,
    key: glazingPriceKey(item.code),
    label: `Slate flashing kit · ${glazingDimensions(item)}`,
  })),
  { key: glazingPriceKey('ZCA200'), label: 'Telescopic pole opener', code: 'ZCA200', cost: 26.01 },
  { key: 'glazing_vent_carriage_cost', label: 'Roof vent carriage (once per order)', cost: 29.95 },
];

export const defaultGlazingCosts = Object.fromEntries(
  glazingElements.map(({ key, cost }) => [key, cost])
);

export const defaultGlazingSettings = {
  ...defaultGlazingCosts,
  glazing_vent_margin_pct: 25,
};
