import {buildEdwardianTimberAudit} from './edwardianTimberAudit';
import {buildEdwardianSurfaceAreas} from '../geometry/edwardianSurfaceAreas';
import {chooseSuperQuiltMix} from './insulationIntegrationAudit';
import {coveringWeightRates} from './installedCoveringWeights';
const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
export function buildEdwardianInsulationAudit({geometry:g,materials:m={}}={}) {
 const timber=buildEdwardianTimberAudit({geometry:g,materials:m});
 const fail=errors=>({valid:false,errors,readOnly:true});if(!timber.valid)return fail(timber.errors);
 const c=p=>Math.cos(p*Math.PI/180),count=g.layout.trussCount;
 const ceiling=buildEdwardianSurfaceAreas({geometry:g,flatWidthMM:timber.truss.closure.cutLengthMM});
 const slabSurface=buildEdwardianSurfaceAreas({geometry:g,leftExtensionMM:g.frameMM,rightExtensionMM:g.frameMM,frontExtensionMM:g.frameMM});
 const membraneSurface=buildEdwardianSurfaceAreas({geometry:g,leftExtensionMM:g.externalLeftMM+50,rightExtensionMM:g.externalRightMM+50,frontExtensionMM:g.externalFrontMM+50});
 if(!ceiling.valid||!slabSurface.valid||!membraneSurface.valid)return fail(['Could not resolve the insulation surfaces.']);
 const half=g.widthMM/2,gussetHalf=timber.truss.gusset.widthMM/2;
 const trussCradleRunMM=(half+g.frameMM-gussetHalf)/c(g.pitchDeg);
 // Rear wall face excluded. Terminal truss has PIR on both faces.
 const trussFaceCount=2*(2*count-1);
 const members=timber.memberAudit.members;
 const frameSlopeExtension=r=>{
  const pitch=r.profile.facetPitchDeg??r.profile.hipPitchDeg;
  if(r.type!=='hip')return g.frameMM/c(pitch);
  const plan=Math.hypot(g.widthMM/2,g.ridgeSetbackMM);
  const extension=Math.min(g.frameMM/(g.widthMM/2/plan),g.frameMM/(g.ridgeSetbackMM/plan));
  return extension/c(pitch);
 };
 const other=members.filter(r=>r.type!=='truss-member');
 const otherCradleLengthM=other.reduce((n,r)=>n+2*(r.profile.internalSlopeLengthMM+frameSlopeExtension(r))/1000,0);
 const cradleLengthM=trussFaceCount*trussCradleRunMM/1000+otherCradleLengthM;
 const cradleAreaM2=cradleLengthM*0.14;
 const timberFootprintAreaM2=members.reduce((n,r)=>n+(r.profile.internalSlopeLengthMM+frameSlopeExtension(r))*45/1e6,0);
 const slabAreaM2=Math.max(0,slabSurface.areaM2-timberFootprintAreaM2);
 const board=(netAreaM2,config,waste,weightOverride)=>{
  const sheetAreaM2=Number(config.sheet_w_m??1.2)*Number(config.sheet_h_m??2.4),wastePercent=rate(waste??config.waste_pct??5);
  const orderAreaM2=wastePercent==null?null:netAreaM2*(1+wastePercent/100),sheets=sheetAreaM2>0&&Number.isFinite(sheetAreaM2)&&orderAreaM2!=null?Math.ceil(orderAreaM2/sheetAreaM2):null;
  const price=rate(config.price_per_sheet),weight=rate(weightOverride??config.weight_kg_per_m2);
  return {netAreaM2,orderAreaM2,wastePercent,sheetAreaM2,sheets,cost:sheets==null||price==null?null:sheets*price,installedWeightKg:weight==null?null:netAreaM2*weight};
 };
 const ringPir50AreaM2=timber.ringBeamAudit.schedule.totals.pir50AreaM2;
 const pir50=board(cradleAreaM2+ringPir50AreaM2,m.pir50||{});
 const packArea=rate(m.pir100_pack_coverage_m2??m.slab100?.pack_coverage_m2),packWeight=rate(m.pir100_weight_kg_per_pack??m.slab100?.weight_kg_per_pack);
 const weight100=rate(m.pir100_weight_kg_per_m2??m.pir100?.weight_kg_per_m2)??(packArea>0&&packWeight!=null?packWeight/packArea:null);
 const pir100=board(slabAreaM2,{...(m.pir100||{}),weight_kg_per_m2:weight100},m.slab100_wastage_pct??m.slab100?.wastage_pct??m.pir50?.waste_pct??5);
 const rollWidth=Number(m.superquilt_roll_width_mm??1200),overlap=Number(m.superquilt_overlap_mm??50),waste=Number(m.superquilt_wastage_pct??6);
 if(![rollWidth,overlap,waste].every(Number.isFinite)||rollWidth<=0||overlap<0||overlap>=rollWidth||waste<0)return fail(['Invalid SuperQuilt overlap, roll width or waste allowance.']);
 const nominalM2=ceiling.areaM2/(1-overlap/rollWidth)*(1+waste/100),option=size=>(m.superquilt_options||[]).find(o=>Number(o.coverage_m2)===size);
 const price12=rate(m.superquilt_12m_price_each??option(12)?.price_per_roll),price15=rate(m.superquilt_15m_price_each??option(15)?.price_per_roll);
 const mix=chooseSuperQuiltMix({requiredNominalM2:nominalM2,price12:price12??0,price15:price15??0}),weights=coveringWeightRates(m);
 return {valid:true,readOnly:true,errors:[],ceiling,slab:{surface:slabSurface,timberFootprintAreaM2,netAreaM2:slabAreaM2},pir50,pir100,
  cradle:{trussFaceCount,trussCradleRunMM,otherCradleLengthM,totalLengthM:cradleLengthM,netAreaM2:cradleAreaM2,stripWidthMM:140,ringPir50AreaM2},
  superQuilt:{installedAreaM2:ceiling.areaM2,nominalM2,...mix,cost:(mix.rolls12&&price12==null)||(mix.rolls15&&price15==null)?null:mix.cost,installedWeightKg:ceiling.areaM2*weights.superQuiltKgPerM2},
  membrane:{surface:membraneSurface,installedAreaM2:membraneSurface.areaM2,rolls:1,cost:rate(m.breather_roll_price_each??m.breatherMembrane?.price_per_roll),installedWeightKg:membraneSurface.areaM2*weights.membraneKgPerM2,coverageReview:membraneSurface.areaM2>50},
  plasterboard:{installedAreaM2:ceiling.areaM2,sheets:Math.ceil(ceiling.areaM2/2.88),installedWeightKg:ceiling.areaM2*8.5,supplyIncluded:false},
  notes:[
   'SuperQuilt and plasterboard share one finished ceiling surface: three slopes and a flat clipped at the underside height of the 595mm truss closure. The ceiling stops at the internal frame lines and house wall; soffits are excluded.',
   'The flat continues forwards from the rear trusses until it meets the front ceiling slope. Three plane intersections establish its outline; it is not limited to the ridge point.',
   '50mm truss cradles stop at the gusset edge. Rear truss has one inward face per member; intermediate and terminal trusses have two. Terminal front faces border the hipped section and are not treated as an exposed Gable front.',
   'Other member cradles use two 140mm faces per hip, jack and front boss rafter, following the existing Hipped allowance. Runs include the frame extension to the ring-beam upstand, but exclude the soffit.',
   '100mm PIR continues to the apex/ridge, above the ceiling flat. Net area uses the roof surfaces to the outside frame line less the existing 45mm timber strip-footprint estimate. This is an area ordering allowance, not a validated slab cutting/nesting schedule.',
   '50mm cradle and ring-beam PIR face areas are pooled once before sheet rounding. Timber subtotal excludes PIR, so no duplicate charge is introduced.',
   'Sheet quantities include configured waste; installed weight uses net area. PIR100 weight uses a saved per-m² rate or saved pack weight divided by pack coverage.',
   'SuperQuilt roll selection reuses the shared overlap/waste and 12/15m² roll mix rules. Installed quilt weight is independent of the ordered mix.',
   'Breather membrane extends to tile-starter edges, including 50mm plan beyond the manufacturing member envelope. One roll is retained; areas exceeding 50m² require supply review.',
   'Plasterboard is not supplied or priced. Its 8.5kg/m² installed weight and informational sheet count are shown separately.',
   'Read-only audit: existing roof styles, Summary, pricing, manufacture and Idiot List are unchanged.'
  ]};
}
