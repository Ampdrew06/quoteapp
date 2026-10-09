import {chooseSuperQuiltMix} from './insulationIntegrationAudit';
import {coveringWeightRates} from './installedCoveringWeights';
const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
export function buildGableInsulationAudit({geometry:g,timberAudit:t,materials:m={}}={}) {
 if(!g?.valid||!t?.valid)return {valid:false,errors:['Valid Gable geometry and timber audit are required.']};
 const cos=Math.cos(g.pitchDeg*Math.PI/180),n=g.layout.trussCount;
 const runMM=(g.widthMM/2+g.frameMM)/cos;
 const facesPerSide=2*n-2;
 const gussetHalfWidthMM=g.truss.gusset.widthMM/2;
 const cradleRunMM=Math.max(0,(g.widthMM/2+g.frameMM-gussetHalfWidthMM)/cos);
 const cradleLengthM=facesPerSide*2*cradleRunMM/1000,cradleAreaM2=cradleLengthM*0.14;
 const clearBayWidthsMM=g.layout.gapsMM.map(gap=>gap-g.truss.flangeWidthMM);
 const slabAreaM2=clearBayWidthsMM.reduce((s,v)=>s+v,0)*2*runMM/1e6;
 const flatWidthMM=g.truss.closure.cutLengthMM;
 const ceilingSlopeLengthMM=(g.widthMM-flatWidthMM)/cos;
 const ceilingAreaM2=(ceilingSlopeLengthMM+flatWidthMM)*g.projectionMM/1e6;
 const externalAreaM2=g.feet.reduce((s,f)=>s+f.externalSlopeMM+50/cos,0)*(g.manufacturingProjectionMM??g.externalProjectionMM)/1e6;
 const board=(netAreaM2,config,waste)=>{
  const sheetAreaM2=Number(config.sheet_w_m??1.2)*Number(config.sheet_h_m??2.4);
  const wastePercent=rate(waste??config.waste_pct??5),orderAreaM2=wastePercent==null?null:netAreaM2*(1+wastePercent/100);
  const sheets=sheetAreaM2>0&&orderAreaM2!=null?Math.ceil(orderAreaM2/sheetAreaM2):null;
  const price=rate(config.price_per_sheet),weight=rate(config.weight_kg_per_m2);
  return {netAreaM2,orderAreaM2,wastePercent,sheetAreaM2,sheets,cost:sheets==null||price==null?null:sheets*price,installedWeightKg:weight==null?null:netAreaM2*weight};
 };
 const pir50=board(cradleAreaM2+t.schedule.totals.pir50AreaM2,m.pir50||{});
 const directPir100Weight=rate(m.pir100_weight_kg_per_m2??m.pir100?.weight_kg_per_m2);
 const packArea=rate(m.pir100_pack_coverage_m2??m.slab100?.pack_coverage_m2),packWeight=rate(m.pir100_weight_kg_per_pack??m.slab100?.weight_kg_per_pack);
 const pir100Weight=directPir100Weight??(packArea>0&&packWeight!=null?packWeight/packArea:null);
 const pir100=board(slabAreaM2,{...(m.pir100||{}),weight_kg_per_m2:pir100Weight},m.slab100_wastage_pct??m.slab100?.wastage_pct??m.pir50?.waste_pct??5);
 const rollWidth=Number(m.superquilt_roll_width_mm??1200),overlap=Number(m.superquilt_overlap_mm??50),waste=Number(m.superquilt_wastage_pct??6);
 if(!Number.isFinite(rollWidth)||!Number.isFinite(overlap)||!Number.isFinite(waste)||rollWidth<=0||overlap<0||overlap>=rollWidth||waste<0)return {valid:false,errors:['Invalid SuperQuilt overlap, width or waste allowance.']};
 const nominalM2=ceilingAreaM2/(1-overlap/rollWidth)*(1+waste/100);
 const option=size=>(m.superquilt_options||[]).find(o=>Number(o.coverage_m2)===size);
 const price12=rate(m.superquilt_12m_price_each??option(12)?.price_per_roll),price15=rate(m.superquilt_15m_price_each??option(15)?.price_per_roll);
 const mix=chooseSuperQuiltMix({requiredNominalM2:nominalM2,price12:price12??0,price15:price15??0});
 const weights=coveringWeightRates(m);
 return {valid:true,readOnly:true,errors:[],cradle:{runMM:cradleRunMM,apexRunMM:runMM,gussetHalfWidthMM,stripWidthMM:140,totalLengthM:cradleLengthM,netAreaM2:cradleAreaM2,facesPerSide,rearFaces:1,frontFaces:1,intermediateFaces:2},pir50,pir100,slab:{runMM,clearBayWidthsMM,netAreaM2:slabAreaM2},ceiling:{flatWidthMM,slopeLengthMM:ceilingSlopeLengthMM,areaM2:ceilingAreaM2},superQuilt:{installedAreaM2:ceilingAreaM2,nominalM2,...mix,cost:(mix.rolls12&&price12==null)||(mix.rolls15&&price15==null)?null:mix.cost,installedWeightKg:ceilingAreaM2*weights.superQuiltKgPerM2},membrane:{installedAreaM2:externalAreaM2,rolls:1,cost:rate(m.breather_roll_price_each??m.breatherMembrane?.price_per_roll),installedWeightKg:externalAreaM2*weights.membraneKgPerM2,coverageReview:externalAreaM2>50},plasterboard:{installedAreaM2:ceilingAreaM2,sheets:Math.ceil(ceilingAreaM2/2.88),installedWeightKg:ceilingAreaM2*8.5,supplyIncluded:false},notes:[
 'Rear and front trusses have one inward cradle face per member; intermediate trusses have two. 140mm strips follow the existing web allowance.',
 '50mm cradle strips run from the ring-beam upstand at the outside frame line to the outer edge of the 9mm gusset: (half internal span + frame thickness − half gusset width) / cosine(pitch). They do not extend to the apex. Soffit extensions are excluded.',
 '100mm slab clear widths use 45mm actual member thickness. Ring-beam upstands use the separate 48mm fitting slots. 100mm PIR continues on both pitches from the ring-beam upstands to the apex, with chamfered meeting edges. Expanding foam seals joints against PIR and joists.',
 'Cradles exclude the gusset-covered apex section. The 140mm strip allowance does not optimise rebate machining waste. Sheet counts remain area estimates with configured waste, not an optimised cutting list.',
 '50mm PIR pools cradle and ring-beam face requirements before rounding sheets; the ring-beam face area is already shown in the timber audit, so these audit costs must not be added together.',
 'SuperQuilt and plasterboard have identical installed coverage: the two internal slopes and the 595mm flat, from the house wall to the inside of the front frame. Neither extends over the front overhang. SuperQuilt roll mix uses the existing overlap/waste selector; weight uses installed area.',
 'Membrane covers both external roof faces out to the tile-starter edges, including the 50mm plan extension at each eaves, over the manufacturing projection. Overlaps and gutter drape are supply allowances, not extra installed face weight. One roll per roof is retained; coverage over 50m² needs review.',
 'Plasterboard weight is shown once for the finished ceiling. Its sheet count is informational; no supply cost is added.',
 'Read-only candidates: no Summary, quotation, manufacture book or Idiot List quantities are changed.'
 ]};
}
