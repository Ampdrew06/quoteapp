import {validateHippedRafterPositions} from './hippedRafterLayout';
import {roofVentOptions} from '../glazingOptions';
import {distributeVentRafters,equalVentGapMM,ventBayWidthMM} from './ventRafterSpacing';

export function hippedVentQuantitiesByProduct(byFacet = {}) {
 const totals = {};
 for (const quantities of Object.values(byFacet ?? {})) {
  for (const {code} of roofVentOptions) {
   const quantity=Number(quantities?.[code]);
   if(Number.isSafeInteger(quantity)&&quantity>0)totals[code]=(totals[code]??0)+quantity;
  }
 }
 return totals;
}

function setOutVentBays(geometry, items, facet, top, overrides) {
 const base=geometry.ventBaseFrontRafterLayout??geometry.frontRafterLayoutV2;
 const rafters=base?.allRafters??[];
 const centres=rafters.map(row=>row.centreMM).sort((a,b)=>a-b);
 // The central-boss layout has a dedicated centre member. Offset boss positions
 // do not divide the automatic set-out once a vent fixes the bay positions.
 const fixed=geometry.bossArrangement==='central'
  ? rafters.filter(row=>row.bossSide==='central'||row.role==='boss-rafter').map(row=>row.centreMM)
  : [];
 const [hipStart,hipEnd]=facet.bounds(top);
 const start=Math.max(73.01,hipStart+24),end=Math.min(facet.length-73.01,hipEnd-24);
 const midpoint=(start+end)/2;
 const bays=items.map(item=>({...item,bayMM:ventBayWidthMM(item.widthMM)}));
 const existing=centres.slice(1).map((right,index)=>({centre:(right+centres[index])/2,width:right-centres[index]}));
 const fits=(row,centre)=>Number.isFinite(centre)&&centre-row.bayMM/2>=start&&centre+row.bayMM/2<=end&&
  fixed.every(position=>{
   const clearance=Math.abs(position-centre)-row.bayMM/2;
   return Math.abs(clearance)<0.001||clearance>=49;
  });
 const nearBays=(row,centre)=>(geometry.ventFrontManuallyEdited?existing:[]).filter(bay=>Math.abs(bay.width-row.bayMM)<0.1&&fits(row,bay.centre))
  .map(bay=>bay.centre).sort((a,b)=>Math.abs(a-centre)-Math.abs(b-centre));
 const spacing=Number(base?.spacingMM)||665;
 const middleSpan=Number(base?.centreZoneWidthMM)||end-start;
 const spread=Math.min((end-start)/2-Math.max(...bays.map(row=>row.bayMM))/2,middleSpan/3);
 const symmetric=bays.length===2&&bays[0].bayMM===bays[1].bayMM;
 const mirrored=symmetric?nearBays(bays[0],midpoint-spread).find(centre=>centre<midpoint&&
  nearBays(bays[1],2*midpoint-centre).some(other=>Math.abs(other-(2*midpoint-centre))<0.1)):null;
 const gap=equalVentGapMM(start,end,bays);
 let cursor=start+gap;
 const placed=bays.map((row,index)=>{
  const target=symmetric?(mirrored!=null?(index===0?mirrored:2*midpoint-mirrored):midpoint+(index===0?-spread:spread)):cursor+row.bayMM/2;
  const existingCentre=bays.length===1?nearBays(row,target)[0]:null;
  const centreMM=overrides?.[index]??existingCentre??Math.round(target*10)/10;
  cursor+=row.bayMM+gap;
  return {...row,centreMM,left:centreMM-row.bayMM/2,right:centreMM+row.bayMM/2};
 });
 const valid=candidate=>candidate.every(row=>fits(row,row.centreMM))&&
  [...candidate].sort((a,b)=>a.left-b.left).every((row,index,sorted)=>!index||row.left-sorted[index-1].right>48);
 if(!valid(placed))return null;
 const clearsVents=centre=>placed.every(row=>centre<=row.left-49||centre>=row.right+49);
 const ventEdges=placed.flatMap(row=>[row.left,row.right]);
 const ordered=[...placed].sort((a,b)=>a.left-b.left);
 const innerLeft=ordered[0].right,innerRight=ordered.at(-1).left;
 const centreRafter=(innerLeft+innerRight)/2;
 const keepCentre=symmetric&&innerRight-innerLeft>=98&&Math.abs((ordered[0].centreMM+ordered[1].centreMM)/2-midpoint)<0.11&&clearsVents(centreRafter);
 const anchors=[...new Set([
  ...(geometry.ventFrontManuallyEdited?centres:fixed).filter(clearsVents),
  ...ventEdges,
  ...(!geometry.ventFrontManuallyEdited&&keepCentre?[centreRafter]:[]),
 ])].sort((a,b)=>a-b);
 const boundaries=[24,...anchors,facet.length-24];
 const frontPositionsMM=distributeVentRafters({
  boundaries,bays:ordered,spacingMM:spacing,manual:geometry.ventFrontManuallyEdited,
 });
 if(!frontPositionsMM||!validateHippedRafterPositions({positions:frontPositionsMM,widthMM:facet.length}).valid)return null;
 return {frontPositionsMM,placed:placed.map((row,index)=>{
  const alternatives=[...new Set([...existing.map(bay=>bay.centre),row.centreMM-spacing,row.centreMM+spacing])]
   .filter(centre=>valid(placed.map((other,i)=>i===index?{...row,centreMM:centre,left:centre-row.bayMM/2,right:centre+row.bayMM/2}:other)))
   .sort((a,b)=>a-b);
  return {...row,previousCentreMM:alternatives.filter(centre=>centre<row.centreMM-0.01).at(-1),nextCentreMM:alternatives.find(centre=>centre>row.centreMM+0.01)};
 })};
}

export function buildHippedLeanToVentLayout(geometry, byFacet = {}) {
 const g=geometry??{};
 const width=Number(g.widthMM), depth=Number(g.projectionMM);
 const left=g.hasLeftHip?Number(g.resolvedLeftHipWidthMM??g.leftPitchDerivedHipWidthMM??g.leftHipWidthMM):0;
 const right=g.hasRightHip?Number(g.resolvedRightHipWidthMM??g.rightPitchDerivedHipWidthMM??g.rightHipWidthMM):0;
 const definitions={
  front:{label:'Front facet',pitch:g.frontFacet?.geometry?.pitchDeg??g.frontPitchDeg,run:depth,length:width,
   bounds:v=>[left*v/depth,width-right*v/depth],point:(u,v)=>[u,depth-v]},
  left:{label:'Left facet',pitch:g.leftSidePitchDeg,run:left,length:depth,
   bounds:v=>[0,depth*(1-v/left)],point:(u,v)=>[v,u]},
  right:{label:'Right facet',pitch:g.rightSidePitchDeg,run:right,length:depth,
   bounds:v=>[0,depth*(1-v/right)],point:(u,v)=>[width-v,u]},
 };
 const facets=Object.entries(definitions).filter(([,f])=>f.run>0&&f.length>0).map(([id,f])=>({id,label:f.label}));
 const errors=[],openings=[];
 let frontPositionsMM=null;
 const sidePositionsMM={};
 for(const [facet,quantities] of Object.entries(byFacet??{})){
  const selected=roofVentOptions.map(item=>({...item,quantity:Number(quantities?.[item.code])}))
   .filter(item=>Number.isSafeInteger(item.quantity)&&item.quantity>0);
  const count=selected.reduce((total,item)=>total+item.quantity,0);
  if(!count)continue;
  const f=definitions[facet];
  if(!facets.some(item=>item.id===facet)){errors.push(`The ${f?.label.toLowerCase()??'selected facet'} is unavailable.`);continue;}
  if(!(f.pitch>=15&&f.pitch<90)){errors.push(`${f.label}: Liteleader roof vents require a pitch of at least 15°.`);continue;}
  const cosine=Math.cos(f.pitch*Math.PI/180);
  const height=Math.max(...selected.map(item=>item.heightMM))*cosine;
  const span=selected.reduce((total,item)=>total+item.quantity*ventBayWidthMM(item.widthMM),0);
  const near=f.bounds(height);
  if(height>f.run||span>=near[1]-near[0]||count>49){
   errors.push(`${f.label}: insufficient space between the hip and internal ringbeam for the selected vents.`);
   continue;
  }
  // Use the shared available width at the upper edge of the tallest vent.
  // Move the row towards the ringbeam only as far as needed to fit.
  const centred=(f.run+height)/2;
  const topBounds=f.bounds(centred);
  const contraction=(near[1]-near[0]-(topBounds[1]-topBounds[0]))/(centred-height||1);
  // The rear boundary and the hip clearance also occupy part of a side bay.
  const minimumWidth=span+(facet==='front'?0:97+49*(count-1));
  const top=contraction>0?Math.min(centred,height+(near[1]-near[0]-minimumWidth)/contraction/2):centred;
  if(top<height){errors.push(`${f.label}: insufficient room for the vent and its bounding rafters.`);continue;}
  if(facet==='front'&&g.frontRafterLayoutV2){
   const items=selected.flatMap(item=>Array.from({length:item.quantity},()=>item));
   const bays=setOutVentBays(g,items,f,top,byFacet.frontCentresMM);
   if(!bays){errors.push('Front facet: the vent bays need clearance from the hips, fixed rafters and each other.');continue;}
   frontPositionsMM=bays.frontPositionsMM;
   bays.placed.forEach((item,index)=>{
    const u=item.centreMM-item.widthMM/2,bottom=top-item.heightMM*cosine;
    const corners=[f.point(u,bottom),f.point(u+item.widthMM,bottom),f.point(u+item.widthMM,top),f.point(u,top)];
    openings.push({id:`front-vent-${index+1}`,facet,corners,widthMM:item.widthMM,heightMM:item.heightMM,areaM2:item.widthMM*item.heightMM/1e6,
     centreMM:item.centreMM,previousCentreMM:item.previousCentreMM,nextCentreMM:item.nextCentreMM,bayMM:item.bayMM});
   });
   continue;
  }
  if(facet==='front')continue;
  const items=selected.flatMap(item=>Array.from({length:item.quantity},()=>item));
  const existing=g.sideVentBaseLayouts?.[facet];
  const bays=setOutVentBays({frontRafterLayoutV2:existing?.layout,ventFrontManuallyEdited:existing?.manual},items,f,top);
  if(!bays){errors.push(`${f.label}: the vent bays need clearance from the wall, hip and each other.`);continue;}
  sidePositionsMM[facet]=bays.frontPositionsMM;
  bays.placed.forEach((item,index)=>{
   const u=item.centreMM-item.widthMM/2,bottom=top-item.heightMM*cosine;
   const corners=[f.point(u,bottom),f.point(u+item.widthMM,bottom),f.point(u+item.widthMM,top),f.point(u,top)];
   openings.push({id:`${facet}-vent-${index+1}`,facet,corners,widthMM:item.widthMM,heightMM:item.heightMM,
    areaM2:item.widthMM*item.heightMM/1e6,centreMM:item.centreMM,bayMM:item.bayMM});
  });

 }
 return {facets,openings,errors,frontPositionsMM,sidePositionsMM,areaM2:openings.reduce((total,item)=>total+item.areaM2,0)};
}
