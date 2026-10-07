import {buildCentralBossDesign,isCentralBossDesign,normalizeBossArrangementInputs} from './centralBossDesign';
const inputs={roofStyle:'hippedLeanTo',bossArrangement:'central',widthMM:4050,projMM:2885,pitchDeg:15,eavesOverhangMM:150,sideSoffitMode:'specified',specifiedSideSoffitMM:100};
test('explicit central arrangement resolves one boss with two hips and one front boss rafter',()=>{
 const original={...inputs};const a=buildCentralBossDesign({inputs});
 expect(a.valid).toBe(true);expect(inputs).toEqual(original);
 expect(a.boss.xMM).toBe(2025);expect(a.bossQty).toBe(1);expect(a.hipQty).toBe(2);
 expect(a.frontRafterLayout.bossRafterCount).toBe(1);
 expect(a.frontRafterLayout.allRafters.filter(r=>r.centreMM===2025)).toHaveLength(1);
 expect(a.sidePitchDeg).toBeCloseTo(20.7062785967,8);
 expect(a.gusset.widthMM).toBe(595);expect(a.designIntegrationStatus).toBe('preview');
});
test('central pitches stay geometry-driven despite stale offset controls and input aliases',()=>{
 const a=buildCentralBossDesign({inputs});
 const b=buildCentralBossDesign({inputs:{...inputs,widthMM:undefined,projMM:undefined,internalWidthMM:4050,internalProjectionMM:2885,leftHip:false,rightHip:false,leftHipWidthMM:1000,rightHipWidthMM:1500,requestedLeftSidePitchDeg:40,requestedRightSidePitchDeg:45}});
 expect(b.members).toEqual(a.members);expect(b.frontFoot).toEqual(a.frontFoot);
 expect(b.resolvedInputs.leftHip).toBe(true);expect(b.resolvedInputs.rightHip).toBe(true);
 expect(b.resolvedInputs.leftHipWidthMM).toBe(2025);expect(b.resolvedInputs.requestedLeftSidePitchDeg).toBe(null);
});
test('existing chamfered-lath alignment equalizes outside heights for front and truss feet',()=>{
 const a=buildCentralBossDesign({inputs}),p=15*Math.PI/180,q=a.sidePitchDeg*Math.PI/180;
 const height=(foot,angle)=>foot.vfcMM+25/Math.cos(angle);
 expect(height(a.frontFoot,p)).toBeCloseTo(height(a.sideFoot,q),8);
 expect(a.sideFoot.hfcMM*Math.tan(q)+a.sideFoot.vfcMM).toBeCloseTo(220/Math.cos(q),8);
 expect(a.frontFoot.hfcMM*Math.tan(p)+a.frontFoot.vfcMM).toBeCloseTo(220/Math.cos(p),1);
 expect(a.members[0].hfcMM).toBe(a.sideFoot.hfcMM);
});
test('central input persistence retains the offset configuration without enabling central from unchecked hips',()=>{
 const offset={...inputs,bossArrangement:'offset',leftHip:false,rightHip:false};
 expect(isCentralBossDesign(offset)).toBe(false);
 const backup={leftHip:false,rightHip:true,leftHipWidthMM:1000};
 const a=normalizeBossArrangementInputs({...inputs,leftHip:false,rightHip:false,offsetBossConfiguration:backup});
 expect(a.hippedSides).toBe('both');expect(a.offsetBossConfiguration).toEqual(backup);
 expect(normalizeBossArrangementInputs({...a,bossArrangement:'offset'}).bossArrangement).toBe('offset');
 expect(isCentralBossDesign({...inputs,roofStyle:'leanTo'})).toBe(false);
});
test('resizing moves the sole boss to the new half-span and recalculates side pitches',()=>{
 const a=buildCentralBossDesign({inputs}),b=buildCentralBossDesign({inputs:{...inputs,widthMM:5000}});
 expect(b.valid).toBe(true);expect(b.boss.xMM).toBe(2500);expect(b.sidePitchDeg).toBeLessThan(a.sidePitchDeg);
 expect(b.frontRafterLayout.allRafters.filter(r=>r.role==='boss-rafter')).toHaveLength(1);
});
test('invalid dimensions and missing specified soffit do not produce a misleading preview',()=>{
 for(const input of [{...inputs,widthMM:0},{...inputs,pitchDeg:90},{...inputs,specifiedSideSoffitMM:''}])expect(buildCentralBossDesign({inputs:input}).valid).toBe(false);
});
