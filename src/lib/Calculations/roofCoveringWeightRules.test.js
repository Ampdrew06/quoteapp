import {installedMainTileWeight,installedHipTileWeight,fixedInstalledWeight} from './roofCoveringWeightRules';
test('installed main covering excludes spare order quantities',()=>{
 const args={productId:'britmetShingle',facets:[{areaM2:10,pitchDeg:15}],materials:{tile_britmet_weight_kg:2,tile_britmet_tiles_per_m2:3.2}};
 expect(installedMainTileWeight(args)).toBe(64);
 expect(installedMainTileWeight({...args,materials:{...args.materials,tile_britmet_weight_kg:0}})).toBe(0);
 expect(installedMainTileWeight({...args,materials:{}})).toBeNull();
});
test('a half allocation adds no spare half to installed weight',()=>{
 expect(installedHipTileWeight({steel:true,edges:[{allocationTiles:2.5,qty:3}],kgEach:1.6})).toBe(4);
 expect(fixedInstalledWeight({key:'touchup',qty:1,weightEachKg:.3},0).weightEachKg).toBe(0);
});
