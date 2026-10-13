import {buildEdwardianMemberAudit} from './edwardianMemberAudit';
import {buildEdwardianTilingAudit} from './edwardianTilingAudit';
import {buildEdwardianInternalLathAudit} from './edwardianInternalLathAudit';
import {buildWatercourseWallbarRequirement} from './metalIntegrationAudit';
import {buildFactoryStapleAllowance} from './factoryStapleAllowance';
import {getFixedProductWeightKg} from '../utils/weights';
const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
export function buildEdwardianMetalMiscAudit({geometry:g,materials:m={},productId='britmetShingle'}={}){
 const member=buildEdwardianMemberAudit({geometry:g}),tiling=buildEdwardianTilingAudit({geometry:g,materials:m,productId}),internal=buildEdwardianInternalLathAudit({geometry:g,materials:m});
 const fail=errors=>({valid:false,readOnly:true,errors,metalRows:[],siteRows:[],factoryRows:[]});
 if(!member.valid||!tiling.valid||!internal.valid)return fail([...member.errors,...tiling.errors,...internal.errors]);
 const jacks=member.members.filter(r=>/jack$/.test(r.type)).length,sparPairs=3;
 const counts={bosses:1,sparHooks:sparPairs*2,sparPairs,jacks,joistHangers:0,memberFeet:member.members.length,trusses:g.layout.trussCount};
 const metalRows=[],siteRows=[],factoryRows=[];
 const add=(list,key,label,qty,unit,price,basis,weightKg=null)=>{const p=rate(price);list.push({key,label,qty,unit,cost:p==null?null:qty*p,basis,installedWeightKg:weightKg,usage:list===factoryRows?'factory':list===siteRows?'site':'installed',supplyToSite:list===siteRows});};
 const hardware=[['boss_rafter_terminal','Boss / rafter terminal',1,m.boss_rafter_terminal_price_each??m.boss_price_each??m.metal?.boss_rafter_terminal?.price_each],['spar_hook','Spar hooks',6,m.spar_hook_price_each??m.metal?.spar_hook?.price_each],['jack_rafter_hooks','Jack rafter hooks',jacks,m.jack_rafter_hook_price_each??m.metal?.jack_rafter_hook?.price_each],['jack_rafter_brackets','Jack rafter brackets',jacks,m.jack_rafter_bracket_price_each??m.metal?.jack_rafter_bracket?.price_each]];
 hardware.forEach(([key,label,qty,price])=>add(metalRows,key,label,qty,'each',price,key==='spar_hook'?'Three connection pairs: two hips and one front boss rafter.':'Resolved member hardware count.',qty*getFixedProductWeightKg(key)));
 const starter=tiling.lines.find(l=>l.key==='starter'),starterUsedM=(2*g.externalProjectionMM+g.externalWidthMM)/1000,starterKg=rate(m.eaves_guard_weight_kg??m.metal?.tile_starter?.weight_kg_each);
 metalRows.unshift({key:'tile_starter',label:'Tile starter — all three eaves',qty:starterUsedM,orderQty:starter.quantity,unit:'m used / 3m lengths ordered',cost:starter.cost,installedWeightKg:starterKg==null?null:starterUsedM/3*starterKg,basis:'Same starter requirement shown in tile audit. Charge supplied stock once in Metal; weight uses consumed metres.',usage:'installed'});
 const rear=member.members.filter(r=>r.type==='truss-member'&&r.positionMM===g.layout.centresMM[0]);
 const watercourse=buildWatercourseWallbarRequirement({leftExternalWallBarSlopeMM:rear.find(r=>r.id.endsWith('left')).profile.externalSlopeLengthMM,rightExternalWallBarSlopeMM:rear.find(r=>r.id.endsWith('right')).profile.externalSlopeLengthMM},m);
 metalRows.push({key:watercourse.key,label:watercourse.label,qty:watercourse.qty,orderQty:watercourse.orderQty,unit:'2.5m lengths',cost:watercourse.cost,installedWeightKg:watercourse.weightKg,basis:'Secret gutter on both sloping rear truss members against the house; installed coverage follows each upper member edge. '+watercourse.basis,usage:'installed'});
 const box=(v,defaultValue)=>Number(v??defaultValue),siteUnits=box(m.rafterEavesScrews?.units_per_box,200),tileUnits=box(m.tileFixings?.units_per_box,200),concreteUnits=box(m.concrete_screws_units_per_box,100);
 if(![siteUnits,tileUnits,concreteUnits].every(v=>Number.isInteger(v)&&v>0))return fail(['Fixing pack quantities must be positive whole numbers.']);
 const siteScrews=counts.memberFeet*2,tileRate=Number(tiling.steel?m.tileFixings?.per_tile_britmet??3:m.tileFixings?.per_tile_liteslate??2);
 if(!Number.isFinite(tileRate)||tileRate<0)return fail(['Tile screw rate must be non-negative.']);
 const tileScrews=tiling.mainTiles*tileRate+(tiling.ridgeTiles+tiling.hipTiles)*4+2*2+6;
 add(siteRows,'concrete_screws','150mm concrete screws',8,'screws',rate(m.concrete_screws_price_per_box)==null?null:Number(m.concrete_screws_price_per_box)/concreteUnits,'Fixed eight-screw roof allowance, charged from full box price.');
 add(siteRows,'expanding_foam','Expanding foam',2,'cans',m.expanding_foam_can_price_each??m.expandingFoam?.price_each,'Fixed two-can allowance.');
 add(siteRows,'alu_roll_tape','Aluminium tape',1,'50m roll',m.aluminium_tape_roll_price_each??m.aluRollTape?.price_each,'Fixed one-roll allowance.');
 add(siteRows,'screws_rafter_eaves','5×80 rafter/eaves screws',Math.ceil(siteScrews/siteUnits),'boxes',m.screws_3x10_price_per_box??m.rafterEavesScrews?.price_per_box,`${counts.memberFeet} member feet × 2 = ${siteScrews}; ${siteUnits}/box.`);
 const spacingMM=500;
 const externalRows=[];
 tiling.result.facets.forEach(f=>{
  const side=f.facet.id==='facet-front'?'front':f.facet.id==='facet-left-side'?'left':'right';
  const members=side==='front'?member.members.filter(r=>r.type==='front-jack'||r.type==='boss-rafter'):member.members.filter(r=>(r.type==='truss-member'&&r.id.endsWith(side)&&r.positionMM!==g.layout.centresMM[0])||(r.type==='side-jack'&&r.id.startsWith(`side-${side}`)));
  f.lathRows.filter(r=>r.widthMM>0).forEach(row=>{const positionMM=Math.max(0,Number(row.yMM??row.positionMM??0)-50/Math.cos(f.facet.pitchDeg*Math.PI/180));externalRows.push({side,screws:2+members.filter(r=>r.profile.externalSlopeLengthMM+24>=positionMM).length});});
 });
 const externalFieldScrews=externalRows.reduce((n,r)=>n+r.screws,0),supportScrews=tiling.steel?tiling.edges.reduce((n,e)=>n+2*(Math.ceil(e.lengthMM/spacingMM)+1),0):0;
 const externalScrews=externalFieldScrews+supportScrews;
 const internalScrews=internal.rows.reduce((sum,row)=>{
  if(row.surface==='flat')return sum+counts.trusses+1;
  const side=row.surface,cos=Math.cos((side==='front'?g.frontPitchDeg:g.pitchDeg)*Math.PI/180);
  const slopePositionMM=side==='front'?(g.projectionMM-row.positionMM)/cos:(side==='left'?row.positionMM:g.widthMM-row.positionMM)/cos;
  const candidates=side==='front'?member.members.filter(r=>r.type==='front-jack'||r.type==='boss-rafter'):member.members.filter(r=>(r.type==='truss-member'&&r.id.endsWith(side)&&r.positionMM!==g.layout.centresMM[0])||(r.type==='side-jack'&&r.id.startsWith(`side-${side}`)));
  return sum+2+candidates.filter(r=>r.profile.internalSlopeLengthMM+24>=slopePositionMM).length;
 },0);
 const lathPrice=m.screws_2x8_price_per_box??m.lathFixings?.price_per_box;
 add(siteRows,'screws_lath_internal','2-inch × 8 internal lath screws',Math.ceil(internalScrews/250),'boxes',lathPrice,`${internalScrews} conservative member intersections; 250/box.`);
 add(siteRows,'screws_lath_external','2-inch × 8 external lath screws',Math.ceil(externalScrews/250),'boxes',lathPrice,`${externalFieldScrews} field intersections + ${supportScrews} hip/ridge support screws at approx. 500mm; 250/box. No ring-beam assembly screws.`);
 add(siteRows,'screws_tile_fixings','Main, hip/ridge and cap tile screws',Math.ceil(tileScrews/tileUnits),'boxes',m.screws_1x8_price_per_box??m.tileFixings?.price_per_box,`${tiling.mainTiles} main × ${tileRate}, ${(tiling.ridgeTiles+tiling.hipTiles)} hip/ridge × 4, two end caps × 2 and Y adaptor × 6 = ${tileScrews}; ${tileUnits}/box.`);
 const consumed=(qty,priceKey,unitsKey)=>{const price=rate(m[priceKey]),units=Number(m[unitsKey]);return price==null||!Number.isInteger(units)||units<=0?null:qty*price/units;};
 add(factoryRows,'d4_glue','D4 glue',1,'tub allowance',m.d4_glue_price_per_tub,'One tub per roof, including offcut closures.');
 const factoryScrews=sparPairs*14+jacks*10+6,rivets=sparPairs*4;
 factoryRows.push({key:'factory_screws_1_5x10',label:'1½-inch × 10 factory screws',qty:factoryScrews,unit:'screws consumed',cost:consumed(factoryScrews,'screws_1_5x10_price_per_box','screws_1_5x10_units_per_box'),basis:`${sparPairs} spar-hook pairs × 14 + ${jacks} jack sets × 10 + one boss × 6`,usage:'factory',supplyToSite:false,installedWeightKg:null},
 {key:'factory_spar_rivets',label:'Spar-hook factory rivets',qty:rivets,unit:'rivets consumed',cost:consumed(rivets,'spar_hook_rivets_price_per_box','spar_hook_rivets_units_per_box'),basis:`${sparPairs} pairs × 4`,usage:'factory',supplyToSite:false,installedWeightKg:null});
 const staples=buildFactoryStapleAllowance({trussCount:counts.trusses,ringBeamLengthM:starterUsedM,materials:m});if(!staples.valid)return fail(staples.errors);
 factoryRows.push({...staples,supplyToSite:false});
 return {valid:true,readOnly:true,errors:[],counts,metalRows,siteRows,factoryRows,watercourse,
  fixings:{siteScrews,tileScrews,internalScrews,externalFieldScrews,supportScrews,externalScrews,factoryScrews,rivets},
  notes:['One terminal serves two hips and the front boss rafter: three spar-hook pairs. Every front/side jack uses one hook and bracket; no joist hangers are used by the self-supporting trusses.',
   'Tile starter is the same requirement already shown in the tile audit. It will be placed in Metal once at integration, not charged in both elements.',
   'Both sloping rear truss members meet the house wall and receive secret gutter. Cost uses 2.5m aluminium stock with 50mm overlaps; installed weight uses actual coverage at 0.18kg/m.',
   'Loose site screws use existing whole-box rounding. Internal and external lath screws round independently to 250; field intersections include conservative end supports and 24mm member-reach tolerance.',
   'Hip/ridge support screws use approximately 500mm spacing plus end fixings. Ring-beam outer and finishing laths are glued/stapled: no ring-beam screw allowance is added.',
   'Tile screw allowance includes main tiles, all hip/ridge tiles, both end caps and the Y adaptor. Ridge ventilation/polycarbonate fixing is covered by that allowance.',
   'Factory screws, rivets, staples and glue contribute cost but must be excluded from the loose-fixings Idiot List. No new closure-specific fixing allowance is added.',
   'Read-only: price and supply candidates do not alter existing roofs, Summary, quotation, manufacture or Idiot List. Manual adjustments follow integration.']};
}
