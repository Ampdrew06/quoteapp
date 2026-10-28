import {buildGableQuotation} from './gableQuotation';
import {buildVictorianHippedSummaryMaterialsModel} from './victorianHippedSummaryMaterialsModel';
// Reuse discount/delivery/VAT and the established slate contribution benchmark.
export const buildVictorianHippedQuotation=args=>buildGableQuotation({...args,roofFamily:'victorian-hipped',modelBuilder:buildVictorianHippedSummaryMaterialsModel});
