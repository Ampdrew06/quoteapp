import {planPlasticsStock,planSoffitStock} from './plasticsIntegrationAudit';
import {calculateFasciaCutHeight} from '../Manufacturing/fasciaCutHeight';
const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
const nextWidth=(widths,v)=>widths.map(Number).filter(Number.isFinite).sort((a,b)=>a-b).find(w=>w>=v)??null;
export function buildGablePlasticsGutteringAudit({geometry:g,materials:m={},plasticsColour='white',gutterProfile='square'}={}) {
 const fail=message=>({valid:false,readOnly:true,errors:[message],plasticLines:[],gutterLines:[],notes:[]});
 if(!g?.valid)return fail('Valid Gable geometry is required.');
 if(!['square','round','ogee'].includes(gutterProfile))return fail('Select square, round or ogee gutter.');
 const band=/^(white|smooth white|white grain)$/i.test(plasticsColour.trim())?'white':'foiled';
 const projection=g.manufacturingProjectionMM??g.externalProjectionMM,cos=Math.cos(g.pitchDeg*Math.PI/180);
 const fasciaStockM=rate(m.fascia_stock_length_m)??5,soffitStockM=rate(m.soffit_stock_length_m)??5,gutterStockM=rate(m.gutter_length_m)??4,spacingMM=rate(m.gutter_bracket_spacing_mm)??800,jStockM=rate(m.j_section_stock_length_m)??5;
 if(Math.min(fasciaStockM,soffitStockM,gutterStockM,spacingMM,jStockM)<=0)return fail('Stock lengths and bracket spacing must be positive.');
 const fasciaSizes=m.fascia_stock_sizes_mm??[200,225,250,300,400],soffitSizes=m.soffit_board_widths_mm??[100,150,175,200];
 const fasciaRates=m[`fascia_price_per_length_${band}_mm`]??{},soffitRates=m[`soffit_price_per_length_${band}_mm`]??{};
 const sideRows=g.feet.map(f=>{const cut=calculateFasciaCutHeight(g.truss.ringBeamHeightMM+f.vfcMM+25/cos);return {edgeId:`eaves-${f.side}`,side:f.side,runM:projection/1000,fasciaCut:cut,widthMM:nextWidth(fasciaSizes,cut.coverageHeightMM),soffitGeometryMM:f.hfcMM-g.frameMM};});
 // Sloping fascia stops where it reaches the outer edge of the central gusset.
 const frontRows=g.feet.map(f=>({edgeId:`front-${f.side}`,side:'frontSlope',runM:(g.widthMM/2+f.hfcMM-g.truss.gusset.widthMM/2)/cos/1000,widthMM:300,soffitGeometryMM:g.frontOverhangMM}));
 const fasciaRuns=[...sideRows,...frontRows];
 if(fasciaRuns.some(r=>r.widthMM==null))return fail('Side fascia coverage exceeds configured stock sizes.');
 const fasciaPlan=planPlasticsStock(fasciaRuns,fasciaStockM);
 const soffitRuns=[...sideRows,...frontRows,{edgeId:'front-flat',side:'frontFlat',runM:g.truss.closure.cutLengthMM/1000,soffitGeometryMM:g.frontOverhangMM}].filter(r=>r.soffitGeometryMM>0);
 const soffitPlan=planSoffitStock(soffitRuns,soffitStockM,soffitSizes,rate(m.soffit_rip_kerf_mm)??3);
 if(soffitPlan.order.some(r=>r.widthMM==null))return fail('Requested soffit width exceeds configured stock sizes.');
 const plasticLines=[],gutterLines=[];
 const add=(list,key,label,qty,unit,price)=>{const p=rate(price);list.push({key,label,qty,unit,unitPrice:p,cost:p==null?null:qty*p});};
 [...new Set(fasciaPlan.boards.map(b=>b.widthMM))].sort((a,b)=>a-b).forEach(w=>add(plasticLines,`fascia-${w}`,`${w}mm Reveal Liner`,fasciaPlan.boards.filter(b=>b.widthMM===w).length,`${fasciaStockM}m boards`,fasciaRates[w]));
 soffitPlan.order.forEach(r=>add(plasticLines,`soffit-${r.widthMM}`,`${r.widthMM}mm soffit`,r.qty,`${soffitStockM}m boards`,soffitRates[r.widthMM]));
 const boxEndCoverageReview=false; // Supplied as one blank, cut to suit; stock dimensions await a cut-detail review.
 add(plasticLines,'boxEnd','Central box end — one blank, cut to suit',1,'blank',m[`gable_box_end_400x1000_${band}_price`]);
 add(plasticLines,'corners','Front fascia corners — two per side',4,'each',m[`fascia_corner_90_ext_300_${band}_price`]);
 add(plasticLines,'joints','Fascia joints — two box-end joins plus stock joins',2+fasciaPlan.joints,'each',m[`fascia_joint_300_${band}_price`]);
 // J-trim follows the external frame/A-frame profile, not the overhanging roof perimeter.
 const frontJRunMM=2*(g.widthMM/2+g.frameMM-g.truss.gusset.widthMM/2)/cos+g.truss.closure.cutLengthMM;
 const jRunM=(2*(g.projectionMM+g.frameMM)+frontJRunMM)/1000;
 add(plasticLines,'jTrim','J-trim — side frames and front slopes/flat',Math.ceil(jRunM/jStockM),`${jStockM}m lengths`,m[`fascia_j_section_${band}_price`]);
 const ventM=m.vent_rounding_mode==='exact'?2*projection/1000:Math.ceil(2*projection/1000);
 add(plasticLines,'venting','Factory venting — side eaves',ventM,'m',m.fascia_vent_price_per_m);
 const hRunMM=soffitPlan.runPieces.reduce((s,r)=>s+Math.max(0,r.lengthsM.length-1)*(soffitRuns.find(x=>x.edgeId===r.edgeId)?.soffitGeometryMM??0),0);
 add(plasticLines,'hTrim','H-trim — straight soffit stock joins only',hRunMM/1000,'m consumed',rate(m[`fascia_h_section_${band}_price`])==null?null:Number(m[`fascia_h_section_${band}_price`])/5);
 add(plasticLines,'pins','Colour-matched polytop pins',1,'50-pin allowance',m.polytop_pins_price_per_box??m.polytopPins?.price_per_box??m.polytop_pins_price_each);
 const gutterRuns=sideRows.map(r=>({...r,widthMM:0,side:'gutter'}));
 const gutterPlan=planPlasticsStock(gutterRuns,gutterStockM);
 const bracketsPerSide=Math.ceil(projection/spacingMM)+1;
 const counts={lengths:gutterPlan.qty,unions:gutterPlan.joints,brackets:2*bracketsPerSide,corners:0,outlets:2,stopEnds:4,pipes:2,offsetBends:4,clips:4,shoes:2,adaptors:gutterProfile==='round'?0:2};
 const select=(...keys)=>keys.map(k=>m[k]).find(v=>v!=null);
 const rows=[['lengths','Gutter lengths',`${gutterStockM}m lengths`,select(`gutter_${gutterProfile}_length_4m_price`)],['unions','Gutter unions','each',select(`gutter_${gutterProfile}_union_price`)],['brackets','Gutter brackets','each',select(`gutter_${gutterProfile}_bracket_price`)],['outlets','Running outlets','each',select(`gutter_${gutterProfile}_running_outlet_price`)],['stopEnds','Stop ends','each',select(`gutter_${gutterProfile}_stop_end_price`)],['pipes','Round downpipe','2.5m lengths',select('dp_length_2_5m_price','downpipe_length_2_5m_price','downpipe_length_price')],['offsetBends','Round offset bends','each',select('dp_bend_price','downpipe_bend_price')],['clips','Downpipe clips','each',select('dp_clip_price','downpipe_clip_price')],['shoes','Downpipe shoes','each',select('dp_shoe_price','downpipe_shoe_price')],['adaptors','Square/ogee to round adaptors','each',select('dp_adaptor_price','sq_to_round_adaptor_price')]];
 rows.filter(r=>counts[r[0]]>0).forEach(([key,label,unit,price])=>add(gutterLines,key,label,counts[key],unit,price));
 return {valid:true,readOnly:true,errors:[],band,boxEndCoverageReview,sideRows,frontRows,fasciaPlan,soffitPlan,gutterPlan,counts,bracketsPerSide,spacingMM,jRunM,frontJRunMM,ventM,plasticLines,gutterLines,notes:[
 'Includes 5mm front soffit clearance—do not add again. Both side ring-beams and the front truss use manufacturing projection. Requested front soffit width and quotation dimensions remain unchanged.',
 'Gutters are independent side runs. Brackets use ceiling(each run / spacing) + one per run. Suitable stock offcuts are shared; unions and corners receive no additional brackets. Each side has its own outlet and round downpipe assembly.',
 'Side fascia cut heights reuse the shared soffit/lip/starter clearance rule. Front sloping fascia uses confirmed 300mm stock to cover the 289mm build-up: 220mm truss, 25mm external lath, 34mm internal lath/quilt and 10mm lining.',
 'One central box-end blank is supplied per roof and cut to cover the front gusset. It joins the two sloping fascias with two joints. Its exact cut outline, finished height and joint fitting lengths require a workshop drawing; no finished box-end cut dimensions are claimed.',
 'Front soffit includes two sloping runs and the flat under the closure. Width follows the requested overhang. J-trim follows side frame runs and the assumed front A-frame slopes/flat, including the central flat; confirm the A-frame fixing profile in the factory.',
 'Four front fascia corners are allowed as instructed. Corner angle/detail, soffit corner H-trim and front flat-to-slope joints require confirmation. H-trim currently includes straight stock joints only.',
 'Board quantities share compatible offcuts using existing stock planners. A fitting candidate is shown, not a validated manufacture cut list. Only the side eaves receive factory venting.',
 'Polytop price is the same existing single 50-pin allowance; confirm the stored Materials price represents that allowance, not a full 250-pin box.',
 'Box-end Materials prices are separate white/foiled entries. Missing prices remain Unconfigured. No installed plastic weights are changed in this audit.',
 'Read-only Gable requirements. Summary, quotation pricing, loading lists, manufacture books and existing Lean-To/Hipped calculations are unchanged.'
 ]};
}
