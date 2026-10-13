import {buildEdwardianInternalLathAudit} from '../Calculations/edwardianInternalLathAudit';
import {buildEdwardianIdiotList} from '../Calculations/edwardianIdiotList';
import {buildRingBeamManufactureCuts} from './ringBeamManufactureSchedule';
// Translate accepted audits to workshop references; never recalculate cutting lengths here.
export function buildEdwardianManufactureSchedule(model,materials={}){
 if(!model?.valid)return {valid:false,errors:model?.errors||['Valid Edwardian design required.']};
 const a=model.audits,g=a.geometry,t=a.timber;
 const trusses=g.layout.centresMM.map((centreMM,n)=>({id:`T${n+1}`,centreMM,role:n===0?'Rear wall':n===g.layout.trussCount-1?'Terminal':'Intermediate'}));
 let nextJack=1;
 const members=t.memberAudit.members.map(m=>({...m,ref:m.type==='truss-member'?m.label:m.type==='hip'?m.id==='hip-left'?'H1':'H2':m.type==='boss-rafter'?'R1':`J${nextJack++}`}));
 const ringBeams=t.ringBeamAudit.ringBeams.map(b=>({...b,cuts:buildRingBeamManufactureCuts(b),bays:b.upstandRuns.map((r,n)=>({...r,id:`${b.manufactureRef}-B${n+1}`}))}));
 return {valid:true,errors:[],geometry:g,trusses,members,ringBeams,truss:t.truss,counts:t.componentCounts,insulation:a.insulation,laths:a.laths,internalLaths:buildEdwardianInternalLathAudit({geometry:g,materials}),tiling:a.tiling,plastics:a.plastics,metal:a.metalMisc,checklist:buildEdwardianIdiotList(model,materials)};
}
