const distance=(a,b)=>Math.hypot(a.xMM-b.xMM,a.yMM-b.yMM);
// Counter-clockwise around the roof perimeter:
// down the left edge, along the front, up the right, back along the wall.
export function buildVictorianHippedMemberNumbering(g){
 const entries=[],byId={};
 const add=(id,type,start,end,facetId=null)=>{if(byId[id])return;const reference=`R${entries.length+1}`;byId[id]=reference;entries.push({id,reference,type,start,end,facetId});};
 const origin={xMM:0,yMM:0},far={xMM:g.widthMM,yMM:0},BL=g.bosses.find(b=>b.id==='BL'),BR=g.bosses.find(b=>b.id==='BR');
 if(BL)add('WB1','Left wallbar',origin,BL);else {const wall=g.wallMembers?.find(m=>m.id==='WL');if(wall)add(wall.id,'Left wall-side rafter',wall.start,wall.end);}
 for(const f of g.facets){
  const members=g.rafterLayout.members.filter(r=>r.facetId===f.id).sort((a,b)=>a.perimeterPositionMM-b.perimeterPositionMM);
  for(const r of members)add(r.id,r.role,r.start,r.end,f.id);
  for(const h of g.hips.filter(h=>distance(h.end,f.end)<.001))add(h.id,'Hip',h.start,h.end);
 }
 if(BR)add('WB2','Right wallbar',BR,far);else {const wall=g.wallMembers?.find(m=>m.id==='WR');if(wall)add(wall.id,'Right wall-side rafter',wall.start,wall.end);}
 add('WP1','Horizontal wallplate',BR||far,BL||origin);
 for(const f of g.facets)add(`ring:${f.id}`,'Ring-beam',f.start,f.end,f.id);
 return {entries,byId,direction:'Counter-clockwise from the left wallbar; ring-beams follow the horizontal wallplate.'};
}
