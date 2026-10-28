import {buildEdwardianGeometry} from '../geometry/edwardianGeometry';
import {buildVictorianPlanGeometry} from '../geometry/victorianGeometry';
import {buildVictorianSoffitSupply} from '../Manufacturing/victorianSoffitSupply';
import {calculateFasciaCutHeight} from '../Manufacturing/fasciaCutHeight';
import {planPlasticsStock} from './plasticsIntegrationAudit';
import {buildHippedGutteringIntegrationAudit} from './gutteringIntegrationAudit';
// Isolated review: no Summary or customer price mutation.
export function buildVictorianPlasticsGutteringAudit({geometry:g,materials:m={},plasticsColour='white',gutterProfile='ogee'}={}){
 const fail=errors=>({valid:false,readOnly:true,errors,plasticLines:[],gutterLines:[]});
 if(!g?.valid)return fail(['Valid Victorian geometry required.']);
 if(g.adjustedAngles)return fail(['Adjusted-angle plastic and gutter corners require review.']);
 const five=g.frontFacetCount===5,cornerAngle=five?150:135,stockCornerAngle=135,cornerQty=g.hips.length;
 const soffit=buildVictorianSoffitSupply(g,m);
 const e=g.eaves?{valid:true,frontPitchDeg:g.pitchDeg,eaves:g.eaves}:buildEdwardianGeometry({inputs:{widthMM:g.widthMM,projMM:g.projectionMM,pitchDeg:g.pitchDeg,frameThicknessMM:g.frameMM,soffitMM:g.soffitMM,sideSoffitMode:g.soffitMode==='specified'?'specified':'automatic',specifiedSideSoffitMM:g.soffitMM},materials:m});
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
 const frame=buildVictorianPlanGeometry({inputs:{widthMM:g.widthMM,projMM:g.projectionMM,pitchDeg:g.pitchDeg,frameThicknessMM:g.frameMM,soffitMode:'specified',soffitMM:g.fasciaThicknessMM,fasciaThicknessMM:g.fasciaThicknessMM},materials:m},g.frontFacetCount??3);
 if(!frame.valid)return fail(frame.errors);
 const jRunM=frame.facets.reduce((n,f)=>n+f.externalLengthMM/1000,0),jStockM=Number(m.j_section_stock_length_m??5);
 if(!(jStockM>0))return fail(['Positive J-trim stock length required.']);
 add('j_trim',`Soffit starter / J-trim — ${plasticsColour}`,soffit.stripWidthMM>0?Math.ceil(jRunM/jStockM):0,`${jStockM}m lengths`,m[`fascia_j_section_${band}_price`]??m[`j_section_price_each_${band}`]);
 // Equal-depth 135-degree mitre seam: depth / sin(half interior angle).
 const hCornerMM=soffit.stripWidthMM>0?Math.ceil(soffit.stripWidthMM/Math.sin(cornerAngle/2*Math.PI/180)/10)*10:0;
 const soffitFit=planPlasticsStock(rows.map(r=>({...r,widthMM:soffit.stripWidthMM})),soffit.stockLengthMM/1000);
 const hLengthMM=soffit.stripWidthMM>0?cornerQty*hCornerMM+soffitFit.joints*soffit.stripWidthMM:0;
 add('h_trim',`H-trim — ${plasticsColour}`,hLengthMM,'mm from shared 5m stock',m[`fascia_h_section_${band}_price`],hLengthMM/5000);
 add('fascia_corners',`${stockCornerAngle}° fascia corners${five?' — adapt/mitre for150° roof joints':''} — ${plasticsColour}`,cornerQty,'each',m[`fascia_corner_${stockCornerAngle}_300_${band}_price`]);
 add('fascia_joints',`Fascia straight joints — ${plasticsColour}`,fasciaPlan.joints,'each',m[`fascia_joint_300_${band}_price`]??m[`fascia_joint_price_each_${band}`]);
 add('polytop_pins',`Polytop pins — ${plasticsColour}`,50,'pins',m.polytop_pins_price_per_box??m.polytopPins?.price_per_box,1);
 const totalRunM=rows.reduce((n,r)=>n+r.runM,0),ventQtyM=m.vent_rounding_mode==='exact'?totalRunM:Math.ceil(totalRunM);
 add('factory_venting',`Factory fascia venting — all ${g.facets.length} eaves`,ventQtyM,'m',m.fascia_vent_price_per_m??0.5);
 const cornerPrice=price(m[`gutter_${guttering.profile}_corner_${stockCornerAngle}_ext_price`]);
 const gutterLines=guttering.items.filter(r=>r.key!=='g_corner_90').map(r=>({...r}));
 gutterLines.push({key:`g_corner_${stockCornerAngle}`,label:five?'135° gutter bends — factory cut/weld to150°':'135° external gutter corners',qty:cornerQty,unit:'each',cost:cornerPrice==null?null:cornerQty*cornerPrice});
 const counts={...guttering.counts,corners90:0,corners135:cornerQty,...(five?{roofCorners150:cornerQty}:{})};
 const lines=[...plasticLines,...gutterLines];
 return {valid:true,readOnly:true,errors:[],band,rows,soffit,fasciaPlan,fasciaCut,fasciaWidthMM,totalRunM,jRunM,hCornerMM,hLengthMM,ventQtyM,guttering:{...guttering,counts,items:gutterLines,totalCost:gutterLines.some(r=>r.cost==null)?null:gutterLines.reduce((n,r)=>n+r.cost,0),assumptions:[`Victorian perimeter: ${cornerQty} ${cornerAngle}-degree roof joints; supply ${cornerQty}135-degree stock corners.5-facet gutter bends are factory cut/welded; fascia corners are adapted or mitred on site.`]},plasticLines,gutterLines,knownCost:lines.reduce((n,r)=>n+(r.cost??0),0),costComplete:lines.every(r=>r.cost!=null),notes:[
 five?'Full fascia, soffit and straight gutter lengths remain site-cut stock. Six135° fascia corners are supplied for fitting/adapting or site mitring; six135° gutter bends are cut/welded in the factory to suit150° roof joints. No additional fabrication charge has been invented.':'Full fascia, soffit and gutter stock is supplied for site cutting; this is a stock allowance, not a numbered factory cut list.',
 g.soffitRequirement==='none'?'No soffit boards, J-trim or H-trim are supplied. The compulsory fascia lip remains.':g.soffitRequirement==='specified'?`Both sides use the required ${g.requestedSideSoffitMM}mm fascia envelope; strips are ${g.soffitStripWidthMM}mm after fascia and fitting/trim allowances.`:'Specified soffit includes the fascia envelope; the Leah 50mm detail uses 35mm strips. The ripping allowance includes saw kerf.',
 `J-trim follows the external frame polygon. H-trim covers ${cornerQty} ${cornerAngle}° mitres and necessary straight soffit joins; priced by consumption from shared stock.`,
 'Whole gutter stock follows the actual perimeter runs and the existing shared joint allowance.',
 'Gutter brackets retain the shared continuous-perimeter allowance. One downpipe assembly includes two offset bends, two clips and a shoe; site-specific extras are not inferred from the historical job.',
 'Starter and hip foam tape remain allocated in the covering audit. Polytop pins are priced once here. Missing weights are deferred.',
 'Read-only review: Summary, customer pricing and existing roof styles remain unchanged.'
 ]};
}
