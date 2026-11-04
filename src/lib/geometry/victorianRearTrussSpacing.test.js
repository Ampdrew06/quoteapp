import {buildCombinationGeometry} from './combinationGeometry';
import {buildEdwardianGeometry} from './edwardianGeometry';
import {getMaterials} from '../materials';

test('automatic rear bays retain 665mm set-out around the fixed boss truss without moving manual centres',()=>{
 const inputs={widthMM:3800,projMM:4000,pitchDeg:25,leftSide:'edwardian',rightSide:'victorian'};
 const materials=getMaterials(),g=buildCombinationGeometry({inputs,materials});
 expect(g.valid).toBe(true);
 const ed=buildEdwardianGeometry({inputs,materials});
 expect(g.trusses.map(t=>t.positionMM)).toEqual(ed.layout.centresMM);
 expect(g.trusses.map(t=>t.positionMM)).toEqual([31.5,696.5,1361.5,1714.25,2067]);
 expect(g.layout.gapsMM.every(gap=>gap<=665)).toBe(true);
 const manual=buildCombinationGeometry({inputs:{...inputs,combinationRearTrussPositionsMM:[697,1362]},materials});
 expect(manual.trusses.map(t=>t.positionMM)).toEqual([31.5,697,1362,2067]);
 expect(manual.rafterWarnings.some(w=>w.includes('rear truss bay'))).toBe(true);
});
