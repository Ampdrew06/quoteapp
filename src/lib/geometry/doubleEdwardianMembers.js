import {automaticSupportCentres} from './automaticSupportSpacing';
const EPS=1e-6;
const unique=values=>[...new Set(values.map(n=>Math.round(n*1e6)/1e6))].sort((a,b)=>a-b);
const gaps=values=>values.slice(1).map((v,i)=>v-values[i]);
// Distances are plan centres on the internal outline, not manufacturing cuts.
export function buildDoubleEdwardianMembers(g,overrides={}){
 const w=g.widthMM,p=g.projectionMM,d=Math.min(w,p)/2;
 const specs=[{id:'left',name:'Left facet',length:p,origin:'rear towards front',point:t=>({x:0,y:t}),end:(t,h)=>({x:h,y:t})},{id:'front',name:'Front facet',length:w,origin:'left towards right',point:t=>({x:t,y:p}),end:(t,h)=>({x:t,y:p-h})},{id:'right',name:'Right facet',length:p,origin:'rear towards front',point:t=>({x:w,y:t}),end:(t,h)=>({x:w-h,y:t})},{id:'rear',name:'Rear / valley facet',length:w,origin:'left towards right',point:t=>({x:t,y:0}),end:(t,h)=>({x:t,y:h})}];
 const errors=[],members=[],groups=[];
 for(const f of specs){
  const fixed=unique([0,d,f.length-d,f.length]);
  const endCentres=automaticSupportCentres({startMM:0,endMM:d});
  const middle=f.length>2*d+EPS?automaticSupportCentres({startMM:d,endMM:f.length-d}):[d];
  const automatic=unique([...endCentres,...middle,...endCentres.map(t=>f.length-t)]).filter(t=>t>EPS&&t<f.length-EPS);
  const manual=Object.prototype.hasOwnProperty.call(overrides,f.id)&&overrides[f.id]!=null;
  let centres=manual?overrides[f.id]:automatic;
  if(!Array.isArray(centres)||centres.some(t=>typeof t!=='number'||!Number.isFinite(t)||t<=0||t>=f.length)||new Set(centres).size!==centres.length){errors.push(`${f.name}: centres must be unique numbers between 0 and ${f.length} mm.`);continue;}
  // Ridge-end supports stay fixed; only intermediate members are editable.
  const locked=fixed.filter(t=>t>EPS&&t<f.length-EPS);
  centres=unique([...centres,...locked]);
  const rows=[];
  for(const t of centres){
   const depth=Math.min(t,f.length-t,d),eave=f.point(t),tip=f.end(t,depth);
   if(f.id==='rear'&&tip.y<=g.plateThicknessMM+EPS){errors.push('A rear member is too close to the corner to reach beyond the valley plate.');continue;}
   const start=f.id==='rear'?{x:eave.x,y:g.plateThicknessMM}:eave;
   const kind=depth>=d-EPS?(f.length<=2*d+EPS?'Boss rafter':'Rafter / truss leg'):'Jack rafter';
   const row={facet:f.id,positionMM:t,eave,start,end:tip,kind,rearSupport:f.id==='rear'?'Variable Joist Hanger':null};
   rows.push(row);members.push(row);
  }
  groups.push({...f,centresMM:centres,editableCentresMM:centres.filter(t=>!locked.some(v=>Math.abs(v-t)<EPS)),lockedCentresMM:locked,gapsMM:gaps([0,...centres,f.length]),manual,members:rows});
 }
 const hips=g.hips.map(([eave,end])=>({kind:'Hip',eave,start:eave.y===0?{x:eave.x===0?g.plateThicknessMM:w-g.plateThicknessMM,y:g.plateThicknessMM}:eave,end,rearSupport:eave.y===0?'Hip Hanger':null}));
 const perimeterOrder=a=>a.x===0?a.y:a.y===p?p+a.x:a.x===w?p+w+(p-a.y):2*p+w+(w-a.x);
 const ordered=[...hips,...members].sort((a,b)=>perimeterOrder(a.eave)-perimeterOrder(b.eave));
 ordered.forEach((r,i)=>{r.id=`R${i+2}`;});
 const ridge=g.ridgeLengthMM>EPS?{id:`R${ordered.length+2}`,kind:'Ridge',start:g.ridge[0],end:g.ridge[1]}:null;
 let next=ordered.length+2+(ridge?1:0);
 const ringbeams=['Left ringbeam','Front ringbeam','Right ringbeam'].map(kind=>({id:`R${next++}`,kind}));
 const trusses=[];
 for(const a of members.filter(r=>r.kind==='Rafter / truss leg')){
  if(trusses.some(t=>t.legs.includes(a.id)))continue;
  const opposite={left:'right',right:'left',front:'rear',rear:'front'}[a.facet];
  const b=members.find(r=>r.facet===opposite&&Math.hypot(r.end.x-a.end.x,r.end.y-a.end.y)<EPS);
  if(b)trusses.push({id:`T${trusses.length+1}`,legs:[a.id,b.id]});
 }
 const warnings=groups.filter(f=>f.manual&&Math.max(...f.gapsMM)>665+EPS).map(f=>`${f.name}: manual spacing exceeds 665 mm.`);
 if(members.some(r=>r.kind==='Rafter / truss leg'&&!trusses.some(t=>t.legs.includes(r.id))))warnings.push('Some ridge rafters no longer align with an opposite truss leg. Review the opposite facet positions.');
 return {valid:errors.length===0,errors,groups,members:ordered,ridge,ringbeams,trusses,valleyPlate:{id:'R1',kind:'Valley plate'},hangers:{variable:members.filter(r=>r.rearSupport).length,hip:hips.filter(r=>r.rearSupport).length},warnings};
}
