import {buildVictorianGeometry} from '../../lib/geometry/victorianGeometry';
import {buildVictorianFiveGeometry} from '../../lib/geometry/victorianFiveGeometry';
import {victorianPlanSetout} from './VictorianManufacturePlan';
const inputs={widthMM:3332,projMM:3399,pitchDeg:25,soffitMM:150,victorianFacetGeometry:{mode:'lengths',leftSideMM:2425,leftChamferMM:1380,frontMM:1375,rightChamferMM:1380,rightSideMM:2425,toleranceMM:2}};
test('dimension chains close to the actual measured facet lengths',()=>{
 const g=buildVictorianGeometry({inputs});expect(g.valid).toBe(true);
 const rows=victorianPlanSetout(g);expect(rows).toHaveLength(5);
 rows.forEach(f=>expect(f.gaps.reduce((n,r)=>n+r.lengthMM,0)).toBeCloseTo(f.lengthMM,8));
 expect(rows[2].lengthMM).toBe(1375);
});
test('manual truss and jack positions are retained in setting-out dimensions',()=>{
 const g=buildVictorianGeometry({inputs:{...inputs,victorianRearTrussPositionsMM:[600,1200],victorianFacetPositionsMM:{'facet-2':[350,950]}}});
 expect(g.valid).toBe(true);const rows=victorianPlanSetout(g);
 expect(rows[0].members.some(r=>r.positionMM===600)).toBe(true);
 expect(rows[1].members[0].positionMM).toBeCloseTo(350,8);
 expect(rows[1].members[1].positionMM).toBeCloseTo(950,8);
});
test('the seven-facet book uses seven complete chains and ringbeam references',()=>{
 const g=buildVictorianFiveGeometry({inputs:{widthMM:3800,projMM:4200,pitchDeg:25,soffitMM:150}}),rows=victorianPlanSetout(g);
 expect(rows).toHaveLength(7);expect(rows[6].reference).toBe('RB7');
 rows.forEach(f=>expect(f.gaps.reduce((n,r)=>n+r.lengthMM,0)).toBeCloseTo(f.lengthMM,8));
});
