import {auditRightToLeftTileStagger} from './steelTileStaggerAudit';
const courses=widths=>widths.map((requiredWidthMM,i)=>({index:i+1,requiredWidthMM,rightEdgeMM:3000}));
test('uses a finishing offcut for the next row and checks nominal joint positions',()=>{
 const a=auditRightToLeftTileStagger({courses:courses([1800,1800,1800])});
 expect(a.complete).toBe(true);expect(a.sequence).toEqual([1,2,3]);
 expect(a.rows.map(r=>r.starterSourceRow)).toEqual([null,1,2]);
 for(let i=1;i<a.rows.length;i++)a.rows[i].jointsMM.forEach(x=>expect(a.rows[i-1].jointsMM.includes(x)).toBe(false));
});
test('starts the row above when no offcut remains and uses its remainder for the skipped row',()=>{
 const a=auditRightToLeftTileStagger({courses:courses([1245,800,700])});
 expect(a.complete).toBe(true);expect(a.sequence).toEqual([1,3,2]);
 expect(a.rows[1].starterSourceRow).toBe(3);
 expect(a.rows[2].source).toBe('start row above');
 expect(a.alternateStarts).toBe(1);
 expect(a.newTiles).toBe(3);
});
test('does not invent a half-tile starter when the row above also leaves no offcut',()=>{
 const a=auditRightToLeftTileStagger({courses:courses([2490,2490,2490])});
 expect(a.complete).toBe(false);expect(a.newTiles).toBeNull();
 expect(a.errors).toHaveLength(1);
});
test('reports an unresolved last-row starter instead of placing aligned whole tiles',()=>{
 const a=auditRightToLeftTileStagger({courses:courses([1245,1800])});
 expect(a.complete).toBe(false);expect(a.newTiles).toBeNull();
});
test('checks joints against the shared facet datum rather than just comparing starter lengths',()=>{
 const a=auditRightToLeftTileStagger({courses:[
  {index:1,requiredWidthMM:1800,rightEdgeMM:3000},
  // Moving the right edge by -555 makes its offcut-start joint line up
  // with row1 even though the starter lengths differ (1245 vs690).
  {index:2,requiredWidthMM:1800,rightEdgeMM:2445}
 ]});
 expect(a.complete).toBe(false);expect(a.newTiles).toBeNull();
});
test('rejects missing geometry and non-finite dimensions',()=>{
 expect(auditRightToLeftTileStagger().complete).toBe(false);
 expect(auditRightToLeftTileStagger({courses:courses([NaN])}).complete).toBe(false);
 expect(auditRightToLeftTileStagger({courses:courses([1800]),coverWidthMM:Infinity}).complete).toBe(false);
});
test('holds a conflicting offcut aside when the row-above alternative supplies a different starter',()=>{
 const a=auditRightToLeftTileStagger({courses:[
  {index:1,requiredWidthMM:1800,rightEdgeMM:3000},
  {index:2,requiredWidthMM:1800,rightEdgeMM:2445},
  {index:3,requiredWidthMM:700,rightEdgeMM:2445}
 ]});
 expect(a.complete).toBe(true);expect(a.sequence).toEqual([1,3,2]);
 expect(a.heldRemainders).toHaveLength(1);
 expect(a.heldRemainders[0].lengthMM).toBe(690);
 expect(a.newTiles*1245).toBeCloseTo(4300+a.finalRemainderMM+690,8);
});
test('a configured minimum rejects a tiny remainder and tries the row above',()=>{
 const a=auditRightToLeftTileStagger({minimumStarterMM:50,courses:courses([1235,800,700])});
 expect(a.complete).toBe(true);expect(a.sequence).toEqual([1,3,2]);
 expect(a.heldRemainders[0].lengthMM).toBe(10);
 expect(a.rows[1].starterSourceRow).toBe(3);
});

test('cuts a fresh final-row starter, counts its whole tile and does not credit the trim',()=>{
 const a=auditRightToLeftTileStagger({courses:courses([1235,1800]),minimumStarterMM:200,allowFinalFreshStarter:true});
 expect(a.complete).toBe(true);expect(a.newTiles).toBe(4);
 expect(a.rows[1].source).toBe('starter cut from new tile');
 expect(a.rows[1].starterLengthMM).toBe(200);
 expect(a.heldRemainders[0].reason).toBe('Below minimum reusable coverage');
 expect(a.newTiles*1245).toBeCloseTo(3035+a.finalRemainderMM+a.heldRemainders.reduce((n,r)=>n+r.lengthMM,0),8);
});
test('a small final section can be cut from a new whole tile even below the reuse minimum',()=>{
 const a=auditRightToLeftTileStagger({courses:courses([1235,50]),minimumStarterMM:200,allowFinalFreshStarter:true});
 expect(a.complete).toBe(true);expect(a.newTiles).toBe(2);
 expect(a.rows[1].starterLengthMM).toBe(50);
});
test('fresh final starter avoids an aligned minimum-length candidate',()=>{
 const a=auditRightToLeftTileStagger({courses:[{index:1,requiredWidthMM:2490,rightEdgeMM:3000},{index:2,requiredWidthMM:1800,rightEdgeMM:1955}],minimumStarterMM:200,allowFinalFreshStarter:true});
 expect(a.complete).toBe(true);expect(a.rows[1].starterLengthMM).toBe(201);
});
test('opens a new starter tile on a middle row when the row-above remainder is unusable',()=>{
 const a=auditRightToLeftTileStagger({courses:courses([1235,1800,2490]),minimumStarterMM:200,allowFreshStarter:true});
 expect(a.complete).toBe(true);expect(a.sequence).toEqual([1,2,3]);
 expect(a.rows[1].source).toBe('starter cut from new tile');
 expect(a.rows[1].starterLengthMM).toBe(200);
 expect(a.newTiles*1245).toBeCloseTo(5525+a.finalRemainderMM+a.heldRemainders.reduce((n,r)=>n+r.lengthMM,0),8);
});
test('continues preferring a usable row-above offcut before sacrificing a new starter tile',()=>{
 const a=auditRightToLeftTileStagger({courses:courses([1235,800,700]),minimumStarterMM:200,allowFreshStarter:true});
 expect(a.complete).toBe(true);expect(a.sequence).toEqual([1,3,2]);
 expect(a.rows[1].source).toBe('offcut from row above');
});
