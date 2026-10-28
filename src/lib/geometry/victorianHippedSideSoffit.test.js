import {buildVictorianHippedGeometry as build,victorianHippedDefaults} from './victorianHippedGeometry';
import {buildVictorianHippedSummaryMaterialsModel} from '../Calculations/victorianHippedSummaryMaterialsModel';
import {getMaterials} from '../materials';
const materials=getMaterials(),base={...victorianHippedDefaults,requestedSidePitchDeg:25};
test('automatic retains the existing front-led eaves calculation',()=>{
 const a=build({inputs:base,materials}),b=build({inputs:{...base,sideSoffitMode:'automatic'},materials});expect(JSON.stringify(a)).toBe(JSON.stringify(b));
});
test('required side size uses the regular hipped envelope and aligns all five eaves',()=>{
 const inputs={...base,sideSoffitMode:'specified',sideSoffitControlSide:'left',specifiedSideSoffitMM:80},g=build({inputs,materials});expect(g.valid).toBe(true);
 expect(g.eaves.rows.find(r=>r.facetId==='F1').plyBaseWidthMM).toBe(135);
 expect(g.eaves.rows.every(r=>Math.abs(r.finishedHeightMM-g.eaves.rows[0].finishedHeightMM)<.01)).toBe(true);
 const m=buildVictorianHippedSummaryMaterialsModel({inputs,materials});expect(m.valid).toBe(true);expect(m.audits.plastics.runs.find(r=>r.edgeId==='F1').soffitGeometryMM).toBe(65);
});
test('a controlling wall side falls back to the active side and blank sizes are rejected',()=>{
 const g=build({inputs:{...base,leftEndType:'wall',sideSoffitMode:'specified',sideSoffitControlSide:'left',specifiedSideSoffitMM:80},materials});expect(g.valid).toBe(true);expect(g.eaves.sideSoffitControl.side).toBe('right');
 expect(build({inputs:{...base,sideSoffitMode:'specified',specifiedSideSoffitMM:''},materials}).valid).toBe(false);
});
