import {buildEdwardianRingBeamAudit} from './edwardianRingBeamAudit';
import {buildHippedPlasticsIntegrationAudit} from './plasticsIntegrationAudit';
import {buildHippedGutteringIntegrationAudit} from './gutteringIntegrationAudit';
export function buildEdwardianPlasticsGutteringAudit({geometry:g,materials:m={},plasticsColour='white',gutterProfile='square'}={}){
 const fail=errors=>({valid:false,readOnly:true,errors,plasticLines:[],gutterLines:[]});
 const ring=buildEdwardianRingBeamAudit({geometry:g});if(!ring.valid)return fail(ring.errors);
 const facets=ring.ringBeams.map(b=>({id:b.side==='front'?'facet-front':`facet-${b.side}-side`,ringBeam:{...b,eavesGeometry:{...b.eavesGeometry,soffitDepthMM:g.soffitRequestedNone?(b.side==='front'?Math.max(0,g.eaves.effectiveReferenceSoffitMM-Number(m.fascia_lip_mm??25)):0):b.side==='front'?g.eaves.effectiveReferenceSoffitMM:g.eaves[b.side].manufacturedSoffitMM}}}));
 const edgeModel={valid:true,edges:['left','front','right'].map(side=>({id:`eaves-${side}`,kind:'eaves',side,lengthMM:side==='front'?g.externalWidthMM:g.externalProjectionMM,facetIds:[side==='front'?'facet-front':`facet-${side}-side`]}))};
 const front=g.eaves.referenceGeometry.raw;
 const structuralHeightMM=Number(m.ring_beam_height_mm??40)+front.manufacturedPlumbCutHeightMM+25/Math.cos(g.frontPitchDeg*Math.PI/180);
 const geometry={...(g.soffitRequestedNone?{soffitRequestedNone:true}:{}),widthMM:g.widthMM,projectionMM:g.projectionMM,frontFinishedFasciaHeightMM:structuralHeightMM,facets};
 const materials={...m,side_frame_thickness_mm:g.frameMM};
 const plastics=buildHippedPlasticsIntegrationAudit({geometry,edgeModel,materials,plasticsColor:plasticsColour});
 const guttering=buildHippedGutteringIntegrationAudit({edgeModel,materials,profile:gutterProfile});
 if(!plastics.valid||!guttering.valid)return fail([...plastics.errors,...guttering.errors]);
 const plasticLines=[];
 const add=(key,label,qty,unit,price)=>{const p=price==null||price===''||!Number.isFinite(Number(price))||Number(price)<0?null:Number(price);plasticLines.push({key,label,qty,unit,cost:p==null?null:qty*p});};
 const band=plastics.band,fasciaPrices=m[`fascia_price_per_length_${band}_mm`]||{},soffitPrices=m[`soffit_price_per_length_${band}_mm`]||{};
 [...new Set(plastics.fasciaPlan.boards.map(b=>b.widthMM))].sort((a,b)=>a-b).forEach(w=>add(`fascia-${w}`,`${w}mm Reveal Liner`,plastics.fasciaPlan.boards.filter(b=>b.widthMM===w).length,`${plastics.rows[0].fasciaStockM}m boards`,fasciaPrices[w]));
 plastics.soffitPlan.order.forEach(r=>add(`soffit-${r.widthMM}`,`${r.widthMM}mm soffit`,r.qty,`${plastics.rows[0].soffitStockM}m boards`,soffitPrices[r.widthMM]));
 plasticLines.push(...plastics.accessories.lines);
 add('factory_venting','Factory fascia venting — all eaves',plastics.totals.ventQtyM,'m',m.fascia_vent_price_per_m??0.5);
 return {valid:true,readOnly:true,errors:[],band,edgeModel,plastics,guttering,plasticLines,gutterLines:guttering.items.map(l=>l.key==='dp_bend'?{...l,label:'Round 112° downpipe offset bends'}:l),
  knownPlasticCost:plasticLines.reduce((n,l)=>n+(l.cost??0),0),knownGutterCost:guttering.items.reduce((n,l)=>n+(l.cost??0),0),notes:[
   'Both audits reuse the existing Hipped planners and accessory rules. All three open ring-beam facets receive fascia, soffit, venting and gutters.',
   'Fascia structural height includes ring-beam height, resolved VFC and chamfered lath. The shared preparation rule adds 10mm soffit and 10mm lip, then deducts 5mm tile-starter clearance. Reveal Liner order coverage is measured above the internal lip.',
   'Fascia and soffit are supplied in full stock lengths. Suitable offcuts are shared; matching side soffit strips can use wider stock when both widths and rip kerf fit. The fitting plan is not a validated factory cut list.',
   'Gutters use 4m stock with suitable offcuts shared. Runs exceeding one stock length receive unions; the two 90-degree front mitres receive gutter bends.',
   'Brackets retain the shared continuous-perimeter allowance: ceiling(total eaves / configured spacing) + one. No extra brackets are added for unions or corners.',
   'One round downpipe assembly: two stop ends, one outlet, one square-to-round adaptor for square/ogee, two round 112-degree offset bends, one downpipe, two clips and one shoe.',
   'Fascia straight joints follow the stock fitting plan; each 90-degree front corner receives one fascia corner. No Gable box end or sloping-front fascia is required.',
   'J-trim follows the external frame perimeter, excluding soffit extensions. H-trim includes each required straight soffit stock join and both mitred corners; consumed length is priced from shared 5m stock.',
   'Polytop pins are one colour-matched 50-pin allowance, priced once. Manual variations remain for the future shared Summary adjustments.',
   'Read-only: existing styles, Summary, quotation prices, installed plastic/gutter weights, manufacture and Idiot List are unchanged.'
  ]};
}
