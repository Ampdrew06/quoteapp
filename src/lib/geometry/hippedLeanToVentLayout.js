import {roofVentOptions} from '../glazingOptions';

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
  const span=selected.reduce((total,item)=>total+item.quantity*item.widthMM,0);
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
  const top=contraction>0?Math.min(centred,height+(near[1]-near[0]-span)/contraction/2):centred;
  const [start,end]=f.bounds(top);
  const gap=(end-start-span)/(count+1);
  let cursor=start+gap;
  for(const item of selected){
   for(let n=0;n<item.quantity;n++){
    const bottom=top-item.heightMM*cosine;
    const corners=[f.point(cursor,bottom),f.point(cursor+item.widthMM,bottom),f.point(cursor+item.widthMM,top),f.point(cursor,top)];
    openings.push({id:`hipped-vent-${openings.length+1}`,facet,corners,widthMM:item.widthMM,heightMM:item.heightMM,areaM2:item.widthMM*item.heightMM/1e6});
    cursor+=item.widthMM+gap;
   }
  }
 }
 return {facets,openings,errors,areaM2:openings.reduce((total,item)=>total+item.areaM2,0)};
}
