import {integrateSteelTileOrdering,buildIntegratedAutomaticRoofTiling} from './integratedAutomaticRoofTiling';
test('missing/invalid tiling results retain the original diagnostics',()=>{
 for(const audit of [null,{roofStyle:'hippedLeanTo',productId:'britmetShingle',result:null,errors:['Select at least one hip']},{roofStyle:'hippedLeanTo',productId:'britmetShingle',result:{errors:['Invalid facet']}}])expect(integrateSteelTileOrdering(audit)).toBe(audit);
});
test('removing both hips does not dereference a missing tile order',()=>{
 const audit=buildIntegratedAutomaticRoofTiling({roofInputs:{roofStyle:'hippedLeanTo',widthMM:4050,projMM:2885,pitchDeg:15,soffit_mm:150,leftHip:false,rightHip:false,tileSystem:'britmet'}});
 expect(audit.result).toBeNull();expect(audit.errors.length).toBeGreaterThan(0);
});
