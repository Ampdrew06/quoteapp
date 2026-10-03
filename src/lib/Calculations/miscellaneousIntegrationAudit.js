import { buildHippedLathFixingAudit } from './hippedLathFixingAudit';

const n=value=>Math.max(0,Number(value)||0);
export function buildHippedMiscellaneousIntegrationAudit({geometry,internalAreaM2,externalAreaM2,tileQuantity,tileSystem='britmet',materials={},legacyLines=[],edgeLines=[],roofInputs={},automaticResult=null,insulationAudit=null,edgeModel=null}={}) {
  const errors=[];
  if(!geometry || !(Number(internalAreaM2)>0)) errors.push('Valid hipped geometry and internal facet area are required.');
  const internal=n(internalAreaM2), external=n(externalAreaM2);
  const system=String(tileSystem).toLowerCase();
  const slate=system==='liteslate'||system==='tapco'||system==='tapcoslate';
  const tileRate=n(slate?materials.tileFixings?.per_tile_liteslate??2:materials.tileFixings?.per_tile_britmet??3);
  const accessoryRates={hip_ridge:4,hip_end_cap_90:2,hip_end_cap_135:2};
  const accessoryUnits=edgeLines.reduce((sum,row)=>sum+n(row.order_qty??row.qty)*n(accessoryRates[row.key]),0);
  const tileUnits=n(tileQuantity)*tileRate+accessoryUnits;
  const jacks=['leftJackRafterCount','rightJackRafterCount','leftSideIntermediateJackCount','rightSideIntermediateJackCount'].reduce((sum,key)=>sum+n(geometry?.[key]),0);
  const hips=Number(geometry?.hasLeftHip===true)+Number(geometry?.hasRightHip===true);
  const siteMembers=n(geometry?.plainRafterCount)+n(geometry?.bossRafterCount)+jacks+hips;
  const siteScrews=siteMembers*2;
  const siteBoxUnits=Math.max(1,n(materials.rafterEavesScrews?.units_per_box??200));
  const siteBoxes=Math.ceil(siteScrews/siteBoxUnits);
  const boxUnits=Math.max(1,n(materials.tileFixings?.units_per_box??200));
  const tileBoxes=Math.max(1,Math.ceil(tileUnits/boxUnits));
  const find=key=>legacyLines.find(row=>row.key===key);
  const current=key=>{const row=find(key);return row?Number(row.qty??row.order_qty??0):null;};
  const candidate=(key,label,qty,rate,basis,review)=>({key,label,currentQty:current(key),candidateQty:qty,
    cost:rate==null||qty==null?null:qty*n(rate),basis,review});
  const lathAudit=buildHippedLathFixingAudit({roofInputs,geometry,automaticResult,insulationAudit,edgeModel});
  const rows=[
    candidate('expanding_foam','Expanding foam cans',2,materials.expanding_foam_can_price_each??materials.expandingFoam?.price_each,
      'Confirmed supply allowance: two cans per roof','Add extra cans manually with Summary +/- for exceptionally large roofs; no automatic area increase.'),
    candidate('alu_roll_tape','Aluminium tape',1,materials.aluminium_tape_roll_price_each??materials.aluRollTape?.price_each,
      'Confirmed supply allowance: one 50m roll per roof','Add extra rolls manually with Summary +/- when required; no automatic area increase.'),
    candidate('screws_rafter_eaves','Rafter / eaves screws',siteBoxes,materials.screws_3x10_price_per_box??materials.rafterEavesScrews?.price_per_box,`${siteMembers} plain/boss rafters, hips and jacks × 2 = ${siteScrews} screws; ${siteBoxUnits}/box`,'Confirmed provisional site allowance: two 5×80 screws per member at the ring-beam; review after physical build. Factory attachment fixings appear separately below.'),
    candidate('screws_lath_fixings','Internal / external lath screws',lathAudit.valid?lathAudit.totalBoxes:null,materials.screws_2x8_price_per_box??materials.lathFixings?.price_per_box,
      lathAudit.valid?`Internal ${lathAudit.internalScrews} screws → ${lathAudit.internalBoxes} box(es); external ${lathAudit.externalScrews} screws → ${lathAudit.externalBoxes} box(es); 250/box`:'Resolved lath rows and member profiles required',
      lathAudit.valid?`External: ${lathAudit.externalRowScrews} row intersections + ${lathAudit.supportScrews} hip/ridge support + ${lathAudit.perimeterScrews} perimeter finishing allowance. Support/finishing allowance at 500mm centres plus ends; conservative supply quantities.`:lathAudit.errors.join(' ')),
    candidate('screws_tile_fixings','Tile fixing screws',Number.isFinite(Number(tileQuantity))?tileBoxes:null,materials.screws_1x8_price_per_box??materials.tileFixings?.price_per_box,
      `${n(tileQuantity)} ordered main tiles × ${tileRate} + ${accessoryUnits} hip/cap fixings = ${tileUnits} screws; ${boxUnits}/box`,'Confirmed main-tile allowance: three per ordered steel tile, two per slate tile; review after physical tests. Additional guide: hip/ridge tile 4; hip end cap 2; Y adaptor 6; five-way adaptor 10; universal adaptor 5; gable hip end cap 3. Hip/ridge tiles and hip end caps are included from the edge BOM. Adaptors and gable end caps remain pending until their order rows are supported.'),
  ];
  const sparPairs=n(geometry?.sparHookQty)/2;
  const factoryScrews=sparPairs*14+jacks*10+n(geometry?.bossQty)*6;
  const rivets=sparPairs*4;
  const drywall=n(geometry?.plainRafterCount)*28;
  const consumedCost=(qty,priceKey,unitsKey)=>{
    const price=materials[priceKey],units=Number(materials[unitsKey]);
    return price==null||!(units>0)?null:qty*n(price)/units;
  };
  const factoryRow=(key,label,qty,cost,basis)=>({key,label,currentQty:null,candidateQty:qty,cost,basis,
    review:'Factory use: contributes to cost; already fitted when delivered, so exclude from loose-fixings Idiot List. Weight basis remains unconfigured.',usage:'factory'});
  rows.push(
    factoryRow('d4_glue','D4 glue — factory tubs',1,materials.d4_glue_price_per_tub==null?null:n(materials.d4_glue_price_per_tub),'One tub allowance per roof; consumed glue weight is not the full tub weight.'),
    factoryRow('factory_screws_1_5x10','1½-inch × 10 factory screws',factoryScrews,consumedCost(factoryScrews,'screws_1_5x10_price_per_box','screws_1_5x10_units_per_box'),`${sparPairs} spar-hook pairs × 14 + ${jacks} jack sets × 10 + ${n(geometry?.bossQty)} bosses × 6`),
    factoryRow('factory_spar_rivets','Spar-hook factory rivets',rivets,consumedCost(rivets,'spar_hook_rivets_price_per_box','spar_hook_rivets_units_per_box'),`${sparPairs} spar-hook pairs × 4 rivets`),
    factoryRow('factory_drywall_32mm','32mm factory drywall screws',drywall,consumedCost(drywall,'drywall_screws_32mm_price_per_box','drywall_screws_32mm_units_per_box'),`${n(geometry?.plainRafterCount)} joist hangers × 28 screws`),
  );
  const planM2=n(geometry?.widthMM)*n(geometry?.projectionMM)/1e6;
  return {valid:!errors.length,errors,rows,lathAudit,internalAreaM2:internal,externalAreaM2:external,tileQuantity:n(tileQuantity),
    siteFixings:{memberCount:siteMembers,screws:siteScrews,boxes:siteBoxes},tileFixings:{mainScrews:n(tileQuantity)*tileRate,accessoryScrews:accessoryUnits,totalScrews:tileUnits,boxes:tileBoxes},
    memberCounts:{plain:n(geometry?.plainRafterCount),jacks:['leftJackRafterCount','rightJackRafterCount','leftSideIntermediateJackCount','rightSideIntermediateJackCount'].reduce((sum,key)=>sum+n(geometry?.[key]),0),bosses:n(geometry?.bossQty)},
    plasterboard:{legacyPlanM2:planM2,internalFacetM2:internal,legacyBoards:Math.ceil(planM2/2.88),facetBoards:Math.ceil(internal/2.88),legacyWeightKg:planM2*8.5,facetWeightKg:internal*8.5},
    assumptions:[
      'Read-only audit evidence. Summary uses these confirmed allowances when hipped geometry and lath requirements resolve; manual adjustments are applied afterwards.',
      'Current quantities come from the Technical page legacy totals, not a capture of live Summary or its manual adjustments. Compare against the live Miscellaneous table.',
      'Approved insulation, membrane, hip foam tape and 50-pin allowance remain in their existing integrations.',
      'Confirmed fixed supply allowances: two foam cans and one 50m aluminium tape roll, with manual extras through Summary +/-.',
      'Plasterboard figures compare plan area with internal sloping facets, using existing 2.88m² sheets and 8.5kg/m². Whole-sheet ordering is an area estimate, not a cutting layout.',
      'Optional plasterboard supply, results layout and Add item dropdowns follow this audit. Plasterboard must contribute weight once regardless of supply choice.',
    ]};
}
