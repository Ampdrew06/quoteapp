import {buildCentralBossTrussAudit} from '../geometry/centralBossTrussAudit';
import {buildEdwardianMemberAudit} from './edwardianMemberAudit';
import {buildEdwardianRingBeamAudit} from './edwardianRingBeamAudit';
const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
export function buildEdwardianTimberAudit({geometry:g,materials:m={}}={}) {
 const fail=errors=>({valid:false,readOnly:true,errors,lines:[]});
 if(!g?.valid)return fail(['Valid Edwardian geometry is required.']);
 const members=buildEdwardianMemberAudit({geometry:g}),ring=buildEdwardianRingBeamAudit({geometry:g});
 if(!members.valid||!ring.valid)return fail([...members.errors,...ring.errors]);
 const truss=buildCentralBossTrussAudit({widthMM:g.widthMM,projectionMM:g.projectionMM,frontPitchDeg:g.frontPitchDeg,trussPitchDeg:g.pitchDeg,
  memberDepthMM:220,flangeWidthMM:45,ringBeamHeightMM:Number(m.ring_beam_height_mm??40),sideHfcMM:g.eaves.left.geometry.raw.manufacturedHorizontalFootCutMM,gussetWidthMM:595});
 if(!truss.valid)return fail(truss.errors);
 const count=g.layout.trussCount,totals=ring.schedule.totals,lines=[];
 const add=(key,label,quantity,unit,config,price,weight,basis)=>{
  const waste=rate(config?.waste_percent??config?.waste_pct??m.global_waste_percent??10),p=rate(price),w=rate(weight);
  const chargeableQuantity=waste==null?null:quantity*(1+waste/100);
  lines.push({key,label,quantity,unit,wastePercent:waste,chargeableQuantity,cost:p==null||chargeableQuantity==null?null:p*chargeableQuantity,installedWeightKg:w==null?null:w*quantity,basis});
 };
 add('joists','220mm joists — trusses, hips, boss rafter and jacks',members.members.reduce((n,r)=>n+r.profile.externalSlopeLengthMM/1000,0),'m',m.steico,m.steico?.price_per_m,m.steico?.weight_kg_per_m,`${members.members.length} members; each external cutting length counted once.`);
 add('gussets','9mm truss gussets — front and rear faces',count*2*truss.gusset.areaEachM2,'m²',m.ply9mm,m.ply9mm?.price_per_m2,m.ply9mm?.weight_kg_per_m2,`${count} trusses × two gussets; no full Gable front facing plate on an Edwardian.`);
 add('chevrons','18mm truss chevrons — front and rear faces',count*2*truss.chevron.areaEachM2,'m²',m.ply18mm,m.ply18mm?.price_per_m2,m.ply18mm?.weight_kg_per_m2,`${count} trusses × two 300mm-arm chevrons; area from shared truss outlines.`);
 add('closures','Truss closure — assembled rafter offcuts',count*truss.closure.cutLengthMM/1000,'m',{},m.truss_closure_45x45_price_per_m,m.truss_closure_45x45_weight_kg_per_m,`${count} × 595mm; existing provisional allowance, no purchased 45×45 stock.`);
 add('pse','30×95 PSE — ring-beam runs',totals.pse30x90LengthM,'m',m.pse30x90,m.ringbeam_pse90x30_per_m??m.pse30x90?.price_per_m,m.pse30x90?.weight_kg_per_m,'Shared layer cut lengths; each beam once.');
 add('bases','9mm ring-beam bases',totals.ply9BaseAreaM2,'m²',m.ply9mm,m.ply9mm?.price_per_m2,m.ply9mm?.weight_kg_per_m2,'Net area of the shared mitred/square-leg outlines.');
 add('upstands','9mm ring-beam upstands',totals.ply9UpstandAreaM2,'m²',m.ply9mm,m.ply9mm?.price_per_m2,m.ply9mm?.weight_kg_per_m2,'18 upstands on the example; actual count follows slots.');
 add('outerLaths','25×50 ring-beam outer fixing laths',totals.outerFixingLath25x50LengthM,'m',m.chamferLath,m.lath25x50?.price_per_m,m.chamferLath?.weight_kg_per_m,'Two full side runs plus front between them.');
 add('finishingLaths','25×50 ring-beam finishing laths',totals.finishingLath25x50LengthM,'m',m.chamferLath,m.lathFinish?.price_per_m,m.chamferLath?.weight_kg_per_m,'Actual upstand clear widths.');
 return {valid:true,readOnly:true,errors:[],lines,truss,memberAudit:members,ringBeamAudit:ring,
  componentCounts:{joistMembers:members.members.length,trusses:count,gussets:count*2,chevrons:count*2,closures:count,ringBeams:3,upstands:ring.ringBeams.reduce((n,b)=>n+b.upstandCount,0)},
  wallPackers:{thicknessMM:9,allocation:'Covered by the existing plywood waste allowance, as on Gable. No separate cut quantity or additional installed weight is claimed.'},
  trussToClosureSlopeMM:(g.widthMM/2-truss.gusset.widthMM/2)/Math.cos(g.pitchDeg*Math.PI/180),
  knownCost:lines.reduce((n,l)=>n+(l.cost??0),0),knownInstalledWeightKg:lines.reduce((n,l)=>n+(l.installedWeightKg??0),0),
  notes:['Partial timber audit: insulation, field/ceiling laths, ridge/hip support laths, coverings, hardware and consumables are separate stages.',
   'The shared truss builder supplies chevron and gusset net areas and the 595mm assembled closure. The terminal truss is counted once.',
   'Rear wall packers are 9mm plywood and remain covered by the existing practical plywood waste allowance, matching the Gable pricing approach. Random packer placement is not turned into an invented cutting schedule.',
   'Costs use configured per-unit rates plus configured waste; missing rates remain Unconfigured. Net quantities are not whole-stock order quantities.',
   'Joist weights retain the existing per-metre profile allowance. Closure weight retains its saved allowance; no waste weight is added.',
   '50mm PIR on ring-beam upstands is shown in the ring-beam audit and will be pooled once in the insulation audit, not charged twice here.',
   'Read-only: Summary, quotation pricing, loading list and manufacture book remain unchanged.']};
}
