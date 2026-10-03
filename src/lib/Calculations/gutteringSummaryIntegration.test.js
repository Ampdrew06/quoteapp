import { buildHippedGutteringIntegrationAudit } from './gutteringIntegrationAudit';
import { integrateGutteringSummary } from './gutteringSummaryIntegration';
const materials={gutter_square_length_4m_price:9.63,gutter_square_bracket_price:0.78,gutter_square_weight_kg_per_m:0.625,gutter_bracket_weight_kg:0.02,dp_adaptor_price:2.79};
const run=profile=>buildHippedGutteringIntegrationAudit({profile,materials,edgeModel:{valid:true,edges:[['front',7356],['left',3135],['right',3135]].map(([side,lengthMM])=>({id:side,side,lengthMM,kind:'eaves'}))}});
test('replaces legacy front-only quantities and weights installed perimeter, not ordered stock',()=>{
 const lines=integrateGutteringSummary(run('square'),[{key:'g_len',qty:2}],materials);
 expect(lines.find(row=>row.key==='g_len').qty).toBe(4);
 expect(lines.find(row=>row.key==='g_len').line).toBe(38.52);
 expect(lines.find(row=>row.key==='g_len').weight_kg).toBe(8.52);
 expect(lines.find(row=>row.key==='g_brkt').qty).toBe(21);
 expect(lines.find(row=>row.key==='g_stop').qty).toBe(2);
});
test('keeps adaptor adjustment key and omits adaptor for round gutters',()=>{
 expect(integrateGutteringSummary(run('square'),[],materials).find(row=>row.key==='dp_adapt').line).toBe(2.79);
 expect(integrateGutteringSummary(run('round'),[],materials).some(row=>row.key==='dp_adapt')).toBe(false);
});
test('does not duplicate supplied rows when recalculated and retains legacy for invalid geometry',()=>{
 const first=integrateGutteringSummary(run('square'),[],materials);
 expect(integrateGutteringSummary(run('square'),first,materials)).toEqual(first);
 expect(integrateGutteringSummary(null,first,materials)).toBe(first);
});
