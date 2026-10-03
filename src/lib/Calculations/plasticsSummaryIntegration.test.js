import { integratePlasticsSummary } from './plasticsSummaryIntegration';
import { buildHippedPlasticsIntegrationAudit } from './plasticsIntegrationAudit';
const materials = { fascia_price_per_length_white_mm:{250:30},soffit_price_per_length_white_mm:{150:20,200:25},fascia_weight_kg_per_m_white:1,soffit_weight_kg_per_m_white:0.8 };
const audit = buildHippedPlasticsIntegrationAudit({materials, geometry:{widthMM:7040,projectionMM:2910,facets:['front','left','right'].map(id=>({id,ringBeam:{eavesGeometry:{plumbCutHeightMM:159.8,soffitDepthMM:id==='front'?150:90}}}))},edgeModel:{valid:true,edges:['front','left','right'].map(side=>({id:side,side,kind:'eaves',facetIds:[side],lengthMM:side==='front'?7356:3135}))}});
test('integrates purchased widths and installed lengths without duplicate pins or legacy end fascia',()=>{
 const result=integratePlasticsSummary(audit,[{key:'end_fascia'},{key:'fascia'}],materials);
 expect(result.find(row=>row.key==='fascia').qty).toBe(3);
 expect(result.find(row=>row.key==='fascia').line).toBe(90);
 expect(result.find(row=>row.key==='fascia').weight_kg).toBe(13.63);
 expect(result.filter(row=>row.key.startsWith('soffit')).reduce((sum,row)=>sum+row.line,0)).toBe(65);
 expect(Number(result.filter(row=>row.key.startsWith('soffit')).reduce((sum,row)=>sum+row.weight_kg,0).toFixed(2))).toBe(10.9);
 expect(result.some(row=>row.key==='polytop_pins'||row.key==='end_fascia')).toBe(false);
 expect(result.find(row=>row.key==='fascia_joints').qty).toBe(2);
});
test('retains legacy plastics when geometry is invalid or open verges need review',()=>{
 const legacy=[{key:'fascia'}];
 expect(integratePlasticsSummary(null,legacy)).toBe(legacy);
 expect(integratePlasticsSummary({...audit,remainingOpenVerges:[{}]},legacy)).toBe(legacy);
});
