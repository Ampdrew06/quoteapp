import {buildSteelTileCourseAudit} from './steelTileCourseAudit';
import {buildAutomaticRoofTiling} from './automaticRoofTiling';
import {calculateRoofTiling} from './facetTilingCalc';
const simple=facets=>({productId:'britmetShingle',result:calculateRoofTiling({product:'britmetShingle',facets})});
const factory=()=>buildAutomaticRoofTiling({roofInputs:{widthMM:4050,projMM:2885,pitchDeg:15,soffit_mm:150,
 roofStyle:'hippedLeanTo',hippedSides:'both',leftHip:true,rightHip:true,leftHipWidthMM:1442.5,rightHipWidthMM:1442.5,
 sideSoffitMode:'specified',specifiedSideSoffitMM:100,tileSystem:'britmet'},
 materials:{side_frame_thickness_mm:70,fascia_lip_mm:25,frame_on_mm:70}});
test('factory roof exposes 51 current tiles and 53 opened tiles in the separate rectangular carry comparison',()=>{
 const original=factory(),snapshot=JSON.stringify(original);
 const a=buildSteelTileCourseAudit({automaticRoofTiling:original,minimumStarterMM:0});
 expect(a.valid).toBe(true);expect(a.readOnly).toBe(true);
 expect(a.currentOrderedTiles).toBe(51);
 expect(a.rectangularCarryTiles).toBe(53);
 expect(a.rectangularCarryOrder).toBe(55);
 expect(a.independentCourseTiles).toBe(67);
 expect(a.facets.map(f=>f.newTiles)).toEqual([11,31,11]);
 expect(a.rows).toHaveLength(29);
 expect(a.staggerComplete).toBe(true);expect(a.staggerTiles).toBe(53);expect(a.staggerOrder).toBe(55);
 expect(a.facets.map(f=>f.stagger.alternateStarts)).toEqual([0,0,0]);
 a.facets.forEach(f=>f.stagger.rows.forEach((r,i)=>{if(i>0)r.jointsMM.forEach(x=>expect(f.stagger.rows[i-1].jointsMM.includes(x)).toBe(false));}));
 expect(JSON.stringify(original)).toBe(snapshot);
});
test('a right-to-left remainder supplies the next row instead of reopening a full tile',()=>{
 const a=buildSteelTileCourseAudit({automaticRoofTiling:simple([{id:'rect',label:'Rectangle',baseWidthMM:600,topWidthMM:600,heightMM:400,pitchDeg:15}])});
 expect(a.facets[0].rows.map(r=>r.newTiles)).toEqual([1,0]);
 expect(a.facets[0].rows[0].carriedOutMM).toBe(645);
 expect(a.facets[0].finalRemainderMM).toBe(45);
 expect(a.rectangularCarryTiles).toBe(1);
});
test('remainders are not silently transferred to another facet',()=>{
 const a=buildSteelTileCourseAudit({automaticRoofTiling:simple(['left','right'].map(id=>({id,label:id,baseWidthMM:600,topWidthMM:600,heightMM:200,pitchDeg:15})))});
 expect(a.rectangularCarryTiles).toBe(2);
 expect(a.facets.map(f=>f.rows[0].carriedInMM)).toEqual([0,0]);
});
test('course comparison covers the wider edge for both taper directions and conserves cover length',()=>{
 for(const [baseWidthMM,topWidthMM] of [[1500,300],[300,1500]]) {
  const a=buildSteelTileCourseAudit({automaticRoofTiling:simple([{id:'taper',label:'Taper',baseWidthMM,topWidthMM,heightMM:900,pitchDeg:15}])});
  a.rows.forEach(r=>{
   expect(r.requiredWidthMM).toBe(Math.max(r.startWidthMM,r.endWidthMM));
   expect(r.carriedInMM+r.newTiles*a.coverWidthMM-r.requiredWidthMM).toBeCloseTo(r.carriedOutMM,8);
   expect(r.carriedOutMM).toBeGreaterThanOrEqual(0);
  });
  const f=a.facets[0];expect(f.newTiles*a.coverWidthMM).toBeCloseTo(f.rectangularCoverMM+f.finalRemainderMM,8);
 }
});
test('endpoint reference distinguishes the wallbar top joint from the boss centre',()=>{
 const a=buildSteelTileCourseAudit({automaticRoofTiling:factory()});
 expect(a.endpointChecks).toHaveLength(2);
 const r=a.endpointChecks[0];expect(r.topJointPositionMM).toBeCloseTo(1415.3347433,6);
 expect(r.bossCentrePositionMM).toBeCloseTo(1442.5,6);
 expect(r.wallbarPlusExtensionMM).toBeCloseTo(r.wallbarExternalSlopeMM+r.tileExtensionSlopeMM,8);
 expect(r.differenceMM).toBeGreaterThan(0);
});
test('rejects slate, invalid courses and openings instead of producing a cutting claim',()=>{
 expect(buildSteelTileCourseAudit({automaticRoofTiling:{productId:'liteSlate'}}).valid).toBe(false);
 const a=simple([{id:'r',label:'R',baseWidthMM:1000,topWidthMM:1000,heightMM:800,pitchDeg:15}]);
 a.result.facets[0].courses[0].startWidthMM=-1;
 expect(buildSteelTileCourseAudit({automaticRoofTiling:a}).valid).toBe(false);
 const b=factory();b.result.facets[0].facet.openings=[{widthMM:100}];
 expect(buildSteelTileCourseAudit({automaticRoofTiling:b}).valid).toBe(false);
});

test('defaults to the confirmed 200mm cover minimum rather than 295mm of cover',()=>{
 const a=buildSteelTileCourseAudit({automaticRoofTiling:factory()});
 expect(a.minimumStarterMM).toBe(200);
 a.facets.forEach(f=>f.stagger.rows.filter(r=>r.starterSourceRow!==null).forEach(r=>expect(r.carriedInMM).toBeGreaterThanOrEqual(200)));
});

test('projects Britmet mitred offcuts over 300mm without deducting the envelope allowance twice',()=>{
 const original=factory(),snapshot=JSON.stringify(original);
 const a=buildSteelTileCourseAudit({automaticRoofTiling:original});
 a.facets.forEach(f=>f.physicalOffcuts.forEach(p=>{
  expect(p.valid).toBe(true);expect(p.tileDepthMM).toBe(300);
  expect(p.visibleCoverageMM).toBeCloseTo(p.nominalRemainderMM,2);
  expect(p.squareLengthMM).toBeCloseTo(p.visibleCoverageMM+95,6);
 }));
 expect(JSON.stringify(original)).toBe(snapshot);
});
test('completes the original factory roof when front row three needs a new starter tile',()=>{
 const a=buildSteelTileCourseAudit({automaticRoofTiling:factory()});
 expect(a.staggerComplete).toBe(true);expect(a.staggerTiles).toBe(54);expect(a.staggerOrder).toBe(56);
 expect(a.currentOrderedTiles).toBe(51);
 const front=a.facets.find(f=>f.id==='facet-front');
 expect(front.stagger.rows[2].source).toBe('starter cut from new tile');
 a.facets.forEach(f=>f.stagger.rows.forEach((r,i)=>{if(i>0)r.jointsMM.forEach(x=>expect(f.stagger.rows[i-1].jointsMM.includes(x)).toBe(false));}));
 const lastSide=a.facets[0].stagger.rows[7];
 expect(lastSide.carriedInMM).toBeGreaterThanOrEqual(200);
 expect(lastSide.starterLengthMM).toBeLessThan(200);
});
