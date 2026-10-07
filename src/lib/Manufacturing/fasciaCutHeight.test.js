import { calculateFasciaCutHeight } from './fasciaCutHeight';
test('uses the confirmed factory allowances and rounds before deducting clearance',()=>{
 expect(calculateFasciaCutHeight(233.7)).toEqual({structuralHeightMM:233.7,soffitAllowanceMM:10,lipMM:10,starterClearanceMM:5,fullExternalHeightMM:254,externalCutHeightMM:249,coverageHeightMM:239});
 expect(calculateFasciaCutHeight(234).externalCutHeightMM).toBe(249);
 expect(calculateFasciaCutHeight(234.1).externalCutHeightMM).toBe(250);
});
test('invalid height does not create a fascia cut requirement',()=>{
 for(const value of [0,-1,null,undefined,NaN])expect(calculateFasciaCutHeight(value)).toBe(null);
});
