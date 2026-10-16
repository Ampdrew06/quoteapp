import {buildSummaryIdiotList} from './summaryIdiotList';
import {planPlasticsStock} from './plasticsIntegrationAudit';
// Physical supply: price exclusions do not remove goods required for delivery.
export function buildVictorianIdiotList(model,materials={}){
 const list=buildSummaryIdiotList(model,materials);
 if(!model?.valid)return {...list,valid:false,errors:model?.errors||['Valid Victorian model required.']};
 const a=model.audits,c=a.timber.componentCounts,l=a.laths;
 list.sections.assemblies=[['trusses','Assembled trusses',c.trusses],['hips','Hips',c.hips],['intermediates','Intermediate rafters',c.intermediates],['ringbeams','Ring-beams',c.ringBeams]].filter(r=>r[2]>0).map(([key,item,qty])=>({key,item,qty,units:'Ea'}));
 const sourceRows=Object.values(model.sections).flatMap(s=>s.lines),row=key=>sourceRows.find(r=>r.key===key);
 const groups={field:[],chamfer:[],hipSupport:[],ridgeSupport:[],internal:[]};
 l.fieldRows.forEach(r=>groups[r.kind==='chamferedPerimeter'?'chamfer':'field'].push(r.widthMM/1000));
 l.support.rows.forEach(r=>{for(let n=0;n<r.lathQty;n++)groups[r.edgeKind==='ridge'||r.edgeId==='ridge'?'ridgeSupport':'hipSupport'].push(r.edgeLengthM);});
 l.internal.rows.forEach(r=>groups.internal.push(r.lengthMM/1000));
 const runs=[];
 for(const [key,lengths] of Object.entries(groups)){
  let remaining=Math.max(0,Number(row(`laths_${key}`)?.qty)||0);
  lengths.forEach((length,index)=>{const runM=Math.min(length,remaining);if(runM>1e-9)runs.push({edgeId:`${key}-${index}`,side:'loose-lath',widthMM:50,runM});remaining=Math.max(0,remaining-runM);});
  if(remaining>1e-8)runs.push({edgeId:`${key}-extra`,side:'loose-lath',widthMM:50,runM:remaining});
 }
 const stock=planPlasticsStock(runs,l.stockM);
 list.sections.laths=stock.qty?[{key:'victorian_loose_laths',item:'Loose 25×50 laths',qty:stock.qty,units:`×${l.stockM}m`}]:[];
 const timberExtras=(list.sections.timber||[]).filter(r=>r.isAddedItem);
 list.sections.timber=[];
 list.sections.misc=[...(list.sections.misc||[]),...timberExtras];
 // Fitted products are not loose checks, except positive additional supplies.
 const fitted=[...a.metal.metalRows.filter(r=>!r.supplyToSite).map(r=>({key:`metal_${r.key}`,base:r.qty,units:'Ea'})),{key:'insulation_pir50',base:a.insulation.pir50.sheets,units:'Sheets'}];
 fitted.forEach(f=>{const r=row(f.key),extra=Math.max(0,(r?.qty??0)-f.base);if(extra>0)list.sections[f.key==='insulation_pir50'?'misc':'metal'].push({key:f.key,item:r.label+' — extra, supplied loose',qty:extra,units:f.units});});
 // Keep actual roll sizes visible when the stock mix contains both sizes.
 list.sections.misc=list.sections.misc.filter(r=>r.key!=='insulation_superQuilt');
 const mix=a.insulation.superQuilt;let n12=mix.rolls12,n15=mix.rolls15,target=Math.ceil(Math.max(0,row('insulation_superQuilt')?.qty??0));
 if(target>n12+n15){if(n15)n15+=target-n12-n15;else n12+=target-n12-n15;}
 while(n12+n15>target){if(n15)n15--;else n12--;}
 for(const [size,qty] of [[12,n12],[15,n15]])if(qty)list.sections.misc.push({key:`victorian_sq_${size}`,item:`SuperQuilt — ${size}m²`,qty,units:qty===1?'Roll':'Rolls'});
 list.sections.misc.push({key:'plasterboard_guide',item:'Plasterboard 2400×1200mm — NOT SUPPLIED',qty:model.plasterboard.sheets,units:'Sheets',informational:true});
 for(const rows of Object.values(list.sections))for(const r of rows){
  if(r.key==='tiles_hipTape'||r.key==='fixings_alu_roll_tape'||/Aluminium tape/i.test(r.item))r.units=r.qty===1?'Roll':'Rolls';
  if(r.key==='plastics_polytop_pins')r.displayQty=String(r.qty);
  if(r.key==='gutters_g_len')r.units=`×${a.plastics.guttering.stockM}m`;
  if(r.key==='gutters_dp_len')r.units='Ea';
  if(r.key==='plastics_h_trim')r.units='mm';
 }
 return {...list,valid:true,errors:[],despatchOnly:true,weightProvisional:!model.weightComplete,looseLathStock:stock};
}
