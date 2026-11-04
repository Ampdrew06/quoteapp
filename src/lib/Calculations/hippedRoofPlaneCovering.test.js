import {buildAutomaticRoofTiling} from './automaticRoofTiling';
import {buildVictorianHippedGeometry} from '../geometry/victorianHippedGeometry';
import {buildVictorianHippedCoveringAudit} from './victorianHippedCoveringAudit';
import {externalFacetAreaM2} from './installedCoveringWeights';
const area=ps=>Math.abs(ps.reduce((n,a,i)=>{const b=ps[(i+1)%ps.length];return n+a.xMM*b.yMM-b.xMM*a.yMM;},0))/2e6;
const base={roofStyle:'hippedLeanTo',widthMM:5500,projMM:3000,pitchDeg:15,soffit_mm:150,leftHip:true,rightHip:true,leftHipWidthMM:1500,rightHipWidthMM:1500};
test('equivalent double-hipped routes develop identical covering polygons and tile orders',()=>{
 for(const tileSystem of ['britmetShingle','metrotileShingle','liteSlate','tapcoSlate']){
  const regular=buildAutomaticRoofTiling({roofInputs:{...base,tileSystem}});
  const geometry=buildVictorianHippedGeometry({inputs:{widthMM:5500,projMM:3000,pitchDeg:15,soffitMM:150,leftEndType:'edwardian',rightEndType:'edwardian',bossInsetMM:1500}});
  const other=buildVictorianHippedCoveringAudit({geometry,productId:tileSystem});
  expect(regular.errors).toEqual([]);expect(other.valid).toBe(true);
  expect(regular.coveringGeometry.roofAreaM2).toBeCloseTo(other.roofAreaM2,9);
  expect(regular.result.tileQuantityOrdered).toBe(other.result.tileQuantityOrdered);
  regular.coveringGeometry.facets.forEach((f,n)=>expect(f.areaM2).toBeCloseTo(other.facets[n].areaM2,9));
  expect(regular.coveringGeometry.facets[0].outline.length).toBe(4);
  expect(externalFacetAreaM2(regular.coveringGeometry.facets)).toBeCloseTo(other.roofAreaM2,9);
 }
});
test('equal plane pitches reproduce outside plan area divided by cosine',()=>{
 const result=buildAutomaticRoofTiling({roofInputs:{...base,widthMM:6000,projMM:2500,leftHipWidthMM:2500,rightHipWidthMM:2500}});
 const s=result.coveringGeometry;expect(s.valid).toBe(true);
 expect(s.roofAreaM2).toBeCloseTo(area(s.domain)/Math.cos(15*Math.PI/180),9);
 expect(s.facets.reduce((n,f)=>n+area(f.points),0)).toBeCloseTo(area(s.domain),9);
});
test('single-hip geometry retains its existing calculation and no-hip stays rejected',()=>{
 expect(buildAutomaticRoofTiling({roofInputs:{...base,rightHip:false}}).coveringGeometry).toBeUndefined();
 expect(buildAutomaticRoofTiling({roofInputs:{...base,leftHip:false,rightHip:false}}).result).toBeNull();
});
