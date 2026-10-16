import {buildGableQuotation} from './gableQuotation';
import {buildEdwardianQuotation} from './edwardianQuotation';
import {buildVictorianQuotation} from './victorianQuotation';
const inputs={widthMM:3392,projMM:3605,pitchDeg:25,leftSoffitMM:150,rightSoffitMM:150,frontOverhangMM:150,soffitMM:50,soffitMode:'specified',tileProductId:'britmetShingle'};
for(const [name,build] of [['Gable',buildGableQuotation],['Edwardian',buildEdwardianQuotation],['Victorian',buildVictorianQuotation]]){
 test(name+' requires a postcode even with a saved customer default distance',()=>{const q=build({inputs:{...inputs,selectedCustomerId:'trade',deliveryPostcode:'   '},customer:{id:'trade',defaultDeliveryMilesOneWay:10,discountPct:20}});expect(q.valid).toBe(true);expect(q.postcodeReady).toBe(false);expect(q.distanceReady).toBe(false);expect(q.ready).toBe(false);});
 test(name+' requires a matching route and accepts verified zero miles',()=>{const base={...inputs,deliveryPostcode:'HU1 1AA',deliveryDistancePostcode:'HU2 2AA',deliveryDistanceMiles:7};expect(build({inputs:base}).distanceReady).toBe(false);expect(build({inputs:{...base,deliveryDistancePostcode:'hu11aa',deliveryDistanceMiles:0}}).distanceReady).toBe(true);expect(build({inputs:{...base,deliveryDistancePostcode:'hu11aa',deliveryDistanceMiles:''}}).distanceReady).toBe(false);});
}
for(const [name,build] of [['Gable',buildGableQuotation],['Edwardian',buildEdwardianQuotation],['Victorian',buildVictorianQuotation]]){
 test(name+' permits admin postcode omission while retaining stale-route protection',()=>{const q=build({inputs:{...inputs,deliveryPostcode:''},requirePostcode:false});expect(q.valid).toBe(true);expect(q.postcodeReady).toBe(true);expect(q.distanceReady).toBe(true);expect(build({inputs:{...inputs,deliveryPostcode:'HU1 1AA',deliveryDistancePostcode:'HU2 2AA',deliveryDistanceMiles:7},requirePostcode:false}).distanceReady).toBe(false);});
}
