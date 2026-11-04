import {buildCombinationGeometry} from './combinationGeometry';
import {buildEdwardianGeometry} from './edwardianGeometry';
import {buildVictorianGeometry} from './victorianGeometry';
const inputs={widthMM:4000,projMM:3000,pitchDeg:25,soffitMM:150};
test('matching sides retain the existing template dimensions',()=>{
 for(const side of ['edwardian','victorian']){
  const g=buildCombinationGeometry({inputs:{...inputs,leftSide:side,rightSide:side}});
  const reference=(side==='edwardian'?buildEdwardianGeometry:buildVictorianGeometry)({inputs});
  expect(g.valid).toBe(true);
  for(const key of ['externalWidthMM','externalProjectionMM','finishedHeightMM','riseMM'])expect(g[key]).toBeCloseTo(reference[key],7);
  if(side==='victorian')g.facets.forEach((f,i)=>{expect(f.internalLengthMM).toBeCloseTo(reference.facets[i].internalLengthMM,7);expect(f.externalLengthMM).toBeCloseTo(reference.facets[i].externalLengthMM,7);});
 }
});
test('mixed sides mirror and retain equal pitches with square rear corners',()=>{
 const a=buildCombinationGeometry({inputs:{...inputs,leftSide:'edwardian',rightSide:'victorian'}});
 const b=buildCombinationGeometry({inputs:{...inputs,leftSide:'victorian',rightSide:'edwardian'}});
 expect(a.valid&&b.valid).toBe(true);expect(a.facets).toHaveLength(4);
 a.facets.forEach((f,i)=>{expect(f.pitchDeg).toBeCloseTo(25,7);expect(f.internalLengthMM).toBeCloseTo(b.facets[3-i].internalLengthMM,7);expect(f.externalLengthMM).toBeCloseTo(b.facets[3-i].externalLengthMM,7);});
 expect(a.internalOutline[0]).toEqual({xMM:0,yMM:0});expect(a.internalOutline[a.internalOutline.length-1]).toEqual({xMM:4000,yMM:0});
});
test('missing dimensions and roofs too short for a Victorian front are rejected',()=>{
 expect(buildCombinationGeometry().valid).toBe(false);
 expect(buildCombinationGeometry({inputs:{...inputs,projMM:500}}).valid).toBe(false);
 expect(buildCombinationGeometry({inputs:{...inputs,leftSide:'invalid'}}).valid).toBe(false);
});
