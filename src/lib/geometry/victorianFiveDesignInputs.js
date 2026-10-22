import {normalizeVictorianDesignInputs,updateVictorianDesignInputs} from './victorianDesignInputs';
export const VICTORIAN_FIVE_DESIGN_KEY='victorianFiveInputs';
export function normalizeVictorianFiveDesignInputs(saved={},customerId='retail'){
 const next=normalizeVictorianDesignInputs(saved,customerId);
 return {...next,roofStyle:'victorian-five',frontFacetCount:5,cornerAnglesDeg:[150,150,150,150,150,150]};
}
export const updateVictorianFiveDesignInputs=(old,key,value)=>normalizeVictorianFiveDesignInputs(updateVictorianDesignInputs(old,key,value),old.selectedCustomerId||'retail');
