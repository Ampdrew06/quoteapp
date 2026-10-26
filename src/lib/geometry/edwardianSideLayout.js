const numeric=values=>Array.isArray(values)&&values.every(v=>v!==''&&v!=null&&Number.isFinite(Number(v)));
export function resolveEdwardianRearTrusses(positions,terminalMM){
 const start=31.5,errors=[];
 if(!numeric(positions)||positions.length>100)return {valid:false,errors:['Enter numeric intermediate truss centres.']};
 const centresMM=[start,...positions.map(Number).sort((a,b)=>a-b),terminalMM];
 const gapsMM=centresMM.slice(1).map((p,i)=>p-centresMM[i]);
 if(gapsMM.some(g=>g<=48))errors.push('Truss slots overlap, touch, or cross the locked wall/boss truss.');
 return {valid:!errors.length,errors,centresMM,gapsMM,trussCount:centresMM.length,rearCentreMM:start,frontCentreMM:terminalMM,manual:true};
}
export function resolveEdwardianSideJacks(positions,{side,terminalMM,projectionMM,widthMM,ridgeEndYMM}){
 if(!numeric(positions)||positions.length>100)return {valid:false,errors:['Enter numeric side jack centres.']};
 const points=positions.map(Number).sort((a,b)=>a-b);
 if(points.some((p,i)=>p<=terminalMM+48||p>=projectionMM-72||(i&&p-points[i-1]<=48)))return {valid:false,errors:['Side jack slots must clear the boss truss and hip seat, and must not overlap.']};
 const centres=[terminalMM,...points,projectionMM];
 return {valid:true,errors:[],gapsMM:centres.slice(1).map((p,i)=>p-centres[i]),jacks:points.map((positionMM,i)=>({id:`side-${side}-manual-${i+1}`,side,positionMM,hipMeetingXMM:widthMM/2*(projectionMM-positionMM)/(projectionMM-ridgeEndYMM)}))};
}
export function edwardianSideEditorPatch({rows,side,inputs,geometry}){
 const failed=message=>({valid:false,errors:[message]});
 if(rows.some(r=>r.centreMM===''||!Number.isFinite(Number(r.centreMM))))return failed('Enter a centre or gap for each member.');
 const boss=rows.find(r=>r.role==='boss-truss'),wall=rows.find(r=>r.role==='wall-truss');
 if(!boss||!wall||Number(wall.centreMM)!==31.5)return failed('The wall truss is locked at 31.5mm.');
 const bossMM=Number(boss.centreMM),ridgeMM=bossMM+33,run=geometry.projectionMM-ridgeMM;
 if(bossMM<=79.5||run<=0)return failed('Boss truss must clear the wall truss and remain behind the front frame.');
 const frontPitchDeg=Math.atan2(geometry.riseMM,run)*180/Math.PI;
 const rearTrussPositionsMM=rows.filter(r=>r.role==='truss').map(r=>Number(r.centreMM));
 const sidePositions=rows.filter(r=>r.role==='jack').map(r=>Number(r.centreMM));
 const rear=resolveEdwardianRearTrusses(rearTrussPositionsMM,bossMM),jacks=resolveEdwardianSideJacks(sidePositions,{side,terminalMM:bossMM,projectionMM:geometry.projectionMM,widthMM:geometry.widthMM,ridgeEndYMM:ridgeMM});
 if(!rear.valid||!jacks.valid)return {valid:false,errors:[...(rear.errors||[]),...(jacks.errors||[])]};
 const moved=Math.abs(bossMM-geometry.terminalTrussCentreMM)>1e-7;
 return {valid:true,errors:[],patch:{rearTrussPositionsMM,sideJackPositionsMM:{...inputs.sideJackPositionsMM,[side]:sidePositions},...(moved?{ridgeMode:'frontPitch',frontPitchDeg}:{})}};
}
