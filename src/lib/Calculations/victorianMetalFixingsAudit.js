import {buildVictorianTimberAudit} from './victorianTimberAudit';
import {buildVictorianTilingAudit} from './victorianTilingAudit';
import {buildVictorianLathAudit} from './victorianLathAudit';
import {buildWatercourseWallbarRequirement} from './metalIntegrationAudit';
import {buildFactoryStapleAllowance} from './factoryStapleAllowance';
import {getFixedProductWeightKg} from '../utils/weights';
const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
export function buildVictorianMetalFixingsAudit({geometry:g,materials:m={},productId='britmetShingle'}={}){
 const fail=errors=>({valid:false,readOnly:true,errors,metalRows:[],siteRows:[],factoryRows:[]});
 const timber=buildVictorianTimberAudit({geometry:g,materials:m}),tiles=buildVictorianTilingAudit({geometry:g,materials:m,productId}),laths=buildVictorianLathAudit({geometry:g,materials:m,productId});
 if(!timber.valid||!tiles.valid||!laths.valid)return fail([...new Set([...(timber.errors||[]),...(tiles.errors||[]),...(laths.errors||[])])]);
 const sparPairs=timber.componentCounts.hips+timber.componentCounts.intermediates,jacks=g.jackRafters.length;
 const counts={bosses:1,sparPairs,sparHooks:sparPairs*2,jacks,joistHangers:0,trusses:timber.componentCounts.trusses,memberFeet:timber.componentCounts.joistMembers};
 const metalRows=[],siteRows=[],factoryRows=[];
 const add=(list,key,label,qty,unit,price,basis,installedWeightKg=null)=>{const p=rate(price);list.push({key,label,qty,unit,cost:qty===0?0:qty==null||p==null?null:qty*p,basis,installedWeightKg:qty===0?0:installedWeightKg,usage:list===factoryRows?'factory':list===siteRows?'site':'installed',supplyToSite:list===siteRows});};
 const hardware=[['boss_rafter_terminal','Boss / rafter terminal',1,m.boss_rafter_terminal_price_each??m.boss_price_each??m.metal?.boss_rafter_terminal?.price_each],['spar_hook','Spar hooks',counts.sparHooks,m.spar_hook_price_each??m.metal?.spar_hook?.price_each],['jack_rafter_hooks','Jack rafter hooks',jacks,m.jack_rafter_hook_price_each??m.metal?.jack_rafter_hook?.price_each],['jack_rafter_brackets','Jack rafter brackets',jacks,m.jack_rafter_bracket_price_each??m.metal?.jack_rafter_bracket?.price_each]];
 hardware.forEach(([key,label,qty,price])=>add(metalRows,key,label,qty,'each',price,key==='spar_hook'?`${timber.componentCounts.hips} hips + ${timber.componentCounts.intermediates} intermediates = ${sparPairs} pairs, fitted before despatch.`:'Installed hardware; not a loose despatch item.',qty*getFixedProductWeightKg(key)));
 const rear=timber.truss.members,watercourse=buildWatercourseWallbarRequirement({leftExternalWallBarSlopeMM:rear[0].externalSlopeMM,rightExternalWallBarSlopeMM:rear[1].externalSlopeMM},m),waterPrice=rate(m.watercourse_price_each??m.metal?.watercourse?.price_per_piece);
 add(metalRows,'watercourse',watercourse.label,watercourse.orderQty,'2.5m lengths',waterPrice,`Both rear sloping truss members; ${watercourse.usedM.toFixed(3)}m installed. First2500mm, then2450mm cover per side.`,watercourse.weightKg);
 metalRows[metalRows.length-1].usage='site';metalRows[metalRows.length-1].supplyToSite=true;
 const siteUnits=Number(m.rafterEavesScrews?.units_per_box??200),tileUnits=Number(m.tileFixings?.units_per_box??200),concreteUnits=Number(m.concrete_screws_units_per_box??100),lathUnits=250;
 if(![siteUnits,tileUnits,concreteUnits].every(v=>Number.isInteger(v)&&v>0))return fail(['Fixing pack quantities must be positive whole numbers.']);
 const tileRate=Number(tiles.steel?m.tileFixings?.per_tile_britmet??3:m.tileFixings?.per_tile_liteslate??2);
 if(!Number.isFinite(tileRate)||tileRate<0)return fail(['Tile screw rate must be non-negative.']);
 const junctionScrews=g.frontFacetCount===5?5:10;
 const siteScrews=counts.memberFeet*2,tileScrews=tiles.steel&&tiles.ridgeTiles!=null&&tiles.hipTiles!=null&&junctionScrews!=null?tiles.mainTiles*tileRate+(tiles.ridgeTiles+tiles.hipTiles)*4+g.hips.length*2+junctionScrews:null;
 const memberCandidates=facetIndex=>{
  const facetId=g.facets[facetIndex].id;
  const rows=facetIndex===0||facetIndex===g.facets.length-1?Array(counts.trusses-1).fill({top:timber.truss.members[0].externalSlopeMM,bottom:timber.truss.members[0].internalSlopeMM}):[];
  timber.memberSchedule.members.filter(r=>r.type==='Jack rafter'?r.facetId===facetId:r.type==='Intermediate rafter'&&g.intermediateBars.find(p=>p.id===r.ref)?.facetId===facetId).forEach(r=>rows.push({top:r.topEdgeMM,bottom:r.bottomEdgeMM}));
  return rows;
 };
 const externalRows=tiles.result.facets.flatMap((f,i)=>f.lathRows.filter(r=>r.widthMM>0).map(row=>{const positionMM=Math.max(0,Number(row.yMM)-50/Math.cos(f.facet.pitchDeg*Math.PI/180));return {facetId:g.facets[i].id,positionMM,screws:2+memberCandidates(i).filter(r=>r.top+24>=positionMM).length};}));
 const externalFieldScrews=externalRows.reduce((n,r)=>n+r.screws,0),supportScrews=tiles.steel?tiles.edges.reduce((n,e)=>n+2*(Math.ceil(e.lengthMM/500)+1),0):0,externalScrews=externalFieldScrews+supportScrews;
 const internalRows=laths.internal.rows.map(row=>{if(row.surface==='flat')return {...row,screws:counts.trusses+1};const i=g.facets.findIndex(f=>f.id===row.surface),positionMM=row.positionMM/Math.cos(g.facets[i].pitchDeg*Math.PI/180);return {...row,screws:2+memberCandidates(i).filter(r=>r.bottom+24>=positionMM).length};}),internalScrews=internalRows.reduce((n,r)=>n+r.screws,0);
 const concretePrice=rate(m.concrete_screws_price_per_box);
 add(siteRows,'concrete_screws','150mm concrete screws',8,'screws',concretePrice==null?null:concretePrice/concreteUnits,'Eight-screw existing roof allowance; box price apportioned to8 screws.');
 add(siteRows,'expanding_foam','Expanding foam',2,'cans',m.expanding_foam_can_price_each??m.expandingFoam?.price_each,'Existing two-can roof allowance.');
 add(siteRows,'alu_roll_tape','Aluminium tape',1,'50m roll',m.aluminium_tape_roll_price_each??m.aluRollTape?.price_each,'Existing one-roll roof allowance.');
 add(siteRows,'screws_rafter_eaves','5×80 rafter/eaves screws',Math.ceil(siteScrews/siteUnits),'boxes',m.screws_3x10_price_per_box??m.rafterEavesScrews?.price_per_box,`${counts.memberFeet} member feet ×2 = ${siteScrews}; ${siteUnits}/box.`);
 const lathPrice=m.screws_2x8_price_per_box??m.lathFixings?.price_per_box;
 add(siteRows,'screws_lath_internal','2-inch ×8 internal lath screws',Math.ceil(internalScrews/lathUnits),'boxes',lathPrice,`${internalScrews} conservative fixing intersections; ${lathUnits}/box.`);
 add(siteRows,'screws_lath_external','2-inch ×8 external lath screws',Math.ceil(externalScrews/lathUnits),'boxes',lathPrice,`${externalFieldScrews} field + ${supportScrews} hip/ridge support screws; ${lathUnits}/box. Ring-beam assembly excluded.`);
 add(siteRows,'screws_tile_fixings','Main, hip/ridge and cap tile screws',tileScrews==null?null:Math.ceil(tileScrews/tileUnits),'boxes',m.screws_1x8_price_per_box??m.tileFixings?.price_per_box,tileScrews==null?'Junction/edge fixing requirement awaits product confirmation.':`${tiles.mainTiles} main ×${tileRate} + ${tiles.ridgeTiles+tiles.hipTiles} hip/ridge ×4 + ${g.hips.length} caps ×2 + junction ×${junctionScrews} = ${tileScrews}; ${tileUnits}/box.`);
 const consumed=(qty,priceKey,unitsKey)=>{const price=rate(m[priceKey]),units=Number(m[unitsKey]);return price==null||!Number.isInteger(units)||units<=0?null:qty*price/units;};
 add(factoryRows,'d4_glue','D4 glue',1,'tub allowance',m.d4_glue_price_per_tub,'One tub per roof; includes assembled offcut closures.');
 const factoryScrews=sparPairs*14+jacks*10+6,rivets=sparPairs*4;
 factoryRows.push({key:'factory_screws_1_5x10',label:'1½-inch ×10 factory screws',qty:factoryScrews,unit:'screws consumed',cost:consumed(factoryScrews,'screws_1_5x10_price_per_box','screws_1_5x10_units_per_box'),basis:`${sparPairs} spar pairs ×14 + ${jacks} jack sets ×10 + boss ×6.`,usage:'factory',supplyToSite:false,installedWeightKg:null},
 {key:'factory_spar_rivets',label:'Spar-hook factory rivets',qty:rivets,unit:'rivets consumed',cost:consumed(rivets,'spar_hook_rivets_price_per_box','spar_hook_rivets_units_per_box'),basis:`${sparPairs} spar pairs ×4.`,usage:'factory',supplyToSite:false,installedWeightKg:null});
 const staples=buildFactoryStapleAllowance({trussCount:counts.trusses,ringBeamLengthM:tiles.starterUsedM,materials:m});if(!staples.valid)return fail(staples.errors);factoryRows.push({...staples,supplyToSite:false});
 const existingAllocations=tiles.lines.filter(r=>['starter','hipTape'].includes(r.key)).map(r=>({...r,alreadyCounted:true,source:'Tiles & covering accessories'}));
 const lines=[...metalRows,...siteRows,...factoryRows],supplyReviews=tileScrews==null?[g.frontFacetCount===5?'Six-hip/ridge junction fixings remain pending product confirmation.':'Slate junction/edge fixings remain pending product confirmation.']:[];
 return {valid:true,readOnly:true,errors:[],counts,metalRows,siteRows,factoryRows,existingAllocations,watercourse,supplyReviews,
  fixings:{siteScrews,tileScrews,internalScrews,externalFieldScrews,supportScrews,externalScrews,factoryScrews,rivets,externalRows,internalRows},knownCost:lines.reduce((n,r)=>n+(r.cost??0),0),costComplete:supplyReviews.length===0&&lines.every(r=>r.cost!=null),
  notes:[`One boss; ${sparPairs} spar-hook pairs/${counts.sparHooks} hooks for ${timber.componentCounts.hips} hips and ${timber.componentCounts.intermediates} intermediates. Self-supporting trusses use no joist hangers. Installed hardware is fitted before despatch, not duplicated in loose goods.`,
   'Both rear sloping truss members need secret gutter. Reuses2.5m aluminium ordering per run with50mm overlaps; installed weight uses actual coverage at0.18kg/m.',
   'Starter and hip foam tape remain in the existing tile/accessory subtotal at this audit stage. Reference rows here add no cost/weight; final reconciliation must allocate starter to Metal and tape to Misc once.',
   'Site boxes use existing rules: two screws per member foot; three per ordered steel tile/two per slate tile, four per hip/ridge cap and two per hip end cap. Junction fixings use the existing product-specific allowance: universal adaptor five; five-way ten. Unconfirmed junction/edge fixings remain pending.',
   'Lath screws reuse conservative end supports and24mm member-reach tolerance. Internal/external boxes round separately at250/box; steel support screws use two runs at500mm plus ends. Ring-beam base/upstands are glued/stapled, not counted again as screw runs.',
   'Factory screws:14 per spar pair,10 per jack set,6 per boss; four rivets per spar pair. Factory consumption uses prorated box prices, not whole boxes supplied to the customer. Glue/staples include the existing closure assembly allowance.',
   'Missing weight allocations are deliberately deferred to the final weight review. This read-only audit does not alter live pricing, Summary or the despatch checklist.']};
}
