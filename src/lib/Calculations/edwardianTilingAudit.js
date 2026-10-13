import {calculateRoofTiling} from './facetTilingCalc';
import {buildSteelTileCourseAudit} from './steelTileCourseAudit';
import {buildHipRidgeLathIntegrationAudit} from './hipRidgeLathIntegrationAudit';
import {calculateHipPerimeterIntersection} from '../geometry/hipPerimeterIntersection';
const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
export function buildEdwardianTilingAudit({geometry:g,materials:m={},productId='britmetShingle'}={}){
 const fail=message=>({valid:false,readOnly:true,errors:[message],lines:[],facets:[]});
 if(!g?.valid)return fail('Valid Edwardian geometry is required.');
 if(!['britmetShingle','metrotileShingle','liteSlate'].includes(productId))return fail('Select Britmet, Metrotile or LiteSlate.');
 const steel=productId!=='liteSlate',c=p=>Math.cos(p*Math.PI/180),half=g.widthMM/2;
 const facets=[
  {id:'facet-left-side',label:'Left roof facet',baseWidthMM:g.externalProjectionMM+50,topWidthMM:g.ridgeEndYMM,heightMM:(half+g.externalLeftMM+50)/c(g.pitchDeg),pitchDeg:g.pitchDeg,topEdgeType:steel?'ridge':'gableRidgeWithoutExtraCourse'},
  {id:'facet-front',label:'Front roof facet',baseWidthMM:g.externalWidthMM+100,topWidthMM:0,heightMM:(g.ridgeSetbackMM+g.externalFrontMM+50)/c(g.frontPitchDeg),pitchDeg:g.frontPitchDeg},
  {id:'facet-right-side',label:'Right roof facet',baseWidthMM:g.externalProjectionMM+50,topWidthMM:g.ridgeEndYMM,heightMM:(half+g.externalRightMM+50)/c(g.pitchDeg),pitchDeg:g.pitchDeg,topEdgeType:steel?'ridge':'gableRidgeWithoutExtraCourse'}
 ];
 const result=calculateRoofTiling({facets,product:productId});if(result.errors.length)return fail(result.errors.join(' '));
 const sequence=steel?buildSteelTileCourseAudit({automaticRoofTiling:{productId,result},minimumStarterMM:200}):null;
 if(steel&&(!sequence.valid||!sequence.staggerComplete))return fail('Steel course sequence could not be completed.');
 const mainTiles=steel?sequence.staggerOrder:result.tileQuantityOrdered;
 const plan=Math.hypot(half,g.ridgeSetbackMM),edges=[{id:'ridge',kind:'ridge',lengthMM:g.ridgeEndYMM}];
 for(const side of ['left','right']){
  const footprint=calculateHipPerimeterIntersection({widthRunMM:half,projectionRunMM:g.ridgeSetbackMM,sideBaseWidthMM:side==='left'?g.externalLeftMM:g.externalRightMM,frontBaseWidthMM:g.externalFrontMM});
  if(!footprint.valid)return fail(footprint.error);
  edges.push({id:`hip-${side}`,kind:'hip',side,lengthMM:(plan+footprint.centrelineExitMM)/c(g.hipPitchDeg)});
 }
 const support=buildHipRidgeLathIntegrationAudit({edgeModel:{valid:true,edges},tileSystem:productId,materials:m,currentLathM:result.lathLengthMM/1000});
 if(!support.valid)return fail(support.errors.join(' '));
 const tileQty=length=>steel?Math.ceil(Math.max(0,length-1250)/1150)+1:Math.ceil(length/1000*5.5);
 const edgeTiles=edges.map(e=>({...e,tileQty:tileQty(e.lengthMM)}));
 const ridgeTiles=edgeTiles[0].tileQty,hipTiles=edgeTiles.slice(1).reduce((n,e)=>n+e.tileQty,0),ridgeMM=g.ridgeEndYMM;
 const fieldLathM=result.lathLengthMM/1000,stockM=rate(m.lath_stock_length_m)??4.8;if(stockM<=0)return fail('Lath stock length must be positive.');
 const chamferM=result.facets.reduce((n,f)=>n+f.lathRows.filter(r=>Math.abs(r.yMM??r.positionMM??r.y??-1)<1e-7).reduce((s,r)=>s+r.widthMM/1000,0),0);
 const externalLathM=fieldLathM+support.quantities.additionalLathM,eavesM=(2*g.externalProjectionMM+g.externalWidthMM)/1000;
 const lines=[],add=(key,label,quantity,unit,price)=>{const p=rate(price);lines.push({key,label,quantity,unit,unitPrice:p,cost:p==null?null:quantity*p});};
 add('main','Main tiles — course ordering candidate',mainTiles,'tiles',steel?m.tile_britmet_price_each:m.liteslate_tile_price_each);
 add('ridge','Ridge tiles — house wall to ridge point',ridgeTiles,'tiles',steel?m.britmet_ridge_tile_price_each:m.liteslate_ridge_tile_price_each);
 add('hips','Hip tiles — full ridge-point-to-eaves lengths',hipTiles,'tiles',steel?m.britmet_ridge_tile_price_each:m.liteslate_ridge_tile_price_each);
 add('yAdaptor','Three-way Y adaptor',1,'each',steel?m.britmet_y_adaptor_price_each:m.liteslate_three_way_adaptor_price??m.liteslate_ridge_hip_adaptor_price_each);
 add('hipEndCaps','90° hip end caps',2,'each',steel?m.britmet_hip_end_cap_90_price_each:m.liteslate_hip_end_cap_90_price??m.liteslate_hip_end_cap_90_price_each);
 if(steel){add('vents','500mm ridge ventilation strips',Math.ceil(2*ridgeMM/500),'strips',m.britmet_vent_strip_price_each);add('tape','Expanding foam tape — hips only',support.quantities.tapeRollQty,'5.6m rolls',m.expanding_foam_roll_price_each);}
 else lines.push({key:'polycarbonate',label:'Factory 6mm twinwall strips, 50mm wide — ridge',quantity:Math.ceil(2*ridgeMM/3000),unit:'3m strips',unitPrice:0,cost:0});
 add('fieldLaths','25×50 external field laths — includes perimeter rows',fieldLathM,'m',m.lath25x50?.price_per_m);
 add('supportLaths','25×50 hip and ridge support laths',support.quantities.additionalLathM,'m',m.chamferLath?.price_per_m);
 add('starter','3m tile starter — all three eaves',Math.ceil(eavesM/3),'lengths',m.eaves_guard_price_each);
 return {valid:true,readOnly:true,errors:[],productId,steel,facets,result,sequence,mainTiles,edges:edgeTiles,ridgeMM,ridgeTiles,hipTiles,support,fieldLathM,chamferM,externalLathM,stockM,lathStockLengths:Math.ceil(externalLathM/stockM),lines,knownCost:lines.reduce((n,l)=>n+(l.cost??0),0),notes:[
  'Main tiles reuse the shared facet engine. Steel uses accepted right-to-left stagger, squared reusable offcuts with 295mm physical minimum and two extra tiles per roof. Home Tile Calcs is unchanged.',
  'Hip covering lengths run from the ridge point to the external foot perimeter. Neither the 156mm timber terminal deduction nor spar-hook cut shortening is deducted from tile coverage.',
  'Ridge covering runs from the house wall to the ridge point. Steel pieces use 1250mm first coverage and 1150mm subsequent coverage, rounded separately per hip/ridge. LiteSlate uses 5.5 pieces per metre, rounded separately per run.',
  'Two 90-degree hip end caps and one three-way Y adaptor are supplied for either covering. The Y adaptor caps the hip/ridge junction; no separate joint fitting or Gable ridge end cap is added.',
  'Steel uses two 25×50 support laths along each hip and ridge. Foam tape is under hip laths only; 500mm ventilation strips are under ridge laths. Slate has no support laths or foam tape.',
  'LiteSlate ridge ventilation uses two 50mm-wide strips of surplus 6mm twinwall polycarbonate. 3m stock is pooled with butt joints; no material cost is added.',
  'Side facets have a ridge edge; LiteSlate retains the agreed Gable rule of no additional short ridge finishing course. The front is a triangle.',
  'Facet tile envelopes include 50mm plan beyond the manufacturing eaves. Tiny square-leg corner differences are represented by trapezoid/triangle envelopes for course ordering.',
  'External field laths include their chamfered perimeter rows. Hip/ridge support laths are added once, with pooled 4.8m stock; internal and ring-beam laths remain separate uses.',
  'This audit supports the three currently completed coverings. Tapco ventilation follows the same polycarbonate principle when its Edwardian product/accessory audit is introduced.',
  'Read-only: quantities and partial costs do not alter Summary, quotations, manufacture or Idiot List.'
 ]};
}
