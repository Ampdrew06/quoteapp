import {calculateRoofTiling} from './facetTilingCalc';
import {buildSteelTileCourseAudit} from './steelTileCourseAudit';
import {computeTilesLathsBOM} from './tilesLathsCalc';
const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
export function buildGableTilingAudit({geometry:g,materials:m={},productId='britmetShingle'}={}) {
 const fail=message=>({valid:false,readOnly:true,errors:[message],lines:[],facets:[]});
 if(!g?.valid)return fail('Valid Gable geometry is required.');
 if(!['britmetShingle','metrotileShingle','liteSlate'].includes(productId))return fail('Select Britmet, Metrotile or LiteSlate.');
 const steel=productId!=='liteSlate',cos=Math.cos(g.pitchDeg*Math.PI/180);
 const facets=g.feet.map(f=>({id:`gable-${f.side}`,label:`${f.side} roof face`,baseWidthMM:(g.manufacturingProjectionMM??g.externalProjectionMM),topWidthMM:(g.manufacturingProjectionMM??g.externalProjectionMM),heightMM:f.externalSlopeMM+50/cos,pitchDeg:g.pitchDeg,topEdgeType:steel?'ridge':'gableRidgeWithoutExtraCourse'}));
 const result=calculateRoofTiling({facets,product:productId});
 if(result.errors.length)return fail(result.errors.join(' '));
 const sequence=steel?buildSteelTileCourseAudit({automaticRoofTiling:{productId,result},minimumStarterMM:200}):null;
 if(steel&&(!sequence.valid||!sequence.staggerComplete))return fail('Steel course sequence could not be completed.');
 const mainTiles=steel?sequence.staggerOrder:result.tileQuantityOrdered;
 const ridgeMM=(g.manufacturingProjectionMM??g.externalProjectionMM),ridgeLathM=steel?2*ridgeMM/1000:0;
 const fieldLathM=result.lathLengthMM/1000;
 // Perimeter rows are already included by the shared facet calculator.
 const chamferM=result.facets.reduce((s,f)=>s+f.lathRows.filter(r=>Math.abs(r.yMM??r.positionMM??r.y??-1)<1e-7).reduce((t,r)=>t+r.widthMM/1000,0),0);
 const lathM=fieldLathM+ridgeLathM;
 const stockM=rate(m.lath_stock_length_m)??4.8;
 if(!(stockM>0))return fail('Lath stock length must be positive.');
 const ridgeTiles=steel?Math.ceil(Math.max(0,ridgeMM-1250)/1150)+1:Math.ceil(ridgeMM/1000*5.5);
 const vergeParts=facets.map(f=>computeTilesLathsBOM({run_mm:(g.manufacturingProjectionMM??g.externalProjectionMM),slope_mm:f.heightMM,pitch_deg:g.pitchDeg,leftSide:'exposed',rightSide:'none',tileSystem:steel?'britmet':'liteslate',verge_waste_pct:0},m).lines.find(l=>l.key==='verge'));
 const vergeQty=Math.ceil(vergeParts.reduce((s,l)=>s+l.qty,0));
 const lines=[];
 const add=(key,label,quantity,unit,price)=>{const p=rate(price);lines.push({key,label,quantity,unit,unitPrice:p,cost:p==null?null:quantity*p});};
 add('main','Main tiles — course ordering candidate',mainTiles,'tiles',steel?m.tile_britmet_price_each:m.liteslate_tile_price_each);
 add('ridge','Ridge tiles',ridgeTiles,'tiles',steel?m.britmet_ridge_tile_price_each:m.liteslate_ridge_tile_price_each);
 add('ridgeLaths','25×50 ridge support laths',ridgeLathM,'m',m.chamferLath?.price_per_m);
 if(steel){add('vents','500mm ridge ventilation strips',Math.ceil(2*ridgeMM/500),'strips',m.britmet_vent_strip_price_each);add('endCap','Front ridge end cap',1,'cap',m.britmet_gable_end_cap_price_each);}
 else lines.push({key:'polycarbonate',label:'Factory 6mm twinwall strips, 50mm wide',quantity:Math.ceil(2*ridgeMM/3000),unit:'3m strips',unitPrice:0,cost:0});
 add('verge',steel?'Two-part front barges':'Front dry verge',vergeQty,'pieces',steel?m.verge_trim_price_each:m.liteslate_dry_verge_2m_price??m.liteslate_dry_verge_price_each);
 add('starter','3m tile starter — two eaves',Math.ceil(2*ridgeMM/3000),'lengths',m.eaves_guard_price_each);
 return {valid:true,readOnly:true,errors:[],productId,steel,facets,result,sequence,mainTiles,ridgeMM,ridgeTiles,ridgeLathM,fieldLathM,chamferM,lathM,lathStockLengths:Math.ceil(lathM/stockM),stockM,lines,knownCost:lines.reduce((s,l)=>s+(l.cost??0),0),notes:[
 'Each roof face uses the shared facet tile/lath engine. Steel ordering uses the accepted right-to-left stagger and same-facet offcut sequence, with a 295mm physical minimum (95mm rib plus 200mm visible) and two additional tiles per roof.',
 'Tile faces extend 50mm in plan beyond the external member edge at each eaves. The membrane audit uses the same whole-roof boundary, excluding extra overlap and gutter-drape allowances from installed weight.',
 'External field laths include the perimeter row; ridge support is added once. Stock rounding pools these uses. Ring-beam fixing laths and internal ceiling laths are outside this subtotal.',
 'Steel ridge tiles use a full 1250mm first piece and 1150mm subsequent coverage. Ridge laths receive ventilation strips, not foam tape. Only the front receives an end cap. Tile-starter stock is pooled across the two eaves.',
 'LiteSlate uses the final ordinary cut course beneath the ridge, without an additional short finishing course or lath. This factory allowance can be reviewed after a physical build.',
 'LiteSlate uses 5.5 ridge tiles per metre, no ridge support laths and no end cap. Polycarbonate strips run on both sides; butt joints and shared offcuts are allowed. Surplus material has no cost allowance at this stage.',
 'Front barges/dry verge reuse the regular Lean-To open-end quantity calculation. No rear open-end accessories or watercourse are assumed.',
 'The ridge cap’s 70mm product height is not added to the roof peak. Installed ridge height, screw allowances and a tile cutting schedule remain to be reviewed.',
 'Read-only audit: Gable quotations, Summary and manufacture outputs are not changed. The Home Tile Calcs tool is unchanged. Costs are partial candidates, not a complete roof price.'
 ]};
}
