// Positions are centres measured from the left INTERNAL ringbeam corner.
export function resolveEdwardianFrontRafters({positions,widthMM,ridgeEndYMM,projectionMM,allowWideGaps=false}) {
 const errors=[],warnings=[];
 if(!Array.isArray(positions)||positions.some(p=>p===''||p==null||!Number.isFinite(Number(p))))
  return {valid:false,errors:['Enter a numeric centre position for every front rafter.'],warnings,rafters:[]};
 if(positions.length>100)return {valid:false,errors:['Use at most 100 front rafters.'],warnings,rafters:[]};
 const centres=positions.map(Number).sort((a,b)=>a-b),half=widthMM/2;
 for(let i=0;i<centres.length;i++){
  if(centres[i]<=72||centres[i]>=widthMM-72)errors.push('Front rafter slots must clear the 48mm hip seats: centres must be more than 72mm from either corner.');
  if(i&&centres[i]-centres[i-1]<=48)errors.push('Front rafter slots overlap or touch. Leave more than 48mm between centres.');
 }
 const edges=[0,...centres,widthMM],gaps=edges.slice(1).map((v,i)=>v-edges[i]);
 if(gaps.some(g=>g>750)){
  warnings.push('A front centre spacing exceeds the provisional 750mm guidance. Review support before manufacture.');
  if(!allowWideGaps)errors.push('A spacing exceeds 750mm. Add support or acknowledge the admin spacing override.');
 }
 const rafters=centres.map((centreMM,i)=>({id:Math.abs(centreMM-half)<0.001?'front-boss-rafter':`manual-front-${i+1}`,
  role:Math.abs(centreMM-half)<0.001?'boss-rafter':'jack',centreMM,
  hipMeetingYMM:projectionMM-(projectionMM-ridgeEndYMM)*Math.min(centreMM,widthMM-centreMM)/half}));
 return {valid:!errors.length,errors:[...new Set(errors)],warnings,rafters,gapsMM:gaps};
}
