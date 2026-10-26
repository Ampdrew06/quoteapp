import {buildVictorianGeometry} from './victorianGeometry';
const base={widthMM:3392,projMM:3605,pitchDeg:25,frameThicknessMM:70,soffitMM:50};
const build=patch=>buildVictorianGeometry({inputs:{...base,...patch}});
test('Leah internal plan closes with three equal front facets and the Edwardian ridge datum',()=>{
 const g=build();expect(g.valid).toBe(true);expect(g.frontLengthMM).toBeCloseTo(1405.0124,2);
 expect(g.facets[0].internalLengthMM).toBeCloseTo(2611.5062,2);
 expect(g.facets[4].internalLengthMM).toBeCloseTo(g.facets[0].internalLengthMM,6);
 expect(g.ridgeEndYMM).toBe(1909);expect(g.terminalTrussCentreMM).toBe(1876);expect(g.layout.trussCount).toBe(4);
 expect(g.hips).toHaveLength(4);expect(g.intermediateBars).toHaveLength(3);
 expect(g.facets.every(f=>Math.abs(f.pitchDeg-25)<1e-8)).toBe(true);
 expect(g.hips.every(h=>Math.abs(h.pitchDeg-23.3)<0.1)).toBe(true);
 expect(g.mitresDeg).toEqual([22.5,22.5,22.5,22.5]);
});
test('50mm soffits drive the actual external offset rather than stale 150mm dimensions',()=>{
 const g=build(),wide=build({soffitMM:150});
 expect(g.nominalFootRunMM).toBe(120);expect(g.externalWidthMM).toBeCloseTo(3612,1);
 expect(g.nominalExternalProjectionMM).toBe(3725);expect(g.externalProjectionMM).toBe(3715);
 expect(wide.externalWidthMM-g.externalWidthMM).toBeCloseTo(230,1);
 expect(wide.externalProjectionMM-g.externalProjectionMM).toBeCloseTo(115,4);
 expect(wide.ridge).toEqual(g.ridge);expect(wide.internalOutline).toEqual(g.internalOutline);
});
test('external edges are parallel offsets and retain the house-wall datum',()=>{
 const g=build();expect(g.externalOutline[0].yMM).toBeCloseTo(0,6);expect(g.externalOutline[5].yMM).toBeCloseTo(0,6);
 g.facets.forEach((f,i)=>{const a=g.externalOutline[i],b=g.externalOutline[i+1],dx=f.end.xMM-f.start.xMM,dy=f.end.yMM-f.start.yMM;expect(dx*(b.yMM-a.yMM)-dy*(b.xMM-a.xMM)).toBeCloseTo(0,4);});
});
test('admin angle changes retain closure and equal front edges, deriving actual facet pitches',()=>{
 const g=build({cornerAnglesDeg:[134,136,135,135]});expect(g.valid).toBe(true);
 expect(g.internalOutline[4].xMM).toBeCloseTo(3392,6);
 g.facets.slice(1,4).forEach(f=>expect(f.internalLengthMM).toBeCloseTo(g.frontLengthMM,6));
 expect(g.facets.some(f=>Math.abs(f.pitchDeg-25)>0.01)).toBe(true);
});
test('invalid and unclosed Victorian inputs cannot produce a plan',()=>{
 for(const patch of [{widthMM:0},{projMM:1000},{pitchDeg:0},{soffitMM:-1},{cornerAnglesDeg:[135,135,135,136]},{cornerAnglesDeg:[150,150,150,150]}])expect(build(patch).valid).toBe(false);
});

test('explicit 150mm site restriction differs from an unrestricted 150mm stock board',()=>{
 const normal=build({soffitMM:150,soffitMode:'standard'}),restricted=build({soffitMM:150,soffitMode:'specified'});
 expect(normal.plyBaseWidthMM).toBe(225);expect(restricted.plyBaseWidthMM).toBe(210);
 expect(normal.facets[0].externalLengthMM-normal.facets[0].internalLengthMM).toBeCloseTo(225*Math.tan(Math.PI/8),6);
 expect(normal.facets[1].externalLengthMM-normal.facets[1].internalLengthMM).toBeCloseTo(450*Math.tan(Math.PI/8),6);
});

test('front support thresholds use internal widths and jack spacing never exceeds 850mm',()=>{
 for(const [L,count] of [[850,0],[850.1,3],[1700,3],[1700.1,0],[2200,0]]){
  const g=build({widthMM:L*(1+Math.SQRT2),projMM:6500});expect(g.valid).toBe(true);expect(g.intermediateBars.length).toBe(count);
  g.facets.slice(1,4).forEach(f=>{const positions=[0,...g.intermediateBars.filter(r=>r.facetId===f.id).map(r=>r.positionMM),...g.jackRafters.filter(r=>r.facetId===f.id).map(r=>r.positionMM),f.internalLengthMM].sort((a,b)=>a-b);for(let i=1;i<positions.length;i++)expect(positions[i]-positions[i-1]).toBeLessThanOrEqual(850+1e-6);});
 }
});
test('Victorian trusses start at 697 and continue at 665 to the fixed boss datum',()=>{
 const g=build();expect(g.layout.centresMM).toEqual([31.5,697,1362,1876]);
});

test('side closing spans up to 850mm need no jack below the boss',()=>{
 const reference=build();expect(reference.jackRafters.filter(r=>['facet-1','facet-5'].includes(r.facetId))).toHaveLength(0);
 for(const [run,count] of [[703,0],[850,0],[850.1,2],[1400,4]]){
  // Regular fronts: shoulder minus ridge = width * (sqrt(2)-1)/2.
  const widthMM=run*2/(Math.SQRT2-1);
  const g=build({widthMM,projMM:7000});expect(g.valid).toBe(true);
  expect(g.jackRafters.filter(r=>['facet-1','facet-5'].includes(r.facetId))).toHaveLength(count);
 }
});

test('confirmed 50mm site envelope uses vertical 210mm upstands with explicit override and no inferred cutoff',()=>{
 const g=build();expect(g.upstandArrangement).toBe('vertical');expect(g.upstandHeightMM).toBe(210);
 expect(build({soffitMM:150,soffitMode:'standard'}).upstandHeightMM).toBe(195);
 expect(build({soffitMM:60}).upstandArrangement).toBe('pitched');
 expect(build({upstandArrangement:'pitched'}).upstandHeightMM).toBe(195);
 expect(build({soffitMM:60,upstandArrangement:'vertical'}).upstandHeightMM).toBe(210);
 expect(build({upstandArrangement:'unknown'}).valid).toBe(false);
 const pitched=build({upstandArrangement:'pitched'});expect(g.internalOutline).toEqual(pitched.internalOutline);expect(g.externalOutline).toEqual(pitched.externalOutline);
});

test('manual Victorian layouts share rear trusses and independently place side/front members',()=>{
 const g=build({victorianRearTrussPositionsMM:[650,1300],victorianSideJackPositionsMM:{left:[2200],right:[2300]},victorianFacetPositionsMM:{'facet-2':[400,1000],'facet-3':[]}});
 expect(g.valid).toBe(true);expect(g.layout.centresMM).toEqual([31.5,650,1300,1876]);
 expect(g.intermediateBars).toHaveLength(1);expect(g.jackRafters).toHaveLength(4);
 expect(g.hips).toEqual(build().hips);expect(g.ridge).toEqual(build().ridge);
});
test('manual Victorian positions reject overlapping slots and locked boundaries',()=>{
 for(const patch of [{victorianRearTrussPositionsMM:[31.5]},{victorianRearTrussPositionsMM:[700,730]},{victorianSideJackPositionsMM:{left:[1876]}},{victorianSideJackPositionsMM:{right:[2600]}},{victorianFacetPositionsMM:{'facet-2':[40]}},{victorianFacetPositionsMM:{'facet-3':[500,520]}}])expect(build(patch).valid).toBe(false);
});
test('null Victorian overrides restore the automatic member layout',()=>{
 const restored=build({victorianRearTrussPositionsMM:null,victorianSideJackPositionsMM:{left:null,right:null},victorianFacetPositionsMM:{'facet-2':null,'facet-3':null,'facet-4':null}});
 expect(restored.layout).toEqual(build().layout);expect(restored.intermediateBars).toEqual(build().intermediateBars);expect(restored.jackRafters).toEqual(build().jackRafters);
});
