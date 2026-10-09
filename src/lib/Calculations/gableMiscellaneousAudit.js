import {buildFactoryStapleAllowance} from './factoryStapleAllowance';
const rate=value=>value==null||value===''||!Number.isFinite(Number(value))||Number(value)<0?null:Number(value);

export function buildGableMiscellaneousAudit({geometry:g,tilingAudit:t,lathAudit:l,materials:m={},supportFixingSpacingMM=500}={}) {
 const fail=message=>({valid:false,readOnly:true,errors:[message],siteRows:[],factoryRows:[],pending:[]});
 if(!g?.valid||!t?.valid||!l?.valid||!l.internal?.valid)return fail('Valid Gable geometry, tiling and internal lath audits are required.');
 const spacing=Number(supportFixingSpacingMM),siteBoxUnits=Number(m.rafterEavesScrews?.units_per_box??200),tileBoxUnits=Number(m.tileFixings?.units_per_box??200),lathBoxUnits=250;
 if(!Number.isFinite(spacing)||spacing<=0||![siteBoxUnits,tileBoxUnits].every(n=>Number.isInteger(n)&&n>0))return fail('Fixing spacing and whole-box quantities must be positive.');
 const concreteUnits=Number(m.concrete_screws_units_per_box??100);
 if(!Number.isInteger(concreteUnits)||concreteUnits<=0)return fail('Concrete screw pack quantity must be a positive whole number.');
 const concretePrice=rate(m.concrete_screws_price_per_box);
 const trusses=g.layout.trussCount,memberFeet=2*trusses;
 const siteScrews=memberFeet*2,siteBoxes=Math.ceil(siteScrews/siteBoxUnits);
 const internalScrews=l.internal.rowCount*trusses;
 const fieldRows=t.result.facets.reduce((sum,f)=>sum+f.lathRows.filter(row=>row.widthMM>0).length,0);
 const externalFieldScrews=fieldRows*trusses;
 const spaced=lengthMM=>lengthMM>0?Math.ceil(lengthMM/spacing)+1:0;
 const ridgeScrews=t.steel?2*spaced(g.manufacturingProjectionMM??g.externalProjectionMM):0;
 const externalScrews=externalFieldScrews+ridgeScrews;
 const internalBoxes=Math.ceil(internalScrews/lathBoxUnits),externalBoxes=Math.ceil(externalScrews/lathBoxUnits);
 const outerRingScrews=2*spaced(g.manufacturingProjectionMM??g.externalProjectionMM);
 const finishingScrews=2*l.stockPlan.runPieces.filter(row=>row.edgeId.startsWith('finish-left-')).reduce((sum,row)=>sum+spaced(row.lengthsM.reduce((a,b)=>a+b,0)*1000),0);
 const factoryLathScrews=outerRingScrews+finishingScrews;
 const mainTileRate=Number(t.steel?m.tileFixings?.per_tile_britmet??3:m.tileFixings?.per_tile_liteslate??2);
 if(!Number.isFinite(mainTileRate)||mainTileRate<0)return fail('Main tile screw allowance must be non-negative.');
 const mainTileScrews=t.mainTiles*mainTileRate,ridgeTileScrews=t.ridgeTiles*4;
 const knownTileScrews=mainTileScrews+ridgeTileScrews,tileBoxes=Math.ceil(knownTileScrews/tileBoxUnits);
 const lathPrice=rate(m.screws_2x8_price_per_box??m.lathFixings?.price_per_box);
 const rows=[];
 const add=(key,label,qty,unit,price,basis)=>{const p=rate(price);rows.push({key,label,qty,unit,cost:p==null?null:qty*p,basis,usage:'site',installedWeightKg:null});};
 add('concrete_screws','150mm concrete screws',8,'screws',concretePrice==null?null:concretePrice/concreteUnits,`Fixed eight-screw site allowance; charged individually from ${concreteUnits}/box. Installer selects suitable anchoring for the wall.`);
 add('expanding_foam','Expanding foam',2,'cans',m.expanding_foam_can_price_each??m.expandingFoam?.price_each,'Fixed two-can allowance; extras can be added manually after Summary integration.');
 add('alu_roll_tape','Aluminium tape',1,'50m roll',m.aluminium_tape_roll_price_each??m.aluRollTape?.price_each,'Fixed one-roll allowance; no area-based increase.');
 add('screws_rafter_eaves','5×80 rafter/eaves screws',siteBoxes,'boxes',m.screws_3x10_price_per_box??m.rafterEavesScrews?.price_per_box,`${memberFeet} truss-member feet × 2 = ${siteScrews} screws; ${siteBoxUnits}/box. Provisional site rule carried over for factory review.`);
 add('screws_lath_internal','2-inch × 8 internal lath screws',internalBoxes,'boxes',lathPrice,`${l.internal.rowCount} internal rows × ${trusses} trusses = ${internalScrews} intersections; ${lathBoxUnits}/box.`);
 add('screws_lath_external','2-inch × 8 external lath screws',externalBoxes,'boxes',lathPrice,`${externalFieldScrews} field intersections + ${ridgeScrews} ridge-support allowance = ${externalScrews}; ${lathBoxUnits}/box.`);
 add('screws_tile_fixings','Main and ridge tile screws',tileBoxes,'boxes',m.screws_1x8_price_per_box??m.tileFixings?.price_per_box,`${t.mainTiles} main tiles × ${mainTileRate} + ${t.ridgeTiles} ridge tiles × 4 = ${knownTileScrews} known screws; ${tileBoxUnits}/box. Includes front accessory fixings within the existing tile-screw allowance; no separate accessory charge.`);
 const gluePrice=rate(m.d4_glue_price_per_tub);
 const staples=buildFactoryStapleAllowance({trussCount:trusses,ringBeamLengthM:2*(g.manufacturingProjectionMM??g.externalProjectionMM)/1000,materials:m});
 if(!staples.valid)return fail(staples.errors[0]);
 const factoryRows=[
  staples,
  {key:'d4_glue',label:'D4 glue',qty:1,unit:'tub allowance',cost:gluePrice,basis:'One tub per roof for manufacture, including assembled offcut closures.',usage:'factory',installedWeightKg:null},
  {key:'factory_ring_lath_screws',label:'Ring-beam outer/finishing lath screws',qty:factoryLathScrews,unit:'screws consumed',cost:lathPrice==null?null:factoryLathScrews*lathPrice/lathBoxUnits,basis:`${outerRingScrews} outer-lath + ${finishingScrews} finishing-lath screws at approximately ${spacing}mm plus ends. Factory allocation and screw type to confirm.`,usage:'factory',installedWeightKg:null},
 ];
 const pending=[];
 return {valid:true,readOnly:true,complete:true,errors:[],siteRows:rows,factoryRows,pending,
  siteFixings:{memberFeet,screws:siteScrews,boxes:siteBoxes,unitsPerBox:siteBoxUnits},
  lathFixings:{internalScrews,externalFieldScrews,ridgeScrews,externalScrews,internalBoxes,externalBoxes,unitsPerBox:lathBoxUnits,factoryLathScrews},
  tileFixings:{mainTileRate,mainTileScrews,ridgeTileScrews,knownScrews:knownTileScrews,boxes:tileBoxes,unitsPerBox:tileBoxUnits,accessoriesConfirmed:true},
  excludedHardware:{bosses:0,sparHooks:0,jackSets:0,joistHangers:0,sparRivets:0},
  knownCost:[...rows,...factoryRows].reduce((sum,row)=>sum+(row.cost??0),0),
  notes:[
   'Read-only Gable supply candidates: no Summary, quotation, manufacture book, Idiot List or Home Tile Calcs changes.',
   'Internal and external lath screws round separately to whole boxes of 250. One screw is allowed per field-lath/truss intersection; ridge and ring-beam support allowances use approximately 500mm plus end fixings.',
   'Ring-beam lath screws are provisionally allocated to factory consumption, not duplicated in loose site boxes. Confirm the factory screw type and allowance.',
   'Main tiles use three screws per ordered steel tile or two per slate, with four per ridge tile. Barges/dry verge, steel end cap and ventilation-strip fixings are covered by this existing allowance. LiteSlate twinwall strips use the ridge-tile fixings; no additional screws are charged.',
   'Eight 150mm concrete screws are supplied per roof, costed individually from the saved full-box price. Quantity can be adjusted after Summary integration.',
   'Glue is charged by one tub allowance; factory screws by consumed units. Factory-used items must not become loose items in the future Idiot List.',
   'No boss, spar-hook, jack or joist-hanger fixings/rivets are required for this basic Gable construction. Truss assembly uses 40 staples per truss; ring-beam base attachment uses 20 staples per metre. These are separate from the provisional outer/finishing lath screw connections.',
   'Polytop pins are already included in the plastics audit and are not duplicated here. Ridge ventilation is already in the tile audit; no hip foam tape is added.',
   'Full supplied boxes, cans and glue tubs do not represent installed roof weight. Consumed weights remain unconfigured here; plasterboard weight is already recorded once in the insulation audit.',
   'The known cost is a partial comparison only. Missing prices are excluded; this is a miscellaneous allowance audit, not a complete roof price. The factory outer/finishing lath screw type remains provisional.',
  ]};
}
