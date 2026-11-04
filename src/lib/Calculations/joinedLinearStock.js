// Joinable plastics/gutters only. Structural timber/laths must never use this
// planner: their members cannot be spliced merely to reduce an order count.
// This is a length/connector allowance, not a released kerfed/mitred cut list.
export function planJoinedLinearStock(runs,stockM){
 const stock=Number(stockM),empty={valid:false,boards:[],runPieces:[],qty:0,joints:0};
 if(!(Number.isFinite(stock)&&stock>0)||runs.some(r=>!Number.isFinite(Number(r.runM))||Number(r.runM)<0))return {...empty,errors:['Valid stock and non-negative run lengths are required.']};
 const groups=new Map();
 runs.forEach(run=>{if(Number(run.runM)<=1e-9)return;const width=run.widthMM??0,key=String(width);if(!groups.has(key))groups.set(key,{width,pieces:[],lengthM:0});const group=groups.get(key);group.lengthM+=Number(run.runM);let startM=0;while(startM<Number(run.runM)-1e-9){const lengthM=Math.min(stock,Number(run.runM)-startM);group.pieces.push({edgeId:run.edgeId,widthMM:width,startM,lengthM});startM+=lengthM;}});
 const boards=[];
 for(const group of groups.values()){
  const bins=[];
  group.pieces.sort((a,b)=>b.lengthM-a.lengthM).forEach(piece=>{let bin=bins.find(b=>b.remainingM+1e-9>=piece.lengthM);if(!bin){bin={widthMM:group.width,remainingM:stock,pieces:[]};bins.push(bin);}bin.pieces.push({...piece});bin.remainingM=Math.max(0,bin.remainingM-piece.lengthM);});
  const minimum=Math.ceil(group.lengthM/stock-1e-9);
  while(bins.length>minimum){
   const removed=bins.pop();
   for(const piece of removed.pieces){
    const whole=bins.filter(b=>b.remainingM+1e-9>=piece.lengthM).sort((a,b)=>a.remainingM-b.remainingM)[0];
    if(whole){whole.pieces.push({...piece});whole.remainingM=Math.max(0,whole.remainingM-piece.lengthM);continue;}
    // Use the fewest available offcuts for this piece, then balance the split
    // rather than making an unnecessarily tiny fragment at the connector.
    const available=bins.filter(b=>b.remainingM>1e-9).sort((a,b)=>b.remainingM-a.remainingM),selected=[];let capacity=0;
    for(const bin of available){selected.push(bin);capacity+=bin.remainingM;if(capacity+1e-9>=piece.lengthM)break;}
    if(capacity+1e-8<piece.lengthM)return {...empty,errors:['Shared offcut lengths could not cover a run.']};
    selected.sort((a,b)=>a.remainingM-b.remainingM);let remaining=piece.lengthM,used=0;
    selected.forEach((bin,n)=>{const lengthM=Math.min(bin.remainingM,remaining/(selected.length-n));if(lengthM>1e-9){bin.pieces.push({...piece,startM:piece.startM+used,lengthM});bin.remainingM=Math.max(0,bin.remainingM-lengthM);remaining-=lengthM;used+=lengthM;}});
   }
  }
  boards.push(...bins);
 }
 const runPieces=runs.map(run=>{const pieces=boards.flatMap((board,n)=>board.pieces.filter(p=>p.edgeId===run.edgeId).map(p=>({...p,boardIndex:n}))).sort((a,b)=>a.startM-b.startM);return {edgeId:run.edgeId,lengthsM:pieces.map(p=>p.lengthM),pieces};});
 const joints=runPieces.reduce((n,r)=>n+Math.max(0,r.lengthsM.length-1),0);
 return {valid:true,errors:[],boards,runPieces,qty:boards.length,joints,method:'sharedJoinableStock',notes:['Compatible widths share stock. Straight-run splits add connectors; corners do not. Length allowance only: saw kerf, joint fitting deductions and final numbered cuts require the later cut-list detail.']};
}
