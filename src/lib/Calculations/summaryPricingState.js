const readObject = (storage, key) => {
  try { const value=JSON.parse(storage.getItem(key)||'{}'); return value && typeof value==='object' && !Array.isArray(value) ? value : {}; }
  catch { return {}; }
};
export function readSummaryPricingState(storage=globalThis.localStorage) {
  return { exclusions:readObject(storage,'summary_exclusions'), adjustments:readObject(storage,'summary_adjustments') };
}
export function persistSummaryPricingState(storage=globalThis.localStorage) {
  const inputs=readObject(storage,'leanToInputs');
  storage.setItem('leanToInputs',JSON.stringify({...inputs,summaryPricingState:readSummaryPricingState(storage)}));
}
export function restoreSummaryPricingState(inputs, storage=globalThis.localStorage) {
  const state=inputs?.summaryPricingState || {};
  for(const [key,value] of [['summary_exclusions',state.exclusions],['summary_adjustments',state.adjustments]])
    storage.setItem(key,JSON.stringify(value && typeof value==='object' && !Array.isArray(value)?value:{}));
  // Old cash deltas are not used by the new row-based calculation.
  storage.removeItem('summary_exclusion_values');
  storage.removeItem('summary_adjustment_values');
}
