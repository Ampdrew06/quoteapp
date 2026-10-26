import {buildVictorianHippedGeometry as build,victorianHippedDefaults as inputs} from './victorianHippedGeometry';

test('Victorian Hipped defaults resolve five support layouts with fixed hips and bosses',()=>{
 const g=build({inputs});
 expect(g.valid).toBe(true);expect(g.facets).toHaveLength(5);expect(g.hips).toHaveLength(4);expect(g.bosses).toHaveLength(2);
 expect(g.rafterLayout.facets).toHaveLength(5);
 expect(g.rafterLayout.counts).toEqual({bossRafters:4,rafters:3,jacks:6,total:13});
 expect(g.rafterLayout.facets[0].positionsMM).toEqual([690,1355]);
 expect(g.rafterLayout.facets[4].positionsMM).toEqual([690,1355]);
});

test('angled boss rafters use their own geometric pitch and share the boss height',()=>{
 const g=build({inputs}),member=g.rafterLayout.members.find(r=>r.facetId==='F2'&&r.role==='boss-rafter');
 expect(member.bossId).toBe('BL');expect(member.startHeightMM).toBeCloseTo(g.riseMM,7);
 expect(Math.abs(member.pitchDeg-g.facets[1].pitchDeg)).toBeGreaterThan(0.1);
 expect(member.geometricSlopeMM).toBeCloseTo(Math.hypot(member.planLengthMM,g.riseMM),7);
});

test('manual facet positions update connections without moving hips or bosses',()=>{
 const auto=build({inputs}),positions=auto.rafterLayout.facets[2].positionsMM.map(p=>Math.abs(p-1075)<0.01?p+100:p);
 const edited=build({inputs:{...inputs,victorianHippedFacetPositionsMM:{F3:positions,F4:[]}}});
 expect(edited.valid).toBe(true);expect(edited.hips).toEqual(auto.hips);expect(edited.bosses).toEqual(auto.bosses);
 expect(edited.rafterLayout.facets[2].counts.bossRafters).toBe(1);expect(edited.rafterLayout.facets[3].members).toHaveLength(0);
});

test('right side centres are measured from the wall and invalid slots are rejected',()=>{
 const g=build({inputs:{...inputs,victorianHippedFacetPositionsMM:{F5:[900,1600]}}});
 expect(g.valid).toBe(true);expect(g.rafterLayout.facets[4].members[0].end.yMM).toBeCloseTo(900,7);
 for(const positions of [[40],[700,730],[''],[100000]])expect(build({inputs:{...inputs,victorianHippedFacetPositionsMM:{F3:positions}}}).valid).toBe(false);
});

test('clearing facet overrides restores automatic positions',()=>{
 const auto=build({inputs}),restored=build({inputs:{...inputs,victorianHippedFacetPositionsMM:{F1:null,F2:null,F3:null,F4:null,F5:null}}});
 expect(restored.rafterLayout).toEqual(auto.rafterLayout);
});
