import {planPlasticsStock} from '../Calculations/plasticsIntegrationAudit';
import {buildSummaryIdiotList} from '../Calculations/summaryIdiotList';
export function buildGableManufactureSchedule(model,materials={}) {
 if(!model?.valid)return {valid:false,errors:model?.errors||['Valid Gable design required.']};
 const {geometry:g,timber:t,insulation:i}=model.audits;
 const members=g.feet.map(f=>({...f,points:[{xMM:0,yMM:g.truss.ringBeamHeightMM},{xMM:g.widthMM/2,yMM:g.truss.apexBottom.yMM},{xMM:g.widthMM/2,yMM:g.truss.apexTop.yMM},{xMM:-f.hfcMM,yMM:g.truss.ringBeamHeightMM+f.vfcMM},{xMM:-f.hfcMM,yMM:g.truss.ringBeamHeightMM}]}));
 const trusses=g.layout.centresMM.map((centreMM,index)=>({id:`T${index+1}`,centreMM,role:index===0?'House wall':index===g.layout.trussCount-1?'Front':'Intermediate'}));
 const bays=g.layout.gapsMM.map((gap,index)=>({id:`B${index+1}`,pairedId:`B${g.layout.gapsMM.length*2-index}`,startMM:g.layout.centresMM[index]+24,endMM:g.layout.centresMM[index+1]-24,upstandWidthMM:gap-48,slabWidthMM:gap-45}));
 const checklist=buildSummaryIdiotList(model,materials);
 checklist.sections.assemblies=[{key:'trusses',item:'Assembled trusses (T1–T'+trusses.length+')',qty:trusses.length,units:'Ea'},{key:'ringbeams',item:'Assembled side ring-beams (RB1 / RB2)',qty:2,units:'Ea'}];
 // Loading list: exclude laths and PIR already fitted to finished assemblies.
 const allRuns=[];
 const projectionM=g.manufacturingProjectionMM/1000;
 model.audits.tiling.result.facets.forEach(f=>f.lathRows.forEach((row,n)=>allRuns.push({edgeId:f.facet.id+'-'+n,runM:row.widthMM/1000,widthMM:50})));
 if(model.audits.tiling.ridgeLathM>0)for(const side of ['left','right'])allRuns.push({edgeId:'ridge-'+side,runM:projectionM,widthMM:50});
 model.audits.laths.internal.rows.forEach(row=>allRuns.push({edgeId:'internal-'+row.id,runM:row.lengthMM/1000,widthMM:50}));
 const looseLaths=planPlasticsStock(allRuns,model.audits.laths.stockM).qty;
 const lathDelta=Number(model.quantityAdjustments?.gable_laths||0);
 checklist.sections.laths=[{key:'gable_laths',item:'Loose 25×50 laths',qty:Math.max(0,looseLaths+lathDelta),units:'Lengths'}].filter(r=>r.qty>0);
 checklist.sections.timber=(checklist.sections.timber||[]).filter(r=>r.isAddedItem||r.key!=='gable_laths');
 checklist.sections.misc=(checklist.sections.misc||[]).filter(r=>r.key!=='gable_pir50'||r.isAddedItem);
 const extraPir=Number(model.quantityAdjustments?.gable_pir50||0);
 if(extraPir>0)checklist.sections.misc.push({key:'gable_pir50',item:'Extra 50mm PIR — supplied loose',qty:extraPir,units:'Sheets'});
 checklist.sections.misc.push({key:'plasterboard_guide',item:'Plasterboard 2400 × 1200mm — NOT SUPPLIED (customer to purchase)',qty:Math.ceil(i.ceiling.areaM2/2.88),units:'Sheets',informational:true});
 checklist.despatchOnly=true;

 return {valid:true,errors:[],geometry:g,members,trusses,bays,ringBeamGroups:t.schedule.groups,componentCounts:t.componentCounts,frontFace:t.frontFace,insulation:i,checklist};
}
