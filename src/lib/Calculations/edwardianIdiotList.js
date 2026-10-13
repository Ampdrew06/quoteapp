import {buildSummaryIdiotList} from './summaryIdiotList';
export function buildEdwardianIdiotList(model,materials={}){
 const list=buildSummaryIdiotList(model,materials);if(!model.valid)return list;
 const members=model.audits.timber.memberAudit.members;
 list.sections.assemblies=[{key:'trusses',item:'Assembled trusses',qty:model.audits.geometry.layout.centresMM.length,units:'Ea'},{key:'ringbeams',item:'Ring-beams',qty:3,units:'Ea'},...['hip','boss-rafter','jack-rafter'].map(type=>({key:type,item:({'hip':'Hips','boss-rafter':'Boss rafter','jack-rafter':'Jack rafters'})[type],qty:members.filter(m=>type==='jack-rafter'?m.type.endsWith('-jack'):m.type===type).length,units:'Ea'}))].filter(r=>r.qty>0);
 return list;
}
