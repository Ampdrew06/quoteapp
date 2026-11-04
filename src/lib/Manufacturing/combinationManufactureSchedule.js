import {buildCombinationSummaryMaterialsModel} from '../Calculations/combinationQuotation';
import {buildEdwardianManufactureSchedule} from './edwardianManufactureSchedule';
import {buildVictorianTrussSchedule} from './victorianTrussSchedule';
import {buildVictorianMemberSchedule} from './victorianMemberSchedule';
import {buildVictorianRingBeamProfiles} from './victorianRingBeamProfiles';
import {buildVictorianIdiotList} from '../Calculations/victorianIdiotList';
import {victorianBookBeams} from './victorianBookBeams';
export function buildCombinationManufactureSchedule({inputs={},materials={}}={}){
 const model=buildCombinationSummaryMaterialsModel({inputs,materials});
 if(!model.valid)return {valid:false,errors:model.errors};
 if(model.comparisonStyle==='edwardian'){
  const schedule=buildEdwardianManufactureSchedule(model,materials);
  return {...schedule,model,family:'edwardian'};
 }
 const g=model.audits.geometry;
 if(g.variablePitchPricingValidated)return {valid:false,errors:['Survey-adjusted quotation is available. Variable-pitch cutting details remain pending factory/eaves connection review; manufacture book release is on hold.']};
 const trusses=buildVictorianTrussSchedule({geometry:g,materials}),members=buildVictorianMemberSchedule({geometry:g,materials}),ring=buildVictorianRingBeamProfiles(g);
 const errors=[...new Set([...(trusses.errors||[]),...(members.errors||[]),...(ring.errors||[])])];
 if(!trusses.valid||!members.valid||!ring.valid)return {valid:false,errors};
 const ringBeams=victorianBookBeams(ring.beams.map(b=>({...b,upstandArrangement:g.upstandArrangement}))).map(b=>({...b,cuts:{...b.cuts,upstandHeightMM:g.upstandHeightMM}}));
 return {valid:true,errors:[],family:model.comparisonStyle,model,geometry:g,truss:trusses.truss,counts:trusses.counts,members:members.members,ringBeams,checklist:buildVictorianIdiotList(model,materials),plastics:model.audits.plastics,tiling:model.audits.tiles};
}
