import { buildAutomaticRoofTiling } from './automaticRoofTiling';
import { buildAutomaticRoofEdgeBOM } from './automaticRoofEdgeBOM';
import { buildHippedLeanToInsulationAudit } from './insulationIntegrationAudit';
import { buildHippedLathFixingAudit } from './hippedLathFixingAudit';
const build = (extra = {}) => {
 const roofInputs = {roofStyle:'hippedLeanTo',tileSystem:'britmet',leftHip:true,rightHip:true,widthMM:4050,projMM:2885,pitchDeg:15,soffit_mm:150,leftHipWidthMM:1443,rightHipWidthMM:1443,sideSoffitMode:'specified',specifiedSideSoffitMM:100,...extra};
 const automatic=buildAutomaticRoofTiling({roofInputs});
 const insulationAudit=buildHippedLeanToInsulationAudit({roofInputs,geometry:automatic.geometry});
 const edge=buildAutomaticRoofEdgeBOM({roofInputs,automaticRoofTiling:automatic});
 const args={roofInputs,geometry:automatic.geometry,automaticResult:automatic.result,insulationAudit,edgeModel:edge.edgeModel};
 return {args,result:buildHippedLathFixingAudit(args)};
};
test('ordered roof includes both side facets and separate internal/external supply boxes',()=>{
 const {result}=build();
 expect(result.valid).toBe(true);
 expect(result.internalScrews).toBe(86);
 expect(result.externalRowScrews).toBe(141);
 expect(result.supportScrews).toBe(36);
 expect(result.perimeterScrews).toBe(52);
 expect(result.externalScrews).toBe(229);
 expect(result.internalBoxes).toBe(1);
 expect(result.externalBoxes).toBe(1);
 expect(result.rows.filter(r=>r.facet==='left').length>0).toBe(true);
 expect(result.rows.filter(r=>r.facet==='right').length>0).toBe(true);
});
test('jack reach reduces intersections as rows approach the apex',()=>{
 const {result}=build();
 const rows=result.rows.filter(r=>r.facet==='left'&&r.use==='external');
 expect(rows[0].screws).toBe(5);
 expect(rows[rows.length-1].screws).toBe(2);
});
test('steel support fixings use full hip length at 500mm centres plus ends',()=>{
 const {args}=build();
 const result=buildHippedLathFixingAudit({...args,edgeModel:{valid:true,edges:[{id:'hip',kind:'hip',lengthMM:3679}]}});
 expect(result.supportScrews).toBe(18);
 expect(result.supportRows[0].laths).toBe(2);
});
test('slate omits steel hip support fixings while retaining facet and perimeter allowances',()=>{
 const {result}=build({tileSystem:'liteslate'});
 expect(result.valid).toBe(true);
 expect(result.supportScrews).toBe(0);
 expect(result.externalRowScrews>0).toBe(true);
 expect(result.perimeterScrews).toBe(52);
});
test('larger roofs require extra boxes and missing data cannot invent an allowance',()=>{
 const {result}=build({widthMM:7040,projMM:2910,leftHipWidthMM:1600,rightHipWidthMM:1600});
 expect(result.externalScrews>250).toBe(true);
 expect(result.externalBoxes).toBe(2);
 expect(buildHippedLathFixingAudit().valid).toBe(false);
 const {args}=build();
 expect(buildHippedLathFixingAudit({...args,spacingMM:0}).valid).toBe(false);
 expect(buildHippedLathFixingAudit({...args,geometry:{...args.geometry,plainRafterCount:99}}).valid).toBe(false);
});
