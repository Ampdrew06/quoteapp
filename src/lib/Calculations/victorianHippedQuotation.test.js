import {buildVictorianHippedQuotation as build} from './victorianHippedQuotation';
import {victorianHippedDefaults} from '../geometry/victorianHippedGeometry';
import {getMaterials} from '../materials';
const materials={...getMaterials(),gutter_square_corner_135_ext_price:4.37,expanding_foam_roll_price_each:9.3,concrete_screws_price_per_box:19.61,d4_glue_price_per_tub:6.49,screws_1_5x10_price_per_box:3.2,screws_1_5x10_units_per_box:200,spar_hook_rivets_price_per_box:16,spar_hook_rivets_units_per_box:500};
const inputs={...victorianHippedDefaults,requestedSidePitchDeg:25},args={inputs,materials,labourConfig:{dayRate:287.36},markupConfig:{profitPct:60},requirePostcode:false};
test('agreed1.8-day baseline retains the existing reference area and manual overrides',()=>{
 const q=build(args);expect(q.ready).toBe(true);expect(q.labour.minimumDays).toBe(1.8);expect(q.labour.referenceAreaM2).toBe(8.36);expect(q.labour.dayRate).toBe(287.36);
 expect(build({...args,inputs:{...inputs,labourDaysOverride:3.4}}).labour.days).toBe(3.4);
 expect(q.model.decisions.length).toBe(0);
});
test('delivery is added after discount and before VAT',()=>{
 const customer={id:'trade',discountPct:20},q=build({...args,inputs:{...inputs,selectedCustomerId:'trade'},customer});
 expect(q.ready).toBe(true);expect(q.pricing.net).toBeCloseTo((q.model.knownMaterialsCost+q.labour.labourCost)*1.6*.8+q.delivery.deliveryCost,7);
 expect(q.delivery.handlingHours).toBe(1.5);expect(q.pricing.gross).toBeCloseTo(q.pricing.net*(1+q.pricing.vatRate),7);
});
test('slate retains the equivalent Britmet pound contribution',()=>{
 const steel=build(args),slate=build({...args,inputs:{...inputs,tileProductId:'liteSlate'}}),contribution=q=>q.pricing.net-q.model.knownMaterialsCost-q.labour.labourCost-q.delivery.deliveryCost;
 expect(slate.ready).toBe(true);expect(slate.pricing.contributionMatched).toBe(true);expect(contribution(slate)).toBeCloseTo(contribution(steel),7);
});
test('missing rates and a changed delivery postcode block quotation readiness',()=>{
 expect(build({...args,materials:{...materials,britmet_ridge_tile_price_each:null}}).ready).toBe(false);
 expect(build({...args,inputs:{...inputs,deliveryPostcode:'HU73HP',deliveryDistancePostcode:'HU11AA',deliveryDistanceMiles:10}}).ready).toBe(false);
});
