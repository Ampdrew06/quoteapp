// The Materials PIR100 sheet price is authoritative. Old pack aliases are
// compatibility fallbacks, not a second price list for the same board.
const number=v=>v==null||v===''?null:Number(v);
export function resolvePir100SheetRate(materials={}){
 const board=materials.pir100||{},width=Number(board.sheet_w_m??1.2),length=Number(board.sheet_h_m??2.4);
 const sheetAreaM2=width*length;
 const raw=[board.price_per_sheet,materials.pir100_price_per_sheet,materials.pir100_sheet_price].find(v=>v!=null&&v!=='');
 const pack=number(materials.slab100_pack_price_each??materials.pir100_price_per_pack),coverage=Number(materials.slab100_pack_coverage_m2??materials.pir100_pack_coverage_m2??sheetAreaM2);
 const sheetPrice=raw!==undefined?number(raw):pack!==null&&coverage>0?pack*sheetAreaM2/coverage:null;
 return {valid:Number.isFinite(sheetAreaM2)&&width>0&&length>0&&sheetPrice!==null&&Number.isFinite(sheetPrice)&&sheetPrice>=0,sheetAreaM2,sheetPrice};
}
export function pricePir100SheetAllowance({areaM2,extraAreaM2=0,rate}){
 const suppliedAreaM2=Math.max(0,Number(areaM2)+Number(extraAreaM2));
 if(!rate?.valid||!Number.isFinite(suppliedAreaM2))return {valid:false};
 const sheets=Math.max(0,Math.ceil(suppliedAreaM2/rate.sheetAreaM2-1e-9));
 return {valid:true,suppliedAreaM2,sheets,cost:Number((sheets*rate.sheetPrice).toFixed(2))};
}
