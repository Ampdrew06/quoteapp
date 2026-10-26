import {resolveLeanToRafterLayout} from './leanToRafterLayout';
import {resolveEdwardianRearTrusses} from './edwardianSideLayout';

export function applyVictorianRafterLayout({geometry:g,inputs,jackAt}) {
 const errors=[];
 let layout=g.layout;
 if(inputs.victorianRearTrussPositionsMM!=null){
  const edited=resolveEdwardianRearTrusses(inputs.victorianRearTrussPositionsMM,g.terminalTrussCentreMM);
  if(!edited.valid)errors.push(...edited.errors);else layout={...layout,...edited};
 }
 let intermediateBars=[...g.intermediateBars],jackRafters=[...g.jackRafters];
 const check=(positions,length,start=24)=>resolveLeanToRafterLayout({widthMM:length,positions,boundaryStartMM:start,boundaryEndMM:length-24});
 for(const [i,f] of g.facets.entries()){
  const side=i===0?'left':i===g.facets.length-1?'right':null;
  const positions=side?inputs.victorianSideJackPositionsMM?.[side]:inputs.victorianFacetPositionsMM?.[f.id];
  if(positions==null)continue;
  const resolved=check(positions,f.internalLengthMM,side?g.terminalTrussCentreMM:24);
  if(!resolved.valid){errors.push(`${f.label}: ${resolved.errors.join(' ')}`);continue;}
  intermediateBars=intermediateBars.filter(r=>r.facetId!==f.id);
  jackRafters=jackRafters.filter(r=>r.facetId!==f.id);
  resolved.interiorMM.forEach((positionMM,n)=>{
   const facetPosition=side==='right'?f.internalLengthMM-positionMM:positionMM;
   const id=`M${i+1}.${n+1}`;
   // Retain the existing central boss-rafter arrangement on front facets
   // using that manufacturing method. Wider facets retain hip-connected jacks.
   const bossAligned=g.frontFacetCount===3&&!side&&f.internalLengthMM<=2*g.maxSupportSpacingMM+1e-7&&Math.abs(facetPosition-f.internalLengthMM/2)<0.01;
   if(bossAligned)intermediateBars.push({id,facetId:f.id,positionMM:facetPosition,start:g.ridge,end:{xMM:(f.start.xMM+f.end.xMM)/2,yMM:(f.start.yMM+f.end.yMM)/2}});
   else {
    const member=jackAt(f,facetPosition/f.internalLengthMM,id);
    if(member&&g.frontFacetCount===5&&(Math.abs(facetPosition-f.internalLengthMM/2)<0.1||Math.hypot(member.start.xMM-g.ridge.xMM,member.start.yMM-g.ridge.yMM)<1e-6))errors.push(`${f.label}: move the jack off the facet centre so it connects to a hip, clear of the boss.`);
    else if(member)jackRafters.push(member);else errors.push(`${f.label}: could not resolve the hip connection at ${positionMM}mm.`);
   }
  });
 }
 return {...g,valid:errors.length===0,errors,layout,intermediateBars,jackRafters};
}
