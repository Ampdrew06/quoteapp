import {buildVictorianHippedGeometry as build,victorianHippedDefaults,victorianHippedDesignDefaults} from './victorianHippedGeometry';

test('new designs have blank dimensions and a 70mm frame',()=>{
 expect(victorianHippedDesignDefaults.widthMM).toBe('');
 expect(victorianHippedDesignDefaults.projMM).toBe('');
 expect(victorianHippedDesignDefaults.frameThicknessMM).toBe(70);
 expect(build({inputs:victorianHippedDesignDefaults}).valid).toBe(false);
});

test('maximum height resolves the shared lean-to pitch for every side configuration',()=>{
 for(const leftEndType of ['victorian','edwardian','wall'])for(const rightEndType of ['victorian','edwardian','wall']){
  const inputs={...victorianHippedDefaults,leftEndType,rightEndType,requestedSidePitchDeg:25,maxFinishedHeightMM:1200};
  const g=build({inputs});
  expect(g.valid).toBe(true);
  expect(g.finishedHeightMM).toBeCloseTo(1200,3);
  expect(g.pitchDeg).toBeLessThan(17);
  expect(build({inputs:{...inputs,maxFinishedHeightMM:200}}).valid).toBe(false);
 }
});
