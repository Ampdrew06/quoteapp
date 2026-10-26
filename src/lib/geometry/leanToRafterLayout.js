// Interior centres from the left internal corner; edge rafters stay at 0/width.
export function resolveLeanToRafterLayout({widthMM,positions=null,firstCentreMM=690,spacingMM=665,boundaryStartMM=0,boundaryEndMM=widthMM}={}){
 const width=Number(widthMM),manual=positions!=null,errors=[];
 let interior=[];
 if(!(width>0))errors.push('Enter a positive roof width.');
 if(manual){
  if(!Array.isArray(positions)||positions.length>100||positions.some(v=>v===''||v==null||!Number.isFinite(Number(v))))errors.push('Enter numeric rafter centres (maximum 100 internal rafters).');
  else interior=positions.map(Number).sort((a,b)=>a-b);
  if(interior.some((p,i)=>p<=Number(boundaryStartMM)+48||p>=Number(boundaryEndMM)-48||(i&&p-interior[i-1]<=48)))errors.push('Rafter slots must clear the fixed edge rafters and must not overlap: leave more than 48mm between centres.');
 }else if(Number(spacingMM)>0&&Number(firstCentreMM)>0&&width>0){
  for(let p=Number(firstCentreMM);p<width;p+=Number(spacingMM))interior.push(p);
 }
 const centresMM=[Number(boundaryStartMM),...interior,Number(boundaryEndMM)],gapsMM=centresMM.slice(1).map((p,i)=>p-centresMM[i]);
 return {valid:!errors.length,errors,manual,interiorMM:interior,centresMM,gapsMM,count:centresMM.length};
}
