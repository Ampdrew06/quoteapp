import {buildEdwardianGeometry} from '../geometry/edwardianGeometry';
import {buildVictorianGeometry} from '../geometry/victorianGeometry';
import {buildVictorianSoffitSupply} from '../Manufacturing/victorianSoffitSupply';
import {calculateFasciaCutHeight} from '../Manufacturing/fasciaCutHeight';
import {planPlasticsStock} from './plasticsIntegrationAudit';
import {buildHippedGutteringIntegrationAudit} from './gutteringIntegrationAudit';
// Isolated review: no Summary or customer price mutation.
export function buildVictorianPlasticsGutteringAudit({geometry:g,materials:m={},plasticsColour='white',gutterProfile='ogee'}={}){
 const fail=errors=>({valid:false,readOnly:true,errors,plasticLines:[],gutterLines:[]});
 if(!g?.valid)return fail(['Valid Victorian geometry required.']);
 if(g.adjustedAngles)return fail(['Adjusted-angle plastic and gutter corners require review.']);
 const soffit=buildVictorianSoffitSupply(g,m);
 const e=buildEdwardianGeometry({inputs:{widthMM:g.widthMM,projMM:g.projectionMM,pitchDeg:g.pitchDeg,frameThicknessMM:g.frameMM,soffitMM:g.soffitMM,sideSoffitMode:g.soffitMode==='specified'?'specified':'automatic',specifiedSideSoffitMM:g.soffitMM},materials:m});
 if(!soffit.valid||!e.valid)return fail([...(soffit.errors||[]),...(e.errors||[])]);
 const band=/^(white|smooth white|white grain)$/i.test(String(plasticsColour).trim())?'white':'foiled';
 const fasciaStockM=Number(m.fascia_stock_length_m??5);
 if(!(fasciaStockM>0))return fail(['Positive fascia stock length required.']);
 const structuralHeightMM=Number(m.ring_beam_height_mm??40)+e.eaves.referenceGeometry.raw.manufacturedPlumbCutHeightMM+25/Math.cos(g.pitchDeg*Math.PI/180);
 const fasciaCut=calculateFasciaCutHeight(structuralHeightMM);
 const fasciaWidthMM=(m.fascia_stock_sizes_mm||[200,225,250,300,400]).map(Number).sort((a,b)=>a-b).find(w=>w>=fasciaCut?.coverageHeightMM);
 if(!fasciaWidthMM)return fail(['Fascia height exceeds configured stock.']);
 const rows=g.facets.map(f=>({edgeId:f.id,label:f.label,side:'victorian',runM:f.externalLengthMM/1000,widthMM:fasciaWidthMM}));
 const fasciaPlan=planPlasticsStock(rows,fasciaStockM);
 const edgeModel={valid:true,edges:g.facets.map(f=>({id:f.id,kind:'eaves',lengthMM:f.externalLengthMM,side:'victorian'}))};
 const guttering=buildHippedGutteringIntegrationAudit({edgeModel,materials:m,profile:gutterProfile});
 if(!guttering.valid)return fail(guttering.errors);
 const price=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
 const plasticLines=[];
 const add=(key,label,qty,unit,rate,pricedQty=qty)=>{const r=price(rate);plasticLines.push({key,label,qty,unit,cost:qty===0?0:r==null?null:pricedQty*r});};
 add('fascia',`${fasciaWidthMM}mm Reveal Liner — ${plasticsColour}`,fasciaPlan.qty,`${fasciaStockM}m boards`,m[`fascia_price_per_length_${band}_mm`]?.[fasciaWidthMM]);
 soffit.order.forEach(r=>add(`soffit-${r.widthMM}`,`${r.widthMM}mm soffit — ${plasticsColour}`,r.qty,`${soffit.stockLengthMM/1000}m boards`,m[`soffit_price_per_length_${band}_mm`]?.[r.widthMM]));
 // Same polygon offset operation as the ringbeam: frame outline excludes soffit.
 const frame=buildVictorianGeometry({inputs:{widthMM:g.widthMM,projMM:g.projectionMM,pitchDeg:g.pitchDeg,frameThicknessMM:g.frameMM,soffitMode:'specified',soffitMM:g.fasciaThicknessMM,fasciaThicknessMM:g.fasciaThicknessMM},materials:m});
 if(!frame.valid)return fail(frame.errors);
 const jRunM=frame.facets.reduce((n,f)=>n+f.externalLengthMM/1000,0),jStockM=Number(m.j_section_stock_length_m??5);
 if(!(jStockM>0))return fail(['Positive J-trim stock length required.']);
 add('j_trim',`Soffit starter / J-trim — ${plasticsColour}`,Math.ceil(jRunM/jStockM),`${jStockM}m lengths`,m[`fascia_j_section_${band}_price`]??m[`j_section_price_each_${band}`]);
 // Equal-depth 135-degree mitre seam: depth / sin(half interior angle).
 const hCornerMM=soffit.stripWidthMM>0?Math.ceil(soffit.stripWidthMM/Math.sin(67.5*Math.PI/180)/10)*10:0;
 const soffitFit=planPlasticsStock(rows.map(r=>({...r,widthMM:soffit.stripWidthMM})),soffit.stockLengthMM/1000);
 const hLengthMM=soffit.stripWidthMM>0?4*hCornerMM+soffitFit.joints*soffit.stripWidthMM:0;
 add('h_trim',`H-trim — ${plasticsColour}`,hLengthMM,'mm from shared 5m stock',m[`fascia_h_section_${band}_price`],hLengthMM/5000);
 add('fascia_corners',`135° fascia corners — ${plasticsColour}`,4,'each',m[`fascia_corner_135_300_${band}_price`]);
 add('fascia_joints',`Fascia straight joints — ${plasticsColour}`,fasciaPlan.joints,'each',m[`fascia_joint_300_${band}_price`]??m[`fascia_joint_price_each_${band}`]);
 add('polytop_pins',`Polytop pins — ${plasticsColour}`,50,'pins',m.polytop_pins_price_per_box??m.polytopPins?.price_per_box,1);
 const totalRunM=rows.reduce((n,r)=>n+r.runM,0),ventQtyM=m.vent_rounding_mode==='exact'?totalRunM:Math.ceil(totalRunM);
 add('factory_venting','Factory fascia venting — all five eaves',ventQtyM,'m',m.fascia_vent_price_per_m??0.5);
 const cornerPrice=price(m[`gutter_${guttering.profile}_corner_135_ext_price`]);
 const gutterLines=guttering.items.filter(r=>r.key!=='g_corner_90').map(r=>({...r}));
 gutterLines.push({key:'g_corner_135',label:'135° external gutter corners',qty:4,unit:'each',cost:cornerPrice==null?null:4*cornerPrice});
 const counts={...guttering.counts,corners90:0,corners135:4};
 const lines=[...plasticLines,...gutterLines];
 return {valid:true,readOnly:true,errors:[],band,rows,soffit,fasciaPlan,fasciaCut,fasciaWidthMM,totalRunM,jRunM,hCornerMM,hLengthMM,ventQtyM,guttering:{...guttering,counts,items:gutterLines,totalCost:gutterLines.some(r=>r.cost==null)?null:gutterLines.reduce((n,r)=>n+r.cost,0),assumptions:['Victorian perimeter: four 135-degree corners; standard shared stock and downpipe allowances.']},plasticLines,gutterLines,knownCost:lines.reduce((n,r)=>n+(r.cost??0),0),costComplete:lines.every(r=>r.cost!=null),notes:[
 'Full fascia, soffit and gutter stock is supplied for site cutting; this is a stock allowance, not a numbered factory cut list.',
 'Specified soffit includes the fascia envelope; the Leah 50mm detail uses 35mm strips. The ripping allowance includes saw kerf.',
 'J-trim follows the external frame polygon. H-trim covers four 135° mitres and necessary straight soffit joins; priced by consumption from shared stock.',
 'Four 4m gutter lengths are needed for Leah to keep all five runs unjoined; three lengths would require an extra straight joint.',
 'Gutter brackets retain the shared continuous-perimeter allowance. One downpipe assembly includes two offset bends, two clips and a shoe; site-specific extras are not inferred from the historical job.',
 'Starter and hip foam tape remain allocated in the covering audit. Polytop pins are priced once here. Missing weights are deferred.',
 'Read-only review: Summary, customer pricing and existing roof styles remain unchanged.'
 ]};
}
