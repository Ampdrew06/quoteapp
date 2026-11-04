// Summary exclusions remove cost and loose despatch supplies, but never alter
// installed geometry, roof weight or the manufacturing cutting schedule.
export const excludedFromSupply=row=>Boolean(row?.excluded||row?.extraExcluded);
export function checklistExcludedKeys(model={}){
 const sections=Array.isArray(model.sections)?model.sections:Object.values(model.sections||{});
 const keys=new Set(Object.entries(model.supplyExclusions||{}).filter(([,value])=>value).map(([key])=>key));
 for(const section of sections)for(const row of section.lines||section.rows||[])if(excludedFromSupply(row))keys.add(row.key??row._k);
 return keys;
}
export function filterChecklistSupplies(checklist,model){
 const excluded=checklistExcludedKeys(model);
 return {...checklist,sections:Object.fromEntries(Object.entries(checklist.sections||{}).map(([key,rows])=>[key,rows.filter(row=>!excludedFromSupply(row)&&!excluded.has(row.key)&&!(row.sourceKeys||[]).some(source=>excluded.has(source)))]))};
}
