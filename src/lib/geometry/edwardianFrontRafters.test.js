import {resolveEdwardianFrontRafters} from './edwardianFrontRafters';
import {buildEdwardianGeometry} from './edwardianGeometry';
import {buildEdwardianMemberAudit} from '../Calculations/edwardianMemberAudit';
import {buildEdwardianMetalMiscAudit} from '../Calculations/edwardianMetalMiscAudit';
const inputs={widthMM:4700,projMM:3200,pitchDeg:20};
const positions=[687,1352,2017,2682,3347,4012];
test('manual WD layout replaces the boss rafter with hip-connected jacks and resolves fittings',()=>{
 const g=buildEdwardianGeometry({inputs:{...inputs,frontRafterPositionsMM:positions}});
 expect(g.valid).toBe(true);
 expect(g.frontRafters.map(r=>r.centreMM)).toEqual(positions);
 const members=buildEdwardianMemberAudit({geometry:g});
 expect(members.valid).toBe(true);
 expect(members.members.filter(m=>m.type==='boss-rafter')).toHaveLength(0);
 expect(members.members.filter(m=>m.type==='front-jack')).toHaveLength(6);
 const metal=buildEdwardianMetalMiscAudit({geometry:g});
 expect(metal.counts.sparHooks).toBe(4);
 expect(metal.counts.jacks).toBe(12);
});
test('overlap and edge collisions are blocked even with a spacing override',()=>{
 for(const positions of [[72],[0],[687,720],[687,687],['']]){
  const r=resolveEdwardianFrontRafters({positions,widthMM:4700,ridgeEndYMM:850,projectionMM:3200,allowWideGaps:true});
  expect(r.valid).toBe(false);
 }
});
test('wide gaps require acknowledgement and remain visible as warnings',()=>{
 expect(buildEdwardianGeometry({inputs:{...inputs,frontRafterPositionsMM:[2350]}}).valid).toBe(false);
 const g=buildEdwardianGeometry({inputs:{...inputs,frontRafterPositionsMM:[2350],frontRafterSpacingOverride:true}});
 expect(g.valid).toBe(true);expect(g.frontRafterWarnings).toHaveLength(1);
});
test('restoring automatic input restores the boss and seven front members',()=>{
 const g=buildEdwardianGeometry({inputs:{...inputs,frontRafterPositionsMM:undefined}});
 expect(g.valid).toBe(true);expect(g.frontRafters).toHaveLength(7);
 expect(g.frontRafters.filter(r=>r.role==='boss-rafter')).toHaveLength(1);
});
