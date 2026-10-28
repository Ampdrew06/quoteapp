import {buildVictorianHippedGeometry as build,victorianHippedDesignDefaults} from './victorianHippedGeometry';
const inputs={...victorianHippedDesignDefaults,widthMM:4500,projMM:2600};

test('snapping chamfer rafters makes them normal to the actual ringbeam and hip-connected',()=>{
 const original=build({inputs}),snapped=build({inputs:{...inputs,victorianHippedRafterAlignment:{F2:'perpendicular',F4:'perpendicular'}}});
 expect(snapped.valid).toBe(true);
 for(const id of ['F2','F4']){
  expect(original.rafterLayout.members.find(r=>r.facetId===id).role).toBe('boss-rafter');
  const f=snapped.facets.find(f=>f.id===id),r=snapped.rafterLayout.members.find(r=>r.facetId===id);
  const dx=f.end.xMM-f.start.xMM,dy=f.end.yMM-f.start.yMM,rx=r.end.xMM-r.start.xMM,ry=r.end.yMM-r.start.yMM;
  expect((dx*rx+dy*ry)/(Math.hypot(dx,dy)*Math.hypot(rx,ry))).toBeCloseTo(0,9);
  expect(r.role).toBe('jack');
  expect(r.bossId).toBe(null);
 }
});

test('added centres retain perpendicular alignment and invalid modes are rejected',()=>{
 const initial=build({inputs}),positions={};
 for(const id of ['F2','F4']){const length=initial.facets.find(f=>f.id===id).internalLengthMM;positions[id]=[length/3,2*length/3];}
 const g=build({inputs:{...inputs,victorianHippedFacetPositionsMM:positions,victorianHippedRafterAlignment:{F2:'perpendicular',F4:'perpendicular'}}});
 expect(g.valid).toBe(true);
 for(const id of ['F2','F4'])expect(g.rafterLayout.members.filter(r=>r.facetId===id&&r.role==='jack').length).toBe(2);
 expect(build({inputs:{...inputs,victorianHippedRafterAlignment:{F2:'invalid'}}}).valid).toBe(false);
});
