import {buildVictorianTimberAudit} from './victorianTimberAudit';
import {buildVictorianSurfaceAreas,victorianFrameExtension} from '../geometry/victorianSurfaceAreas';
import {chooseSuperQuiltMix} from './insulationIntegrationAudit';
const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
export function buildVictorianInsulationAudit({geometry:g,materials:m={}}={}){
 const fail=errors=>({valid:false,readOnly:true,errors,lines:[]});
 const timber=buildVictorianTimberAudit({geometry:g,materials:m});if(!timber.valid)return fail(timber.errors);
 const c=p=>Math.cos(p*Math.PI/180),t=timber.truss,count=g.layout.trussCount;
 const ceiling=buildVictorianSurfaceAreas({geometry:g,flatWidthMM:t.closure.cutLengthMM}),slabSurface=buildVictorianSurfaceAreas({geometry:g,eavesExtensionMM:g.frameMM}),membraneSurface=buildVictorianSurfaceAreas({geometry:g,eavesExtensionMM:g.plyBaseWidthMM+50});
 if(!ceiling.valid||!slabSurface.valid||!membraneSurface.valid)return fail(['Could not resolve the five Victorian insulation surfaces.']);
 const trussCradleRunMM=(g.widthMM/2+g.frameMM-t.gusset.widthMM/2)/c(g.pitchDeg),trussFaceCount=2*(2*count-1);
 const others=timber.memberSchedule.members.map(r=>{const plan=[...g.hips,...g.intermediateBars,...g.jackRafters].find(p=>p.id===r.ref);return {...r,frameSlopeExtensionMM:victorianFrameExtension(g,plan,g.frameMM)/c(r.pitchDeg)};});
 const otherCradleLengthM=others.reduce((n,r)=>n+2*(r.bottomEdgeMM+r.frameSlopeExtensionMM)/1000,0),cradleLengthM=trussFaceCount*trussCradleRunMM/1000+otherCradleLengthM,cradleAreaM2=cradleLengthM*0.14;
 const bayWidthM=timber.ringBeams.flatMap(b=>b.upstands).reduce((n,b)=>n+b.widthMM/1000,0),ringPirHeightMM=185,ringPir50AreaM2=bayWidthM*ringPirHeightMM/1000;
 const timberFootprintAreaM2=(count*2*(g.widthMM/2+g.frameMM)/c(g.pitchDeg)+others.reduce((n,r)=>n+r.bottomEdgeMM+r.frameSlopeExtensionMM,0))*45/1e6,slabAreaM2=Math.max(0,slabSurface.areaM2-timberFootprintAreaM2);
 const board=(netAreaM2,config={},wasteOverride,weightOverride)=>{
  const width=Number(config.sheet_w_m??1.2),height=Number(config.sheet_h_m??2.4),wastePercent=rate(wasteOverride??config.waste_pct??5),sheetAreaM2=width*height;
  if(![width,height].every(n=>Number.isFinite(n)&&n>0)||wastePercent==null)return null;
  const orderAreaM2=netAreaM2*(1+wastePercent/100),sheets=Math.ceil((orderAreaM2-1e-9)/sheetAreaM2),price=rate(config.price_per_sheet),weight=rate(weightOverride??config.weight_kg_per_m2);
  return {netAreaM2,orderAreaM2,wastePercent,sheetAreaM2,sheets,cost:price==null?null:sheets*price,installedWeightKg:weight==null?null:netAreaM2*weight};
 };
 const packArea=rate(m.pir100_pack_coverage_m2??m.slab100?.pack_coverage_m2),packWeight=rate(m.pir100_weight_kg_per_pack??m.slab100?.weight_kg_per_pack),weight100=rate(m.pir100_weight_kg_per_m2??m.pir100?.weight_kg_per_m2)??(packArea>0&&packWeight!=null?packWeight/packArea:null);
 const pir50=board(cradleAreaM2+ringPir50AreaM2,m.pir50),pir100=board(slabAreaM2,{...(m.pir100||{}),weight_kg_per_m2:weight100},m.slab100_wastage_pct??m.slab100?.wastage_pct??m.pir50?.waste_pct??5);
 if(!pir50||!pir100)return fail(['Invalid PIR sheet dimensions or waste allowance.']);
 const rollWidth=Number(m.superquilt_roll_width_mm??1200),overlap=Number(m.superquilt_overlap_mm??50),waste=Number(m.superquilt_wastage_pct??6);
 if(![rollWidth,overlap,waste].every(Number.isFinite)||rollWidth<=0||overlap<0||overlap>=rollWidth||waste<0)return fail(['Invalid SuperQuilt overlap, roll width or waste.']);
 const option=size=>(m.superquilt_options||[]).find(o=>Number(o.coverage_m2)===size),price12=rate(m.superquilt_12m_price_each??option(12)?.price_per_roll),price15=rate(m.superquilt_15m_price_each??option(15)?.price_per_roll),nominalM2=ceiling.areaM2/(1-overlap/rollWidth)*(1+waste/100),mix=chooseSuperQuiltMix({requiredNominalM2:nominalM2,price12:price12??0,price15:price15??0});
 const quiltRollWeight=rate(m.superquilt_12m_weight_kg_each??option(12)?.weight_kg_per_roll??m.superquilt_roll_weight_kg),quiltWeight=rate(m.superquilt_weight_kg_per_m2)??(quiltRollWeight==null?null:quiltRollWeight/12);
 const superQuilt={installedAreaM2:ceiling.areaM2,nominalM2,...mix,cost:(mix.rolls12&&price12==null)||(mix.rolls15&&price15==null)?null:mix.cost,installedWeightKg:quiltWeight==null?null:ceiling.areaM2*quiltWeight};
 const rollCoverageM2=Number(m.breather_roll_width_m??m.breatherMembrane?.roll_width_m??1)*Number(m.breather_roll_length_m??m.breatherMembrane?.roll_length_m??50);
 if(!Number.isFinite(rollCoverageM2)||rollCoverageM2<=0)return fail(['Invalid breather membrane roll coverage.']);
 const membraneRollWeight=rate(m.breather_roll_weight_kg??m.breatherMembrane?.weight_kg_per_roll),membraneRate=rate(m.breather_weight_kg_per_m2)??(membraneRollWeight==null?null:membraneRollWeight/rollCoverageM2);
 const membrane={installedAreaM2:membraneSurface.areaM2,surface:membraneSurface,rolls:Math.ceil(membraneSurface.areaM2/rollCoverageM2),rollCoverageM2,cost:rate(m.breather_roll_price_each??m.breatherMembrane?.price_per_roll)==null?null:Math.ceil(membraneSurface.areaM2/rollCoverageM2)*rate(m.breather_roll_price_each??m.breatherMembrane?.price_per_roll),installedWeightKg:membraneRate==null?null:membraneSurface.areaM2*membraneRate,coverageReview:false};
 const plasterboard={installedAreaM2:ceiling.areaM2,sheets:Math.ceil(ceiling.areaM2/2.88),installedWeightKg:ceiling.areaM2*8.5,supplyIncluded:false};
 const lines=[{key:'pir50',label:'50mm PIR — fitted cradle strips and ring-beams',...pir50,supply:'Fitted'},{key:'pir100',label:'100mm PIR — between roof members',...pir100,supply:'Loose boards'},{key:'superQuilt',label:'SuperQuilt — finished ceiling',...superQuilt,supply:'Supplied'},{key:'membrane',label:'Breather membrane — outer roof',...membrane,supply:'Supplied'}];
 return {valid:true,readOnly:true,errors:[],lines,ceiling,slab:{surface:slabSurface,timberFootprintAreaM2,netAreaM2:slabAreaM2},pir50,pir100,superQuilt,membrane,plasterboard,
  cradle:{trussFaceCount,trussCradleRunMM,otherCradleLengthM,totalLengthM:cradleLengthM,netAreaM2:cradleAreaM2,stripWidthMM:140,ringPir50AreaM2,ringPirHeightMM,ringPirFaceCount:1},
  knownCost:lines.reduce((n,l)=>n+(l.cost??0),0),knownInstalledWeightKg:lines.reduce((n,l)=>n+(l.installedWeightKg??0),0),costComplete:!membrane.coverageReview&&lines.every(l=>l.cost!=null),weightComplete:lines.every(l=>l.installedWeightKg!=null),
  notes:[`${g.facets.length} pitched roof planes partition the actual Victorian outline. PIR100 extends to the outside frame line and reaches the ridge, less the existing 45mm member-footprint area allowance; this is not a slab cutting/nesting schedule.`,
   'Truss cradle strips are 140mm wide and stop at the gusset edge. Rear truss has only its inward faces; intermediate and boss trusses have both faces. Hips and intermediates have two cradle faces, extending to the outside frame line without soffits.',
   'One 185mm-high PIR face per clear ring-beam bay, following the existing ring-beam PIR height. The 15mm plywood groove insertion is not added to PIR. Ring-beam PIR and all cradle strips are pooled before rounding to sheets.',
   '50mm PIR is fitted;100mm boards are supplied loose. PIR cost includes configured waste and whole sheets; installed weight uses net area, without waste.',
   'SuperQuilt and the plasterboard buying guide share the ceiling slopes plus the horizontal flat at the underside height of the 595mm truss closure. Quilt roll weights use a fixed installed-area rate regardless of ordered roll mix.',
   'Breather membrane extends 50mm in plan past the ply-base envelope. Whole rolls are rounded up to cover the installed area; large roofs receive additional rolls automatically.',
   'Plasterboard is NOT SUPPLIED and has no cost. Its sheet count is a customer buying guide and its installed weight is shown separately.',
   'Read-only audit: no live Summary, pricing, manufacture or despatch checklist changes. Jack cradles and member footprints are included. Adjusted-angle member geometry still requires review.']};
}
