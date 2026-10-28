import {buildVictorianGeometry} from './victorianGeometry';
import {buildVictorianFiveGeometry} from './victorianFiveGeometry';
import {buildVictorianSummaryMaterialsModel} from '../Calculations/victorianSummaryMaterialsModel';
import {buildVictorianTrussSchedule} from '../Manufacturing/victorianTrussSchedule';
const base={widthMM:3392,projMM:3605,pitchDeg:25,soffitMM:150,soffitMode:'standard'};

describe.each([[3,buildVictorianGeometry],[5,buildVictorianFiveGeometry]])('%i-facet Victorian soffits',(count,geometryBuilder)=>{
 const inputs=patch=>({...base,cornerAnglesDeg:Array(count+1).fill(count===3?135:150),...patch});
 test.each([15,25,30])('80mm side envelope reaches plan, cuts and supplies at %i degrees',pitchDeg=>{
  const source=inputs({pitchDeg,sideSoffitMode:'specified',specifiedSideSoffitMM:80}),before=JSON.stringify(source);
  const model=buildVictorianSummaryMaterialsModel({inputs:source,geometryBuilder});
  expect(model.valid).toBe(true);
  const g=model.audits.geometry,truss=buildVictorianTrussSchedule({geometry:g});
  expect(g.plyBaseWidthMM).toBeCloseTo(135,6);
  expect(g.externalWidthMM).toBeCloseTo(g.widthMM+270,6);
  expect(truss.truss.members[0].hfcMM).toBeCloseTo(133,6);
  expect(g.eaves.referenceBaseWidthMM).toBeCloseTo(g.plyBaseWidthMM,6);
  expect(model.audits.plastics.soffit.stripWidthMM).toBe(65);
  expect(JSON.stringify(source)).toBe(before);
  const reopened=buildVictorianSummaryMaterialsModel({inputs:JSON.parse(before),geometryBuilder});
  expect(reopened.materialsCostForPricing).toBe(model.materialsCostForPricing);
 });
 test('no soffit retains fascia lip but supplies no soffit boards or trims',()=>{
  const model=buildVictorianSummaryMaterialsModel({inputs:inputs({sideSoffitMode:'none'}),geometryBuilder});
  expect(model.valid).toBe(true);
  expect(model.audits.geometry.plyBaseWidthMM).toBe(95);
  expect(model.audits.plastics.soffit.order).toEqual([]);
  for(const key of ['j_trim','h_trim'])expect(model.audits.plastics.plasticLines.find(r=>r.key===key).qty).toBe(0);
 });
 test('empty or physically too small restrictions are rejected',()=>{
  for(const size of ['',-1,0,10])expect(geometryBuilder({inputs:inputs({sideSoffitMode:'specified',specifiedSideSoffitMM:size})}).valid).toBe(false);
 });
});
