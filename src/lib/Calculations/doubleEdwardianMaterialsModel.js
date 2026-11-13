import {buildDoubleEdwardianValleyOrder,valleyOutletCount} from './doubleEdwardianValleyOrder';
import {buildSummaryAddedItemLines} from './summaryAddedItems';
import {buildDoubleEdwardianGeometry} from '../geometry/doubleEdwardianGeometry';
import {doubleEdwardianSurface,developedDoubleEdwardianFacets,internalDoubleEdwardianLaths} from '../geometry/doubleEdwardianSurfaces';
import {solveFacetEavesGeometry} from '../geometry/facetEavesGeometry';
import {alignChamferedLathEaves} from '../geometry/alignChamferedLathEaves';
import {buildRingBeam} from '../Manufacturing/ringBeamBuilder';
import {applyRectangularRingBeamJoints} from '../Manufacturing/rectangularRingBeamJoints';
import {buildRingBeamManufactureSchedule} from '../Manufacturing/ringBeamManufactureSchedule';
import {buildCentralBossTrussAudit} from '../geometry/centralBossTrussAudit';
import {buildEdwardianPlasticsGutteringAudit} from './edwardianPlasticsGutteringAudit';
import {calculateRoofTiling} from './facetTilingCalc';
import {orderSteelHipRidgeRuns} from './steelHipRidgeOrder';
import {buildHipRidgeLathIntegrationAudit} from './hipRidgeLathIntegrationAudit';
import {planPlasticsStock} from './plasticsIntegrationAudit';
import {chooseSuperQuiltMix} from './insulationIntegrationAudit';
import {coveringWeightRates,apportionInstalledWeight} from './installedCoveringWeights';
import {getSlatePitchRule} from './tileProductConfig';
import {getFixedProductWeightKg} from '../utils/weights';
import {buildFactoryStapleAllowance} from './factoryStapleAllowance';
const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
const first=(...values)=>values.map(rate).find(v=>v!=null)??null;
const round=n=>Number(n.toFixed(2));
export function buildDoubleEdwardianMaterialsModel({inputs={},materials:m={}}={}){
 const g=buildDoubleEdwardianGeometry(inputs),fail=error=>({valid:false,errors:[error],sections:{},pricingReady:false,missingPrices:[],supplyReviews:[]});
 if(!g.valid)return fail(g.error);
 const product=inputs.tileProductId||'britmetShingle',steel=product==='britmetShingle';if(!['britmetShingle','liteSlate'].includes(product))return fail('Choose Britmet or LiteSlate.');
 const eaves=alignChamferedLathEaves(solveFacetEavesGeometry({requestedReferenceSoffitMM:g.soffitMM,referencePitchDeg:g.pitchDeg,leftPitchDeg:g.pitchDeg,rightPitchDeg:g.pitchDeg,hasLeftFacet:true,hasRightFacet:true,materials:{...m,side_frame_thickness_mm:g.frameMM},minimumSoffitMM:25,manufacturingRoundIncrementMM:5,fasciaThicknessMM:Number(m.fascia_thickness_mm??10),plyProjectionAllowanceMM:Number(m.ply_projection_allowance_mm??5),fasciaLipMM:Number(m.fascia_lip_mm??25)}));
 if(!eaves.solutionValid)return fail('The shared eaves solver could not resolve this roof.');
 const base=eaves.referenceBaseWidthMM,raw=eaves.referenceGeometry.raw,cos=Math.cos(g.pitchDeg*Math.PI/180),tan=Math.tan(g.pitchDeg*Math.PI/180);
 // Existing rectangular layer cuts; both rear side ends are square at the plate.
 const definitions=['left','front','right'].map(side=>{
  const group=g.layout.groups.find(f=>f.id===side),length=group.length;
  const slots=[{leftMM:0,rightMM:48},...group.centresMM.map(t=>({leftMM:t-24,rightMM:t+24})),{leftMM:length-48,rightMM:length}];
  return {id:side==='front'?'facet-front':`facet-${side}-side`,side,slots,ringBeam:buildRingBeam({id:`double-${side}`,label:side+' ringbeam',internalLengthMM:length,externalLengthMM:length+(side==='front'?2*base:base),baseWidthMM:base,pitchDeg:g.pitchDeg,soffitDepthMM:g.soffitMM,plumbCutHeightMM:raw.manufacturedPlumbCutHeightMM,bayWidthsMM:slots.slice(1).map((s,i)=>s.leftMM-slots[i].rightMM)})};
 });
 if(definitions.some(f=>f.slots.slice(1).some((s,i)=>s.leftMM<=f.slots[i].rightMM)))return fail('Member slots overlap at the ringbeam. Review manual positions before pricing.');
 const ringFacets=applyRectangularRingBeamJoints({facets:definitions,widthMM:g.widthMM,projectionMM:g.projectionMM,externalWidthMM:g.widthMM+2*base,externalProjectionMM:g.projectionMM+base,leftAllowanceMM:base,rightAllowanceMM:base});
 const ring=buildRingBeamManufactureSchedule({members:ringFacets.map(f=>({id:f.ringBeam.id,side:f.side,ringBeam:f.ringBeam}))});if(!ring.valid)return fail(ring.errors.join(' '));
 // Reuse the existing plastics/gutter adapter with these exact three open beams.
 // Its geometry-only ring lookup is supplied matching centres (including rear hip seats).
 const plasticGeometry={...g,frameMM:g.frameMM,frontPitchDeg:g.pitchDeg,externalLeftMM:base,externalRightMM:base,externalFrontMM:base,externalWidthMM:g.widthMM+2*base,externalProjectionMM:g.projectionMM+base,eaves,layout:{centresMM:[24],trussCount:0},frontRafters:g.layout.groups.find(f=>f.id==='front').centresMM.map(centreMM=>({centreMM,role:'rafter'})),sideJacks:g.layout.groups.filter(f=>['left','right'].includes(f.id)).flatMap(f=>f.centresMM.map(positionMM=>({side:f.id,positionMM})))};
 const plastics=buildEdwardianPlasticsGutteringAudit({geometry:plasticGeometry,materials:m,plasticsColour:inputs.plasticsColour||'white',gutterProfile:inputs.gutterProfile||'square'});if(!plastics.valid)return fail(plastics.errors.join(' '));
 const ceiling=doubleEdwardianSurface(g,{flatWidthMM:Math.min(595,Math.min(g.widthMM,g.projectionMM)-1)}),frameSurface=doubleEdwardianSurface(g,{extensionMM:g.frameMM}),tileSurface=doubleEdwardianSurface(g,{extensionMM:base+50});
 const facets=developedDoubleEdwardianFacets(g,tileSurface).map(f=>({...f,omitLowestCourse:f.id==='rear',...(!steel&&f.topEdgeType==='ridge'?{topEdgeType:'gableRidgeWithoutExtraCourse'}:{})})),result=calculateRoofTiling({facets,product});if(result.errors.length)return fail(result.errors.join(' '));
 const hipPitch=Math.atan(tan/Math.SQRT2),edgeRuns=g.hips.map(([a,b],i)=>{const rear=a.y===0,exit=rear?0:base*Math.SQRT2;return {id:`hip-${i+1}`,kind:'hip',lengthMM:(Math.hypot(a.x-b.x,a.y-b.y)+exit)/Math.cos(hipPitch)};});
 if(g.ridgeLengthMM>0)edgeRuns.unshift({id:'ridge',kind:'ridge',lengthMM:g.ridgeLengthMM});
 const edges=steel?orderSteelHipRidgeRuns(edgeRuns):edgeRuns.map(e=>({...e,tileQty:Math.ceil(e.lengthMM/1000*5.5)}));
 const support=buildHipRidgeLathIntegrationAudit({edgeModel:{valid:true,edges},tileSystem:product,materials:m});
 const sections=Object.fromEntries(['timber','tiles','plastics','metal','gutters','misc'].map(key=>[key,{lines:[]}])) , reviews=[];
 const add=(section,key,label,qty,units,price,weight,extra={})=>{const p=rate(price),kg=rate(weight);sections[section].lines.push({key,label,qty,order_qty:qty,units,unit:p??0,line:qty===0?0:p==null?0:round(qty*p),weight_kg:kg??0,price_unconfigured:qty>0&&p==null,weight_unconfigured:qty>0&&kg==null,...extra});};
 const valley=buildDoubleEdwardianValleyOrder(g,inputs);
 const positivePrice=value=>rate(value)>0?rate(value):null;
 if(valley){
  add('timber','double_valley_osb','18mm OSB — rear valley boards',valley.sheets,'Sheets',positivePrice(m.osb18_sheet_price),null);
  if(valley.error)reviews.push(valley.error);
  for(const {length,qty} of valley.epdm){
   const price=positivePrice(m.epdm_rubber_price_per_m2);
   add('misc','double_valley_epdm_'+length,`EPDM — 1 m × ${length/1000} m rear valley strip`,qty,'Strips',price==null?null:price*length/1000,null);
  }
  if(valley.epdm.length){
   add('misc','double_valley_deck_adhesive','Deck adhesive (2.5 L) — rear valley',1,'Tub',positivePrice(m.deck_adhesive_2_5l_price_each),rate(m.deck_adhesive_2_5l_weight_kg_each));
   add('misc','double_valley_bond_adhesive','Bond adhesive (can) — rear valley',1,'Can',positivePrice(m.bond_adhesive_can_price_each),rate(m.bond_adhesive_can_weight_kg_each));
  }
 }
 const timber=(key,label,qty,config,unit,price=config?.price_per_m2??config?.price_per_m,kg=config?.weight_kg_per_m2??config?.weight_kg_per_m)=>{const waste=rate(config?.waste_percent??config?.waste_pct??m.global_waste_percent??10);add('timber',key,label,qty,unit,price==null||waste==null?null:Number(price)*(1+waste/100),rate(kg)==null?null:qty*Number(kg),{used_qty:qty,wastePercent:waste,supplyToSite:false});};
 const paired=new Set(g.layout.trusses.flatMap(t=>t.legs));
 const memberLengths=g.layout.members.map(r=>{const run=Math.hypot(r.end.x-r.start.x,r.end.y-r.start.y),isHip=r.kind==='Hip',angle=isHip?hipPitch:g.pitchDeg*Math.PI/180,extension=r.rearSupport?0:isHip?base*Math.SQRT2:raw.manufacturedHorizontalFootCutMM;return {...r,internalSlopeMM:run/Math.cos(angle),lengthMM:(run+extension)/Math.cos(angle)};});
 const joistM=memberLengths.reduce((n,r)=>n+r.lengthMM/1000,0)+g.externalWidthMM/1000;
 timber('double_joists','220mm joists — roof members and valley plate',joistM,m.steico,'m');
 const truss=buildCentralBossTrussAudit({widthMM:Math.min(g.widthMM,g.projectionMM),projectionMM:Math.min(g.widthMM,g.projectionMM)/2,frontPitchDeg:g.pitchDeg,trussPitchDeg:g.pitchDeg,sideHfcMM:raw.manufacturedHorizontalFootCutMM});if(!truss.valid)return fail(truss.errors.join(' '));
 const count=g.layout.trusses.length,totals=ring.totals;
 timber('double_gussets','9mm truss gussets — two faces',2*count*truss.gusset.areaEachM2,m.ply9mm,'m²');
 timber('double_chevrons','18mm truss chevrons — two faces',2*count*truss.chevron.areaEachM2,m.ply18mm,'m²');
 timber('double_closures','Truss closures — assembled offcuts',count*truss.closure.cutLengthMM/1000,{},'m',m.truss_closure_45x45_price_per_m,m.truss_closure_45x45_weight_kg_per_m);
 timber('double_pse','30×95 PSE — three ringbeams',totals.pse30x90LengthM,m.pse30x90,'m',m.ringbeam_pse90x30_per_m??m.pse30x90?.price_per_m);
 timber('double_base_ply','9mm ringbeam bases and upstands',totals.ply9BaseAreaM2+totals.ply9UpstandAreaM2,m.ply9mm,'m²');
 timber('double_plate_ply9','9mm valley plate face and rear packers',g.externalWidthMM*220/1e6+Math.ceil(g.externalWidthMM/800)*75*220/1e6,m.ply9mm,'m²');
 timber('double_plate_ply18','18mm valley plate web infill',g.externalWidthMM*143/1e6,m.ply18mm,'m²');
 const runs=result.facets.flatMap(f=>f.lathRows.map((r,i)=>({edgeId:f.facet.id+'-'+i,runM:r.widthMM/1000,widthMM:50}))),internal=internalDoubleEdwardianLaths(g,ceiling);
 internal.forEach(r=>runs.push({edgeId:r.id,runM:r.lengthMM/1000,widthMM:50}));
 support.rows.forEach(r=>{if(r.lathQty)for(let i=0;i<2;i++)runs.push({edgeId:r.edgeId+'-'+i,runM:r.edgeLengthM,widthMM:50});});
 ringFacets.forEach(f=>{runs.push({edgeId:f.id+'-outer',runM:f.ringBeam.layerProfiles.outerLath25x50.externalEdgeLengthMM/1000,widthMM:50});f.ringBeam.bayWidthsMM.forEach((length,i)=>runs.push({edgeId:f.id+'-finish-'+i,runM:length/1000,widthMM:50}));});
 const stock=Number(m.lath_stock_length_m??4.8);if(!(stock>0))return fail('Lath stock length must be positive.');const lathPlan=planPlasticsStock(runs,stock),lathM=runs.reduce((n,r)=>n+r.runM,0);
 add('timber','double_laths','25×50 laths — pooled internal, external, ringbeam and supports',lathPlan.qty,'Lengths',rate(m.lath25x50?.price_per_m)==null?null:stock*Number(m.lath25x50.price_per_m),rate(m.chamferLath?.weight_kg_per_m)==null?null:lathM*Number(m.chamferLath.weight_kg_per_m),{used_m:lathM,supplyToSite:false});
 const prefix=steel?'britmet':'liteslate',tileKg=first(m.tile_britmet_weight_kg,m.britmetShingle?.weight_kg_per_tile),slateKg=first(m.liteslate_tile_weight_kg_each,m.liteslate_tile_weight_kg),density=steel?Number(m.tile_britmet_tiles_per_m2??3.2):getSlatePitchRule(product,g.pitchDeg).slatesPerM2;
 add('tiles','double_tiles','Main tiles — roof-wide allowance once',result.tileQuantityOrdered,'Tiles',steel?m.tile_britmet_price_each:m.liteslate_tile_price_each,(steel?tileKg:slateKg)==null?null:(tileSurface.areaM2-result.facets.reduce((sum,f)=>sum+(f.untiledAreaM2??0),0))*density*(steel?tileKg:slateKg));
 const edgeQty=edges.reduce((n,e)=>n+e.tileQty,0),ridgeKg=steel?getFixedProductWeightKg('hip_ridge'):first(m.liteslate_ridge_tile_weight_kg,m.ridge_tile_liteslate_weight_kg);
 add('tiles','double_edge_tiles','Hip and ridge tiles — four hips and ridge',edgeQty,'Tiles',m[`${prefix}_ridge_tile_price_each`],ridgeKg==null?null:edgeQty*ridgeKg);
 const junctionQty=g.ridgeLengthMM>0?2:1;
 add('tiles','double_junction',g.ridgeLengthMM>0?'Three-way ridge/hip adaptors — both ridge ends':'Four-way apex cover — confirm product',junctionQty,'Each',g.ridgeLengthMM>0?steel?m.britmet_y_adaptor_price_each:first(m.liteslate_three_way_adaptor_price,m.liteslate_ridge_hip_adaptor_price_each):m.double_edwardian_apex_cover_price_each,g.ridgeLengthMM>0?rate(m[`${prefix}_y_adaptor_weight_kg`])==null?null:junctionQty*Number(m[`${prefix}_y_adaptor_weight_kg`]):rate(m.double_edwardian_apex_cover_weight_kg));
 add('tiles','double_caps','90° hip end caps — one per hip',4,'Each',first(m[`${prefix}_hip_end_cap_90_price_each`],m[`${prefix}_hip_end_cap_90_price`]),steel?4*getFixedProductWeightKg('hip_end_cap_90'):rate(m.liteslate_hip_end_cap_weight_kg_each)==null?null:4*Number(m.liteslate_hip_end_cap_weight_kg_each));
 if(steel){const vents=Math.ceil(2*g.ridgeLengthMM/500);add('tiles','double_vents','500mm ridge ventilation strips',vents,'Strips',m.britmet_vent_strip_price_each,rate(m.vent_strip_weight_kg)==null?null:vents*Number(m.vent_strip_weight_kg));add('misc','double_hip_tape','Expanding foam tape — hip laths only',support.quantities.tapeRollQty,'Rolls',m.expanding_foam_roll_price_each,support.tapeInstalledWeightKg);add('tiles','double_touchup','Steel tile touch-up kit',1,'Kit',first(m.touchup_kit_britmet_price_each,m.touchUpKitBritmet?.price_each),0);}else add('tiles','double_ridge_poly','Surplus 6mm twinwall — ridge ventilation',Math.ceil(2*g.ridgeLengthMM/3000),'3m strips',0,rate(m.polycarbonate_6mm_weight_kg_per_m2)==null?null:2*g.ridgeLengthMM/1000*0.05*Number(m.polycarbonate_6mm_weight_kg_per_m2));
 const openEavesM=(2*(g.projectionMM+base)+g.widthMM+2*base)/1000,starterQty=Math.ceil(openEavesM/3);
 add('metal','double_starter','Standard tile starter — three open eaves only',starterQty,'3m lengths',first(m.tile_starter_price_each,m.eaves_guard_price_each,m.metal?.tile_starter?.price_each),rate(m.eaves_guard_weight_kg)==null?null:openEavesM/3*Number(m.eaves_guard_weight_kg));
 // The rear valley is present regardless of the selected liner or adjoining surface.
 const valleyStockUse=g.externalWidthMM/3000, valleyStockQty=Math.ceil(valleyStockUse);
 const valleyStarterWeight=rate(m.valley_tile_starter_weight_kg_each)??1.5;
 const valleyPolyWeight=rate(m.valley_vent_poly_weight_kg_per_strip);
 add('metal','double_valley_starter','Valley Tile Starter — rear valley, 150mm wide',valleyStockQty,'3m lengths',rate(m.valley_tile_starter_price_each)??5.8,valleyStockUse*valleyStarterWeight);
 add('tiles','double_valley_vent_poly','6mm polycarbonate strip — rear valley ventilation',valleyStockQty,'3m strips',rate(m.valley_vent_poly_price_per_strip)??0,valleyPolyWeight==null?null:valleyStockUse*valleyPolyWeight);
 const hardware=(key,label,qty,price,kg)=>add('metal',key,label,qty,'Each',price,kg==null?null:qty*kg);
 hardware('double_variable_hangers','Variable Joist Hangers — rear rafters/trusses',g.layout.hangers.variable,first(m.joist_hanger_variable_price_each,m.variable_joist_hanger_price_each,m.metal?.joist_hanger_variable?.price_each),first(m.joist_hanger_variable_weight_kg_each,m.variable_joist_hanger_weight_kg_each));
 hardware('double_hip_hangers','Hip Hangers — two rear hips',g.layout.hangers.hip,m.hip_hanger_price_each,rate(m.hip_hanger_weight_kg_each));
 hardware('double_bosses','Boss / rafter terminals',junctionQty,first(m.boss_rafter_terminal_price_each,m.boss_price_each,m.metal?.boss_rafter_terminal?.price_each),getFixedProductWeightKg('boss_rafter_terminal'));
 const nonTrussRidge=g.layout.members.filter(r=>r.kind!=='Hip'&&r.kind!=='Jack rafter'&&!paired.has(r.id)).length,sparPairs=4+nonTrussRidge,jacks=g.layout.members.filter(r=>r.kind==='Jack rafter').length;
 hardware('double_spar_hooks','Spar hooks — hips and unpaired ridge rafters',2*sparPairs,first(m.spar_hook_price_each,m.metal?.spar_hook?.price_each),getFixedProductWeightKg('spar_hook'));
 for(const [key,label] of [['jack_rafter_hook','Jack rafter hooks'],['jack_rafter_bracket','Jack rafter brackets']])hardware('double_'+key,label,jacks,first(m[key+'_price_each'],m.metal?.[key]?.price_each),getFixedProductWeightKg(key));
 hardware('double_corner_braces','Ringbeam corner braces — front corners',2,m.ringbeam_corner_brace_price_each,rate(m.ringbeam_corner_brace_weight_kg_each));
 const band=plastics.band,pa=plastics.plastics;
 plastics.plasticLines.forEach(r=>{let kg=null;if(r.key.startsWith('fascia-')){const width=Number(r.key.split('-')[1]),used=pa.fasciaPlan.boards.filter(b=>b.widthMM===width).reduce((n,b)=>n+b.pieces.reduce((s,a)=>s+a.lengthM,0),0);kg=rate(m[`fascia_weight_kg_per_m_${band}`])==null?null:used*Number(m[`fascia_weight_kg_per_m_${band}`]);}else if(r.key.startsWith('soffit-')){const width=Number(r.key.split('-')[1]),used=pa.soffitPlan.boards.filter(b=>b.widthMM===width).reduce((n,b)=>n+b.strips.reduce((s,t)=>s+t.pieces.reduce((u,a)=>u+a.lengthM,0),0),0);kg=rate(m[`soffit_weight_kg_per_m_${band}`])==null?null:used*Number(m[`soffit_weight_kg_per_m_${band}`]);}else if(r.key==='fascia_corners'||r.key==='fascia_joints'){const unit=rate(m[r.key==='fascia_corners'?'fascia_corner_weight_kg_each':'fascia_joint_weight_kg_each']);kg=unit==null?null:r.qty*unit;}else if(r.key==='j_trim'){const unit=rate(m[`j_section_weight_kg_each_${band}`]);kg=unit==null?null:pa.accessories.jRunM/pa.accessories.jStockM*unit;}else if(r.key==='factory_venting')kg=0;add(r.key==='polytop_pins'?'misc':'plastics','double_plastic_'+r.key,r.label,r.qty,r.unit,r.qty?rate(r.cost)==null?null:r.cost/r.qty:0,kg);});
 const gutterKgKeys={g_union:['gutter_union_weight_kg','gutter_union_weight_kg_each'],g_brkt:['gutter_bracket_weight_kg','gutter_bracket_weight_kg_each'],g_corner_90:['gutter_corner_weight_kg','gutter_corner_weight_kg_each'],g_outlet:['gutter_outlet_weight_kg','running_outlet_weight_kg_each'],g_stop:['gutter_stop_end_weight_kg','stop_end_weight_kg_each'],dp_len:['dp_length_weight_kg_each','downpipe_length_weight_kg'],dp_bend:['downpipe_bend_weight_kg','dp_bend_weight_kg_each'],dp_clip:['downpipe_clip_weight_kg','dp_clip_weight_kg_each'],dp_shoe:['downpipe_shoe_weight_kg','dp_shoe_weight_kg_each'],dp_adaptor:['downpipe_adaptor_weight_kg','dp_adaptor_weight_kg_each']};
 const outlets=valleyOutletCount(inputs);
 plastics.gutterLines.forEach(r=>{const kg=r.key==='g_len'?rate(m[`gutter_${inputs.gutterProfile||'square'}_weight_kg_per_m`]):first(...(gutterKgKeys[r.key]||[]).map(k=>m[k]));const qty=r.key.startsWith('dp_')||r.key==='g_outlet'?r.qty*outlets:r.qty;add('gutters','double_'+r.key,r.label,qty,r.unit,r.qty?rate(r.cost)==null?null:r.cost/r.qty:0,kg==null?null:kg*(r.key==='g_len'?plastics.guttering.totalRunM:qty));});
 const frameExtension=r=>r.rearSupport?0:r.kind==='Hip'?g.frameMM*Math.SQRT2/Math.cos(hipPitch):g.frameMM/cos;
 const cradleM=memberLengths.reduce((n,r)=>n+2*Math.max(0,r.internalSlopeMM+frameExtension(r)-(paired.has(r.id)?297.5/cos:0))/1000,0),footprint=memberLengths.reduce((n,r)=>n+(r.internalSlopeMM+frameExtension(r))*45/1e6,0);
 const pir50Area=cradleM*0.14+totals.pir50AreaM2,pir100Area=Math.max(0,frameSurface.areaM2-footprint);
 for(const [key,area,label] of [['pir50',pir50Area,'50mm PIR — cradles and ringbeam faces'],['pir100',pir100Area,'100mm PIR — outside-frame area less timber']]){const cfg=m[key]||{},sheet=Number(cfg.sheet_w_m??1.2)*Number(cfg.sheet_h_m??2.4),waste=Number(key==='pir100'?m.slab100_wastage_pct??m.slab100?.wastage_pct??m.pir50?.waste_pct??5:cfg.waste_pct??5);if(!(sheet>0)||!Number.isFinite(waste)||waste<0)return fail('Invalid PIR sheet dimensions or waste.');const qty=Math.ceil(area*(1+waste/100)/sheet),kg=key==='pir100'?first(m.pir100_weight_kg_per_m2,cfg.weight_kg_per_m2,Number(m.pir100_weight_kg_per_pack??m.slab100?.weight_kg_per_pack)/Number(m.pir100_pack_coverage_m2??m.slab100?.pack_coverage_m2)):rate(cfg.weight_kg_per_m2);add('misc','double_'+key,label,qty,'Sheets',cfg.price_per_sheet,kg==null?null:area*kg,{used_m2:area});}
 const overlap=Number(m.superquilt_overlap_mm??50),rollWidth=Number(m.superquilt_roll_width_mm??1200),waste=Number(m.superquilt_wastage_pct??6);if(!(rollWidth>overlap&&overlap>=0&&waste>=0))return fail('Invalid quilt overlap or waste.');
 const nominal=ceiling.areaM2/(1-overlap/rollWidth)*(1+waste/100),price12=first(m.superquilt_12m_price_each,(m.superquilt_options||[]).find(o=>Number(o.coverage_m2)===12)?.price_per_roll),price15=first(m.superquilt_15m_price_each,(m.superquilt_options||[]).find(o=>Number(o.coverage_m2)===15)?.price_per_roll),mix=chooseSuperQuiltMix({requiredNominalM2:nominal,price12:price12??0,price15:price15??0}),weights=coveringWeightRates(m),quiltWeights=apportionInstalledWeight(ceiling.areaM2,weights.superQuiltKgPerM2,[mix.rolls12*12,mix.rolls15*15]);
 [12,15].forEach((size,i)=>add('misc','double_quilt_'+size,`SuperQuilt — ${size}m² rolls`,i?mix.rolls15:mix.rolls12,'Rolls',i?price15:price12,quiltWeights[i]));
 add('misc','double_membrane','Breather membrane — 50m² rolls',Math.ceil(tileSurface.areaM2/50),'Rolls',first(m.breather_roll_price_each,m.breatherMembrane?.price_per_roll),tileSurface.areaM2*weights.membraneKgPerM2);
 const box=(qty,size,price)=>Number.isInteger(Number(size))&&Number(size)>0?{qty:Math.ceil(qty/Number(size)),price}:null;
 const fix=(key,label,units,size,price)=>{const b=box(units,size,price);if(!b)reviews.push('Invalid pack size for '+label);else add('misc',key,label,b.qty,'Boxes',price,null,{requiredUnits:units});};
 const tileUnits=result.tileQuantityOrdered*Number(steel?m.tileFixings?.per_tile_britmet??3:m.tileFixings?.per_tile_liteslate??2)+edgeQty*4+8+junctionQty*6;
 fix('double_tile_screws','Tile, hip/ridge, cap and junction screws',tileUnits,m.tileFixings?.units_per_box??200,first(m.screws_1x8_price_per_box,m.tileFixings?.price_per_box));
 fix('double_eaves_screws','5×80 member foot screws',g.layout.members.length*2,m.rafterEavesScrews?.units_per_box??200,first(m.screws_3x10_price_per_box,m.rafterEavesScrews?.price_per_box));
 const externalFixings=result.facets.reduce((n,f)=>n+f.lathRows.reduce((s,r)=>s+(r.widthMM>0?Math.ceil(r.widthMM/665)+1:0),0),0)+support.rows.reduce((n,r)=>n+r.lathQty*(Math.ceil(r.edgeLengthM*2)+1),0),internalFixings=internal.reduce((n,r)=>n+Math.ceil(r.lengthMM/665)+1,0);
 fix('double_external_lath_screws','External lath screws — 250 per box',externalFixings,250,first(m.screws_2x8_price_per_box,m.lathFixings?.price_per_box));fix('double_internal_lath_screws','Internal lath screws — 250 per box',internalFixings,250,first(m.screws_2x8_price_per_box,m.lathFixings?.price_per_box));
 add('misc','double_concrete','150mm concrete screws — eight-screw allowance',8,'Screws',rate(m.concrete_screws_price_per_box)==null?null:Number(m.concrete_screws_price_per_box)/Number(m.concrete_screws_units_per_box??100),null);
 add('misc','double_foam','Expanding foam',2,'Cans',first(m.expanding_foam_can_price_each,m.expandingFoam?.price_each),null);add('misc','double_alu_tape','Aluminium tape',1,'Roll',first(m.aluminium_tape_roll_price_each,m.aluRollTape?.price_each),null);add('misc','double_glue','D4 glue — factory allowance',1,'Tub',m.d4_glue_price_per_tub,null,{supplyToSite:false});
 for(const [key,label,qty,priceKey,sizeKey] of [['double_factory_screws','Factory screws consumed',sparPairs*14+jacks*10+junctionQty*6,'screws_1_5x10_price_per_box','screws_1_5x10_units_per_box'],['double_rivets','Spar-hook rivets consumed',sparPairs*4,'spar_hook_rivets_price_per_box','spar_hook_rivets_units_per_box']])add('misc',key,label,qty,'Consumed',rate(m[priceKey])==null||!(Number(m[sizeKey])>0)?null:Number(m[priceKey])/Number(m[sizeKey]),null,{supplyToSite:false});
 const staples=buildFactoryStapleAllowance({trussCount:count,ringBeamLengthM:openEavesM,materials:m});if(!staples.valid)return fail(staples.errors.join(' '));add('misc','double_staples',staples.label,staples.qty,staples.unit,staples.cost==null?null:staples.qty?staples.cost/staples.qty:0,staples.installedWeightKg,{supplyToSite:false});
 if(g.layout.warnings.length)reviews.push(...g.layout.warnings);
 if(g.ridgeLengthMM===0)reviews.push('Square point-apex roof: confirm crossing truss assembly and apex cover before issuing a price.');
 for(const row of buildSummaryAddedItemLines(inputs.summaryAddedItems||[],m))sections[row.section].lines.push({...row,excluded:row.extraExcluded,weight_unconfigured:false});
 const pricingState=inputs.summaryPricingState||{};
 for(const section of Object.values(sections)){section.lines=section.lines.map(r=>{const delta=r.isAddedItem?0:Number(pricingState.adjustments?.[r.key]??0),qty=Math.max(0,r.qty+(Number.isFinite(delta)?delta:0));return {...r,qty,order_qty:qty,line:round(qty*r.unit),excluded:r.isAddedItem?Boolean(r.extraExcluded):Boolean(pricingState.exclusions?.[r.key]),price_unconfigured:qty>0&&r.price_unconfigured};});const cost=round(section.lines.reduce((n,r)=>n+(r.excluded?0:r.line),0));section.totals={cost,chargeableCost:cost,weight:round(section.lines.reduce((n,r)=>n+r.weight_kg,0))};}
 const all=Object.values(sections).flatMap(s=>s.lines),materialsCost=round(Object.values(sections).reduce((n,s)=>n+s.totals.cost,0)),materialsWeightKg=round(Object.values(sections).reduce((n,s)=>n+s.totals.weight,0)),plasterboardWeightKg=round(ceiling.areaM2*8.5),missingPrices=all.filter(r=>!r.excluded&&r.qty>0&&r.price_unconfigured),missingWeights=all.filter(r=>r.qty>0&&r.weight_unconfigured);
 return {valid:true,errors:[],sections,audits:{geometry:g,valley,eaves,ring,plastics,tiles:{result,edges,surface:tileSurface},ceiling,frameSurface,memberLengths,internalLaths:internal,lathPlan},materialsCost,materialsBaseCost:materialsCost,materialsCostForPricing:materialsCost,plasterboard:{sheets:Math.ceil(ceiling.areaM2/2.88),installedAreaM2:ceiling.areaM2},materialsWeightKg,plasterboardWeightKg,installedWeightKg:round(materialsWeightKg+plasterboardWeightKg),missingPrices,missingWeights,weightComplete:missingWeights.length===0,supplyReviews:reviews,pricingReady:missingPrices.length===0&&reviews.length===0,pricingSections:Object.fromEntries(Object.entries(sections).map(([k,s])=>[k,s.totals.cost])),notes:['Provisional estimate: the rear valley includes OSB when the adjoining surface is selected, and rubber and adhesives when EPDM is selected. The rear tile estimate omits the lowest course only. The valley starter and 6mm ventilation strip cover one full rear run. Lath and hip set-out remain provisional. GRP materials and rear hip weathering are excluded.','Open-eaves materials use the shared manufacturing ply-base projection, including its 5mm ply allowance beyond the frame/soffit outline shown on the preview. Rear projection is not extended.',
 'No physical ridge timber, rear fascia/soffit/gutter or sloping house-wall watercourse is included. The valley plate is counted once.','Joist quantities use full resolved plan-to-slope member envelopes pending cutting integration; factory connection deductions are not yet applied.','PIR uses outside-frame surface excluding soffits. Quilt and plasterboard use the finished four-slope ceiling and clipped 595mm flat.','Lath screw counts and cradle areas remain explicit estimating allowances pending manufacture reconciliation. Ordered surplus affects cost, not installed weight.']};
}
