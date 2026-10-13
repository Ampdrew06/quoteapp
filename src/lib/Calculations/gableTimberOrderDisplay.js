// Display adapter only: preserve authoritative pricing quantities and costs.
const stock=(value,fallback)=>Number.isFinite(Number(value))&&Number(value)>0?Number(value):fallback;
const count=(quantity,coverage)=>Math.max(0,Math.ceil(Number(quantity)/coverage-1e-9));
export function buildGableTimberOrderDisplay(model,materials={},family='gable'){
 const prefix=family+'_';
 const rows=model?.sections?.timber?.lines||[],display={};
 const ply9=rows.filter(r=>[(prefix+'gussets'),(prefix+'frontFace'),(prefix+'bases'),(prefix+'upstands')].includes(r.key));
 const area9=stock(materials.ply9mm?.sheet_len_m,2.4)*stock(materials.ply9mm?.sheet_width_m,1.2);
 const total9=ply9.reduce((sum,row)=>sum+Number(row.qty||0),0),sheets9=count(total9,area9);
 for(const row of rows){
 if(row.isAddedItem)continue;
 if(row.key===(prefix+'joists'))display[row.key]={qty:row.qty,orderQty:count(row.qty,stock(materials.steico?.stock_len_m,12)),units:'m',orderBasis:'Whole joist stock lengths; metre allowance, not a cutting optimisation.'};
 else if(row.key===(prefix+'pse'))display[row.key]={qty:row.qty,orderQty:count(row.qty,stock(materials.pse30x90?.stock_len_m,4.8)),units:'m',orderBasis:'Whole PSE stock lengths.'};
 else if(ply9.includes(row))display[row.key]={qty:row.qty,orderQty:row===ply9[0]?sheets9:'Shared',units:'m²',orderBasis:`${sheets9} sheets of 9mm ply shared across gussets, front face, ring-beam bases and upstands; total ${total9.toFixed(3)}m². Area allowance, not a nested cutting schedule.`};
 else if(row.key===(prefix+'chevrons'))display[row.key]={qty:row.qty,orderQty:count(row.qty,stock(materials.ply18mm?.sheet_len_m,2.4)*stock(materials.ply18mm?.sheet_width_m,1.2)),units:'m²',orderBasis:'Whole 18mm ply sheets; area allowance, not a nested cutting schedule.'};
 else if(row.key===(prefix+'closures'))display[row.key]={qty:row.qty,orderQty:'Offcuts',units:'m',orderBasis:'Made from rafter foot-cut offcuts; no separate timber stock order.'};
 else if(row.key===(prefix+'laths'))display[row.key]={qty:row.used_m,orderQty:row.qty,units:'m',orderBasis:`Whole ${row.stock_length_m||4.8}m lengths from the existing shared lath stock planner.`};
 }
 return display;
}
