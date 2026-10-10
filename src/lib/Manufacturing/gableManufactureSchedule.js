import {buildSummaryIdiotList} from '../Calculations/summaryIdiotList';
export function buildGableManufactureSchedule(model,materials={}) {
 if(!model?.valid)return {valid:false,errors:model?.errors||['Valid Gable design required.']};
 const {geometry:g,timber:t,insulation:i}=model.audits;
 const members=g.feet.map(f=>({...f,points:[{xMM:0,yMM:g.truss.ringBeamHeightMM},{xMM:g.widthMM/2,yMM:g.truss.apexBottom.yMM},{xMM:g.widthMM/2,yMM:g.truss.apexTop.yMM},{xMM:-f.hfcMM,yMM:g.truss.ringBeamHeightMM+f.vfcMM},{xMM:-f.hfcMM,yMM:g.truss.ringBeamHeightMM}]}));
 const trusses=g.layout.centresMM.map((centreMM,index)=>({id:`T${index+1}`,centreMM,role:index===0?'House wall':index===g.layout.trussCount-1?'Front':'Intermediate'}));
 const bays=g.layout.gapsMM.map((gap,index)=>({id:`B${index+1}`,pairedId:`B${g.layout.gapsMM.length*2-index}`,startMM:g.layout.centresMM[index]+24,endMM:g.layout.centresMM[index+1]-24,upstandWidthMM:gap-48,slabWidthMM:gap-45}));
 const checklist=buildSummaryIdiotList(model,materials);
 checklist.sections.assemblies=[{key:'trusses',item:'Assembled trusses (T1–T'+trusses.length+')',qty:trusses.length,units:'Ea'},{key:'ringbeams',item:'Assembled side ring-beams (RB1 / RB2)',qty:2,units:'Ea'}];
 checklist.sections.timber=(checklist.sections.timber||[]).map(row=>row.key==='gable_laths'?{...row,item:row.item+' — total stock check, includes fitted ring-beam laths'}:row);
 return {valid:true,errors:[],geometry:g,members,trusses,bays,ringBeamGroups:t.schedule.groups,componentCounts:t.componentCounts,frontFace:t.frontFace,insulation:i,checklist};
}
