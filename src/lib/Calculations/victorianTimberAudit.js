import {buildVictorianTrussSchedule} from '../Manufacturing/victorianTrussSchedule';
import {buildVictorianMemberSchedule} from '../Manufacturing/victorianMemberSchedule';
import {buildVictorianRingBeamProfiles} from '../Manufacturing/victorianRingBeamProfiles';
const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
const area=points=>Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.xMM*q.yMM-q.xMM*p.yMM;},0))/2/1e6;
export function buildVictorianTimberAudit({geometry:g,materials:m={}}={}){
 const fail=errors=>({valid:false,readOnly:true,errors,lines:[]});
 if(!g?.valid)return fail(g?.errors||['Valid Victorian geometry required.']);
 const truss=buildVictorianTrussSchedule({geometry:g,materials:m}),members=buildVictorianMemberSchedule({geometry:g,materials:m}),ring=buildVictorianRingBeamProfiles(g);
 if(!truss.valid||!members.valid||!ring.valid)return fail([...new Set([...(truss.errors||[]),...(members.errors||[]),...(ring.errors||[])])]);
 const count=truss.counts.trusses,t=truss.truss,beams=ring.beams,bays=beams.flatMap(b=>b.upstands),lines=[];
 const add=(key,label,quantity,unit,config,price,weight,basis)=>{
  const wastePercent=rate(config?.waste_percent??config?.waste_pct??m.global_waste_percent??10),unitPrice=rate(price),unitWeightKg=rate(weight);
  const chargeableQuantity=wastePercent==null?null:quantity*(1+wastePercent/100);
  lines.push({key,label,quantity,unit,wastePercent,chargeableQuantity,unitPrice,unitWeightKg,cost:unitPrice==null||chargeableQuantity==null?null:chargeableQuantity*unitPrice,installedWeightKg:unitWeightKg==null?null:quantity*unitWeightKg,basis});
 };
 const trussRunM=count*t.members.reduce((n,r)=>n+r.externalSlopeMM/1000,0),hipRunM=members.members.filter(r=>r.type==='Hip').reduce((n,r)=>n+r.topEdgeMM/1000,0),intermediateRunM=members.members.filter(r=>r.type==='Intermediate rafter').reduce((n,r)=>n+r.topEdgeMM/1000,0);
 add('trussJoists','220mm I-joist — truss members',trussRunM,'m',m.steico,m.steico?.price_per_m,m.steico?.weight_kg_per_m,`${count} trusses × two member top cutting lengths; boss truss included once.`);
 add('hipJoists','220mm I-joist — hips',hipRunM,'m',m.steico,m.steico?.price_per_m,m.steico?.weight_kg_per_m,`${g.hips.length} top cutting lengths; agreed sloping boss allowance deducted once.`);
 add('intermediateJoists','220mm I-joist — intermediate rafters',intermediateRunM,'m',m.steico,m.steico?.price_per_m,m.steico?.weight_kg_per_m,'Actual intermediate count follows front-facet support thresholds.');
 const jackRunM=members.members.filter(r=>r.type==='Jack rafter').reduce((n,r)=>n+r.topEdgeMM/1000,0);
 if(g.jackRafters.length)add('jackJoists','220mm I-joist — jack rafters',jackRunM,'m',m.steico,m.steico?.price_per_m,m.steico?.weight_kg_per_m,'Actual hip intersection,45mm timber widths and existing5mm closest-corner clearance; no boss allowance. Pricing lengths; workshop cuts pending verification.');
 add('gussets','9mm truss gussets — both faces',count*2*t.gusset.areaEachM2,'m²',m.ply9mm,m.ply9mm?.price_per_m2,m.ply9mm?.weight_kg_per_m2,`${count} trusses × two net gusset outlines.`);
 add('chevrons','18mm truss chevrons — both faces',count*2*t.chevron.areaEachM2,'m²',m.ply18mm,m.ply18mm?.price_per_m2,m.ply18mm?.weight_kg_per_m2,`${count} trusses × two net chevron outlines.`);
 add('closures','Assembled truss closures — offcuts',count*t.closure.cutLengthMM/1000,'m',{},m.truss_closure_45x45_price_per_m,m.truss_closure_45x45_weight_kg_per_m,'Existing separate closure allowance, matching Edwardian; not additional purchased I-joist or PSE stock.');
 add('pse',`30×95 PSE — ${beams.length} ring-beams`,beams.reduce((n,b)=>n+Math.max(b.layers.pse30x90.internalEdgeLengthMM,b.layers.pse30x90.externalEdgeLengthMM)/1000,0),'m',m.pse30x90,m.ringbeam_pse90x30_per_m??m.pse30x90?.price_per_m,m.pse30x90?.weight_kg_per_m,'Longest edge of each mitred PSE piece, counted once.');
 add('bases','9mm ring-beam bases',beams.reduce((n,b)=>n+area(b.layers.ply9Base.outline),0),'m²',m.ply9mm,m.ply9mm?.price_per_m2,m.ply9mm?.weight_kg_per_m2,`Net area of ${beams.length} actual mitred base polygons.`);
 add('upstands','9mm ring-beam upstands',bays.reduce((n,b)=>n+b.widthMM*b.heightMM/1e6,0),'m²',m.ply9mm,m.ply9mm?.price_per_m2,m.ply9mm?.weight_kg_per_m2,`${bays.length} clear bays × one plywood upstand; ${g.upstandHeightMM}mm full cutting height (${g.upstandArrangement}).`);
 add('outerLaths','25×50 ring-beam outer laths',beams.reduce((n,b)=>n+Math.max(b.layers.outerLath25x50.internalEdgeLengthMM,b.layers.outerLath25x50.externalEdgeLengthMM)/1000,0),'m',m.chamferLath,m.lath25x50?.price_per_m,m.chamferLath?.weight_kg_per_m,'Longest edge of each accepted mitred outer lath; joints remain subject to factory feedback.');
 add('finishingLaths','25×50 ring-beam finishing laths',bays.reduce((n,b)=>n+b.widthMM/1000,0),'m',m.chamferLath,m.lathFinish?.price_per_m,m.chamferLath?.weight_kg_per_m,'One finishing lath per clear upstand bay.');
 const missingCostKeys=lines.filter(l=>l.quantity>0&&l.cost==null).map(l=>l.key),missingWeightKeys=lines.filter(l=>l.quantity>0&&l.installedWeightKg==null).map(l=>l.key);
 return {valid:true,readOnly:true,errors:[],lines,truss:t,ringBeams:beams,memberSchedule:members,componentCounts:{trusses:count,trussMembers:count*2,hips:g.hips.length,intermediates:g.intermediateBars.length,jacks:g.jackRafters.length,joistMembers:count*2+members.members.length,gussets:count*2,chevrons:count*2,closures:count,ringBeams:beams.length,upstands:bays.length},
  totals:{joistLengthM:trussRunM+hipRunM+intermediateRunM+jackRunM,ply9AreaM2:lines.filter(l=>['gussets','bases','upstands'].includes(l.key)).reduce((n,l)=>n+l.quantity,0),ply18AreaM2:count*2*t.chevron.areaEachM2},
  knownCost:lines.reduce((n,l)=>n+(l.cost??0),0),knownInstalledWeightKg:lines.reduce((n,l)=>n+(l.installedWeightKg??0),0),costComplete:missingCostKeys.length===0,weightComplete:missingWeightKeys.length===0,missingCostKeys,missingWeightKeys,
  wallPackers:{thicknessMM:9,allocation:'Rear wall packers remain within the existing plywood waste allowance, matching Edwardian. No arbitrary packer count.'},
  notes:['Read-only timber/plywood subtotal. Insulation, roof/ceiling laths, coverings, metalwork, plastics, delivery, labour and markup are not included.',
   'Quantities are net cutting geometry; material waste is applied once to cost only. This is not a whole-sheet or stock-length order optimisation.',
   'Installed weights use configured linear/profile and sheet-area allowances without purchased waste; I-joist shaped-end trimming is not deducted from the linear allowance.',
   'One 9mm plywood upstand per clear bay, with PIR on its internal face. Two-faced truss gussets and chevrons are separate.',
   'The editable 160mm sloping top-edge boss allowance remains a working factory allowance. Jack timber is included using the shared hip-connection pricing profile; workshop cut release remains pending verification.']};
}
