// Required area for display; supplied sheet/roll counts and pricing stay intact.
export function summaryInsulationAreaDisplay(row={}){
 if(row.isAddedItem)return {};
 const text=(String(row.key||'')+' '+String(row.label||'')).toLowerCase();
 if(!/pir50|pir100|slab100|50mm pir|100mm pir|superquilt|gable_sq_|breather|gable_membrane/.test(text))return {};
 const raw=row.used_m2??(row.units==='m²'?row.qty:null),area=Number(raw);
 if(raw==null||!Number.isFinite(area)||area<0)return {};
 return {qty:area,units:'m²',qtyBasis:'Required material area; Order Qty remains supplied sheets or rolls.',orderBasis:'Supplied sheets or rolls; quantity adjustments change supply, not the required area.',adjustmentUnit:row.units};
}
