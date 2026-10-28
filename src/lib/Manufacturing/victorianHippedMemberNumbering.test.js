import {buildVictorianHippedGeometry,victorianHippedDefaults} from '../geometry/victorianHippedGeometry';
import {buildVictorianHippedMemberSchedule} from './victorianHippedMemberSchedule';
import {buildVictorianHippedWallplateSchedule} from './victorianHippedWallplateSchedule';
import {buildVictorianHippedRingBeamProfiles} from './victorianHippedRingBeamProfiles';

test('one counter-clockwise R sequence covers every member and ringbeam for all side configurations',()=>{
 for(const leftEndType of ['victorian','edwardian','wall'])for(const rightEndType of ['victorian','edwardian','wall']){
  const inputs={...victorianHippedDefaults,requestedSidePitchDeg:25,leftEndType,rightEndType},geometry=buildVictorianHippedGeometry({inputs});
  expect(geometry.valid).toBe(true);
  const {entries,byId}=geometry.manufactureNumbering;
  expect(entries[0].id).toBe(leftEndType==='wall'?'WL':'WB1');
  expect(entries.map(e=>e.reference)).toEqual(entries.map((e,i)=>`R${i+1}`));
  expect(new Set(entries.map(e=>e.id)).size).toBe(entries.length);
  const wp=entries.findIndex(e=>e.id==='WP1');
  expect(entries[wp-1].id).toBe(rightEndType==='wall'?'WR':'WB2');
  expect(entries.slice(wp+1).map(e=>e.id)).toEqual(geometry.facets.map(f=>`ring:${f.id}`));
  for(const m of buildVictorianHippedMemberSchedule({geometry,inputs}).members)expect(m.ref).toBe(byId[m.id]);
  expect(buildVictorianHippedWallplateSchedule({geometry}).horizontal.ref).toBe(byId.WP1);
  for(const b of buildVictorianHippedRingBeamProfiles({geometry,inputs}).beams)expect(b.reference).toBe(byId[`ring:${b.facetId}`]);
 }
});
