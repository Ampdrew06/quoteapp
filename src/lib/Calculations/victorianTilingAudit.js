import {buildVictorianLathAudit} from './victorianLathAudit';
import {buildSteelTileCourseAudit} from './steelTileCourseAudit';
import {getSlatePitchRule} from './tileProductConfig';
import {getFixedProductWeightKg} from '../utils/weights';
const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
const first=(...values)=>{for(const v of values){const n=rate(v);if(n!=null)return n;}return null;};
export function buildVictorianTilingAudit({geometry:g,materials:m={},productId='britmetShingle'}={}){
 const fail=errors=>({valid:false,readOnly:true,errors,lines:[]});
 const laths=buildVictorianLathAudit({geometry:g,materials:m,productId});if(!laths.valid)return fail(laths.errors);
 const five=g.frontFacetCount===5,cornerAngle=135,cornerQty=g.hips.length;
 const steel=laths.steel,prefix={britmetShingle:'britmet',metrotileShingle:'metrotile',liteSlate:'liteslate',tapcoSlate:'tapco'}[productId],reviews=[];
 // The shared engine uses these orientation names. Each front triangle remains a separate facet/run.
 const orientations=g.facets.map((f,i)=>i===0?'facet-left-side':i===g.facets.length-1?'facet-right-side':'facet-front');
 const courseResult={...laths.result,facets:laths.result.facets.map((f,i)=>({...f,facet:{...f.facet,id:orientations[i]}}))};
 const sequence=steel?buildSteelTileCourseAudit({automaticRoofTiling:{productId,result:courseResult},minimumStarterMM:200}):null;
 if(steel&&(!sequence.valid||!sequence.staggerComplete))return fail(['Steel staggered course ordering could not be completed.']);
 const mainTiles=steel?sequence.staggerOrder:laths.result.tileQuantityOrdered,extraTiles=steel?sequence.allowanceTiles:0;
 const ridgeDensity=steel?null:rate(m[`${prefix}_ridge_units_per_m`]??(productId==='liteSlate'?5.5:null));
 if(!steel&&ridgeDensity==null)reviews.push('Confirm ridge/hip coverage for this slate product before completing edge-tile quantities.');
 const edgeQty=length=>steel?Math.ceil(Math.max(0,length-1250)/1150)+1:ridgeDensity==null?null:Math.ceil(length/1000*ridgeDensity);
 const edges=laths.edges.map(e=>({...e,tileQty:edgeQty(e.lengthMM)})),ridgeTiles=edges[0].tileQty,hipTiles=edges.slice(1).some(e=>e.tileQty==null)?null:edges.slice(1).reduce((n,e)=>n+e.tileQty,0);
 const roofAreaM2=laths.facets.reduce((n,f)=>n+(f.baseWidthMM+f.topWidthMM)*f.heightMM/2e6,0);
 const mainPrice=productId==='britmetShingle'?first(m.tile_britmet_price_each,m.britmetShingle?.price_each):productId==='metrotileShingle'?first(m.tile_metrotile_price_each,m.metrotileShingle?.price_each):first(m[`${prefix}_tile_price_each`],productId==='tapcoSlate'?m.tapcoSlate?.price_each:null);
 const mainUnitKg=productId==='britmetShingle'?first(m.tile_britmet_weight_kg,m.britmetShingle?.weight_kg_per_tile):productId==='metrotileShingle'?first(m.tile_metrotile_weight_kg,m.metrotileShingle?.weight_kg_per_tile):first(m[`${prefix}_tile_weight_kg_each`],m[`${prefix}_tile_weight_kg`],productId==='tapcoSlate'?m.tapcoSlate?.weight_kg_per_tile:null);
 const mainWeightUnits=steel?roofAreaM2*Number(m[`tile_${prefix}_tiles_per_m2`]??3.2):laths.facets.reduce((n,f)=>n+(f.baseWidthMM+f.topWidthMM)*f.heightMM/2e6*getSlatePitchRule(productId,f.pitchDeg).slatesPerM2,0);
 if(!Number.isFinite(mainWeightUnits)||mainWeightUnits<0)return fail(['Invalid installed tile density.']);
 const lines=[];
 const add=(key,label,quantity,unit,price,installedWeightKg,basis)=>{const p=rate(price);lines.push({key,label,quantity,unit,unitPrice:p,cost:quantity===0?0:quantity==null||p==null?null:quantity*p,installedWeightKg,basis});};
 add('main','Main tiles — course order including allowance',mainTiles,'tiles',mainPrice,mainUnitKg==null?null:mainWeightUnits*mainUnitKg,steel?`${mainTiles-extraTiles} tiles from independent same-facet stagger sequences + ${extraTiles} roof allowance.`:'Shared synthetic-slate course calculation, including doubled first courses.');
 const ridgePrice=rate(m[`${prefix}_ridge_tile_price_each`]),ridgeKg=steel?getFixedProductWeightKg('hip_ridge'):first(m[`${prefix}_ridge_tile_weight_kg`],m[`ridge_tile_${prefix}_weight_kg`]);
 add('ridge','Ridge tiles — full house-wall-to-boss run',ridgeTiles,'tiles',ridgePrice,ridgeTiles==null||ridgeKg==null?null:ridgeTiles*ridgeKg,'Rounded separately for the full ridge run.');
 add('hips',`Hip tiles — ${g.hips.length} full covering runs`,hipTiles,'tiles',ridgePrice,hipTiles==null||ridgeKg==null?null:hipTiles*ridgeKg,'Full ridge-point-to-external-eaves lengths; no timber cutting deduction.');
 if(steel&&five)add('universal','Universal Ridge/Hip Adaptor',1,'each',first(m[`${prefix}_universal_ridge_adaptor_price_each`],m.britmet_universal_ridge_adaptor_price_each),first(m[`${prefix}_universal_ridge_adaptor_weight_kg`],m.universal_ridge_adaptor_weight_kg),'One existing universal cap over six hips plus ridge; confirmed workshop supply.');
 else if(steel)add('fiveWay','Five-way hip/ridge adaptor',1,'each',m[`${prefix}_5way_adaptor_price_each`],rate(m[`${prefix}_5way_adaptor_weight_kg`]),'Four hips plus one ridge; no additional three-way Y adaptor.');
 else {add('slateJunction','Victorian slate junction fitting — product to confirm',1,'each',m[`${prefix}_${five?'7way':'5way'}_adaptor_price_each`],rate(m[`${prefix}_${five?'7way':'5way'}_adaptor_weight_kg`]),'One junction location; suitable slate fitting and price require confirmation.');reviews.push('Confirm the Victorian slate hip/ridge junction fitting; an Edwardian three-way adaptor has not been substituted.');}
 const capPrice=first(m[`${prefix}_hip_end_cap_${cornerAngle}_price`],m[`${prefix}_hip_end_cap_${cornerAngle}_price_each`]),capKg=steel?getFixedProductWeightKg('hip_end_cap_135'):first(m[`${prefix}_hip_end_cap_135_weight_kg_each`],m[`${prefix}_hip_end_cap_weight_kg_each`],m[`${prefix}_hip_end_cap_weight_kg`]);
 add('hipEndCaps',five?'135° hip end caps — supplied for150° roof joints':`${cornerAngle}° hip end caps`,cornerQty,'each',capPrice,capKg==null?null:cornerQty*capKg,five?'One135° stock end cap per hip on the150° roof corners, as confirmed by Timberlite.':`One per regular ${cornerAngle}° hip-to-eaves corner.`);
 if(steel){const vents=Math.ceil(2*g.ridgeEndYMM/500),ventKg=first(m.vent_strip_weight_kg,m.tile_vent_strip_weight_kg);add('vents','500mm ridge ventilation strips',vents,'strips',m[`${prefix}_vent_strip_price_each`],ventKg==null?null:vents*ventKg,'Two ridge sides; no foam tape under ridge laths.');
  add('hipTape','Expanding foam tape — hip laths only',laths.support.quantities.tapeRollQty,'5.6m rolls',m.expanding_foam_roll_price_each,laths.support.tapeInstalledWeightKg,`${laths.support.quantities.tapeLengthM.toFixed(3)}m installed; whole rolls charged once here.`);
  add('touchUp','Steel tile touch-up kit',1,'kit',first(m[`${prefix}_touchup_kit_price_each`],productId==='britmetShingle'?m.touchup_kit_britmet_price_each:null,productId==='britmetShingle'?m.touchUpKitBritmet?.price_each:null),0,'Loose kit; no installed roof weight added.');
 }else {const stripLengthM=2*g.ridgeEndYMM/1000,stripAreaM2=stripLengthM*0.05,polyKg=rate(m.polycarbonate_6mm_weight_kg_per_m2);add('polycarbonate','Surplus 6mm twinwall — 50mm ridge strips',Math.ceil(stripLengthM/3),'3m strips',0,polyKg==null?null:stripAreaM2*polyKg,`${stripLengthM.toFixed(3)}m across two ridge sides; existing surplus-material cost convention.`);}
 const starterUsedM=g.facets.reduce((n,f)=>n+f.externalLengthMM/1000,0),starterStockMM=Number(m.eaves_guard_piece_cover_mm??m.eavesGuard?.effective_cover_mm??3000);
 if(!Number.isFinite(starterStockMM)||starterStockMM<=0)return fail(['Tile starter effective stock coverage must be positive.']);
 const starterQty=Math.ceil(starterUsedM*1000/starterStockMM),starterKg=first(m.tile_starter_weight_kg_each,m.metal?.tile_starter?.weight_kg_each,m.eaves_guard_weight_kg,m.eavesGuard?.weight_kg_per_piece);
 add('starter',`${starterStockMM/1000}m tile starter — ${g.facets.length} eaves`,starterQty,'lengths',first(m.tile_starter_price_each,m.metal?.tile_starter?.price_each,m.eaves_guard_price_each,m.eavesGuard?.price_per_piece),starterKg==null?null:starterUsedM/(starterStockMM/1000)*starterKg,`${starterUsedM.toFixed(3)}m installed; cost by whole lengths. Allocate to Metal once at integration.`);
 return {valid:true,readOnly:true,errors:[],productId,productLabel:laths.productLabel,steel,facets:laths.facets,result:laths.result,sequence,mainTiles,extraTiles,edges,ridgeTiles,hipTiles,roofAreaM2,mainWeightUnits,starterUsedM,starterQty,lines,supplyReviews:reviews,
  knownCost:lines.reduce((n,l)=>n+(l.cost??0),0),knownInstalledWeightKg:lines.reduce((n,l)=>n+(l.installedWeightKg??0),0),costComplete:reviews.length===0&&lines.every(l=>l.cost!=null),weightComplete:lines.every(l=>l.installedWeightKg!=null),
  notes:['Steel ordering reuses accepted right-to-left stagger and same-facet offcut carry, with200mm minimum visible starter plus intact95mm rib and two additional tiles per roof. Each front facet is an independent centred triangle; side facets retain their left/right house-wall datum. This is not a tile cutting list.',
   'Slate uses the shared course rules, doubled first row and pitch bands.25deg band boundaries retain the precision normalisation established in the lath audit. Tapco edge-product coverage/prices are not copied from LiteSlate.',
   'Hip covering runs include the boss region and full ply-base toe; ridge covering ends at the house wall. Neither the160mm sloping timber deduction nor the hook-end shortening reduces covering lengths. Steel edge tiles use1250mm first coverage then1150mm, rounded independently per run.',
   'Main installed tile weight uses gross tiled surface and the existing installed density rule, excluding spare/order waste. Hip/ridge/end-cap weights use existing product allowances; unconfigured fitting weights remain visible.',
   'External field, chamfered, support and internal laths are already in the lath audit and are NOT charged again here. Foam tape is costed here once; lath audit tape rows are quantities only.',
   five?'Confirmed5-facet supply: one Universal Ridge/Hip Adaptor and six135degree hip end caps for the150degree roof joints. Universal cap weight remains pending if unconfigured.':'One five-way junction and four135deg caps replace the Edwardian three-way/two90deg arrangement on the regular3-facet Victorian. Slate junction product confirmation remains outstanding.',
   'Tile starter is shown once here pending final Metal allocation. Touch-up is a loose kit; surplus slate ventilation strips are not charged as newly purchased material.',
   'Read-only: live Summary, customer quotations and manufacture/checklist outputs are unchanged. Cost/weight subtotals are partial when rates or product requirements are unresolved.']};
}
