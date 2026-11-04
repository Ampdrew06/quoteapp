import {planJoinedLinearStock} from './joinedLinearStock';
import {planPlasticsStock} from './plasticsIntegrationAudit';
const runs=[2.520,1.567,1.561,1.567,2.520].map((runM,n)=>({edgeId:`run-${n}`,runM,widthMM:0}));
test('9735mm perimeter uses three four-metre gutters and one union',()=>{
 const p=planJoinedLinearStock(runs,4);expect(p.valid).toBe(true);expect(p.qty).toBe(3);expect(p.joints).toBe(1);
 p.boards.forEach(b=>expect(b.pieces.reduce((n,p)=>n+p.lengthM,0)).toBeLessThanOrEqual(4+1e-8));
 p.runPieces.forEach((r,n)=>expect(r.lengthsM.reduce((s,l)=>s+l,0)).toBeCloseTo(runs[n].runM,9));
});
test('fascia uses two five-metre lengths and a straight joint without changing timber packing',()=>{
 expect(planJoinedLinearStock(runs,5).qty).toBe(2);expect(planJoinedLinearStock(runs,5).joints).toBe(1);
 expect(planPlasticsStock(runs,4).qty).toBe(4);
});
test('different widths never share a stock lane',()=>{
 const p=planJoinedLinearStock([{edgeId:'a',runM:3,widthMM:100},{edgeId:'b',runM:3,widthMM:150}],5);
 expect(p.qty).toBe(2);expect(p.joints).toBe(0);
});
test('long runs and empty input retain complete coverage and valid orders',()=>{
 const p=planJoinedLinearStock([{edgeId:'long',runM:10,widthMM:0}],4);expect(p.qty).toBe(3);expect(p.joints).toBe(2);
 expect(planJoinedLinearStock([],4).qty).toBe(0);expect(planJoinedLinearStock(runs,0).valid).toBe(false);
});
