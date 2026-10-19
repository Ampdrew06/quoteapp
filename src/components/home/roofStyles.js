import {clearActiveDesignRecord} from '../../lib/activeDesignRecord';
export const roofStyles = [
 {id:'lean-to',name:'Lean-To',hint:'One sloping roof',ready:true},
 {id:'hipped-lean-to',name:'Hipped Lean-To',hint:'Sloping front and sides',ready:true},
 {id:'victorian-hipped',name:'Victorian Hipped Lean-To',hint:'A faceted lean-to front',ready:false},
 {id:'gable',name:'Gable',hint:'Two slopes, straight ends',ready:true},
 {id:'edwardian',name:'Edwardian',hint:'Square-cornered front',ready:true},
 {id:'double-edwardian',name:'Double Hipped Edwardian',hint:'Hipped ends around a central ridge',ready:false},
 {id:'victorian',name:'3 Facet Victorian',hint:'Angled front corners',ready:true},
 {id:'victorian-five',name:'5 Facet Victorian',hint:'Five facets around the front',ready:false},
 {id:'combination',name:'Edwardian / Victorian',hint:'Square on one side, faceted on the other',ready:false},
 {id:'edwardian-p',name:'Edwardian P-Shape',hint:'Square front with a lean-to extension',ready:false,wide:true},
 {id:'victorian-p',name:'Victorian P-Shape',hint:'Faceted front with a lean-to extension',ready:false,wide:true},
];
export function startRoofDesign(id,navigate,storage=localStorage){
 const roof=roofStyles.find(r=>r.id===id);if(!roof?.ready)return false;
 clearActiveDesignRecord(storage);
 // Every new design is detached from any saved quote/job.
 for(const key of ['activeDesignRecord','activeDesignDraft','active_job_id','active_gable_job_id','summary_adjustments','summary_exclusions','summary_added_items','auto_show_quote'])storage.removeItem(key);
 if(id==='lean-to'||id==='hipped-lean-to'){
  storage.removeItem('leanToInputs');storage.removeItem('tl_tile_system');
  navigate('/quote/lean-to',{state:{fresh:true,roofStyle:id==='lean-to'?'leanTo':'hippedLeanTo',hippedSides:'both'}});
 }else{
  storage.removeItem(id==='gable'?'gableDesignPreviewInputs':id==='victorian'?'victorianPlanPreviewInputs':'edwardianInputs');
  navigate('/quote/'+id,{state:{fresh:true}});
 }
 return true;
}
