// Nominal cover-length and joint-position audit only. Angled cuts and ribs
// need a physical piece layout before this can become a manufacture cut list.
const EPS=1e-6;
export function auditRightToLeftTileStagger({courses=[],coverWidthMM=1245,minimumStarterMM=0,allowFinalFreshStarter=false,allowFreshStarter=false}={}) {
 const cover=Number(coverWidthMM),minimum=Number(minimumStarterMM);
 const invalid=message=>({complete:false,errors:[message],rows:[],sequence:[],newTiles:null,heldRemainders:[]});
 if(!Number.isFinite(minimum)||minimum<0||minimum>cover)return invalid('Minimum starter must be between zero and one tile cover.');
 if(!Number.isFinite(cover)||cover<=0||!courses.length)return invalid('Valid courses and tile cover are required.');
 if(courses.some(r=>!Number.isFinite(r.requiredWidthMM)||r.requiredWidthMM<=0||!Number.isFinite(r.rightEdgeMM)))return invalid('Finite positive widths and right-edge positions are required.');
 const laid=new Map(),sequence=[],heldRemainders=[],errors=[];
 let carry=0,sourceRow=null;
 const cut=(position,incoming,source)=>{
  const course=courses[position],width=course.requiredWidthMM;
  const fresh=Math.ceil(Math.max(0,width-incoming-EPS)/cover);
  const starter=incoming>EPS?Math.min(incoming,width):Math.min(cover,width);
  const left=course.rightEdgeMM-width;
  const joints=[];
  // Joints are measured from a shared facet datum, not from the moving hip.
  for(let x=course.rightEdgeMM-starter;x>left+EPS;x-=cover)joints.push(x);
  return {...course,position,index:course.index ?? position+1,starterLengthMM:starter,
   starterSourceRow:source,carriedInMM:incoming,carriedOutMM:Math.max(0,incoming+fresh*cover-width),
   newTiles:fresh,jointsMM:joints,source:incoming>EPS?'previous offcut':'new tile'};
 };
 const conflicts=row=>[row.position-1,row.position+1].flatMap(position=>{
  const other=laid.get(position);
  return other?row.jointsMM.flatMap(x=>other.jointsMM.some(y=>Math.abs(x-y)<EPS)?[{otherRow:other.index,xMM:x}]:[]):[];
 });
 const commit=row=>{laid.set(row.position,row);sequence.push(row.index);};
 const freshStarter=(position,carry,sourceRow)=>{
   const row=cut(position,carry,sourceRow);
   // A new tile may be sacrificed when reuse cannot complete a row. Candidate lengths are
   // nominal cover lengths only; no physical rib or angled-cut claim is made.
   let replacement=null;
   const first=Math.min(row.requiredWidthMM,Math.max(minimum,200));
   for(let starter=first;starter<=cover+EPS;starter+=1) {
    const candidate=cut(position,starter,null);
    if(!conflicts(candidate).length) {replacement=candidate;break;}
   }
   if(replacement) {
    if(carry>EPS)heldRemainders.push({fromRow:sourceRow,lengthMM:carry,
     reason:carry+EPS<minimum?'Below minimum reusable coverage':'Would align adjacent joints'});
    replacement.newTiles+=1;
    replacement.source='starter cut from new tile';
    replacement.freshStarterTrimMM=Math.max(0,cover-replacement.carriedInMM);
    // Retain trim separately, without crediting it as an intact reusable rib.
    if(replacement.freshStarterTrimMM>EPS)heldRemainders.push({fromRow:replacement.index,
     lengthMM:replacement.freshStarterTrimMM,reason:'Trim from new starter tile; reuse not credited'});
    commit(replacement);return replacement;
   }
   return null;
 };
 for(let position=0;position<courses.length;position++) {
  if(laid.has(position))continue;
  let row=cut(position,carry,sourceRow);
  const issues=conflicts(row);
  const needsAlternate=position>0 && (carry<=EPS || carry+EPS<minimum || issues.length>0);
  if(!needsAlternate) {commit(row);carry=row.carriedOutMM;sourceRow=row.index;continue;}
  const above=position+1;
  const tryFresh=()=>{
   if(!allowFreshStarter && !(allowFinalFreshStarter && above>=courses.length))return false;
   const replacement=freshStarter(position,carry,sourceRow);
   if(!replacement)return false;
   carry=replacement.carriedOutMM;sourceRow=replacement.index;return true;
  };
  if(above>=courses.length || laid.has(above)) {
   if(tryFresh())continue;
   errors.push(`Row ${row.index}: no suitable starter and no available row above. Factory starter choice required.`);
   break;
  }
  const upper=cut(above,0,null);
  if(upper.carriedOutMM<=EPS || upper.carriedOutMM+EPS<minimum || conflicts(upper).length) {
   if(tryFresh())continue;
   errors.push(`Row ${row.index}: starting row ${upper.index} above does not produce a suitable staggered remainder. Factory starter choice required.`);
   break;
  }
  const lower=cut(position,upper.carriedOutMM,upper.index);
  const adjacentConflicts=lower.jointsMM.some(x=>upper.jointsMM.some(y=>Math.abs(x-y)<EPS));
  if(conflicts(lower).length || adjacentConflicts) {
   if(tryFresh())continue;
   errors.push(`Rows ${row.index}/${upper.index}: the nominal upper-row remainder still aligns joints. Factory starter choice required.`);
   break;
  }
  if(carry>EPS)heldRemainders.push({fromRow:sourceRow,lengthMM:carry,reason:carry+EPS<minimum?'Below minimum reusable coverage; not credited as reuse':'Would align adjacent joints; retained separately, not credited as reuse'});
  upper.source='start row above';lower.source='offcut from row above';
  commit(upper);commit(lower);carry=lower.carriedOutMM;sourceRow=lower.index;
 }
 const rows=[...laid.values()].sort((a,b)=>a.position-b.position);
 const complete=rows.length===courses.length && errors.length===0;
 return {complete,errors,rows,sequence,newTiles:complete?rows.reduce((sum,r)=>sum+r.newTiles,0):null,
  finalRemainderMM:complete?carry:null,heldRemainders,
  alternateStarts:rows.filter(r=>r.source==='start row above').length};
}
