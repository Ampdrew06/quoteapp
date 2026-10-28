export const roofLabourBaselines={
 'lean-to':{days:1,areaM2:9},'hipped-lean-to':{days:1.5,areaM2:8.36},'victorian-hipped':{days:1.8,areaM2:8.36},gable:{days:1.8,areaM2:12},edwardian:{days:2,areaM2:9},victorian:{days:2,areaM2:9},'victorian-five':{days:2,areaM2:9},combination:{days:2.1,areaM2:9},'double-edwardian':{days:2.2,areaM2:9},'edwardian-p':{days:2.5,areaM2:12.25},'victorian-p':{days:2.5,areaM2:12.25}
};
export function roofLabourFamily(style){return ({leanTo:'lean-to',hippedLeanTo:'hipped-lean-to'})[style]||style||'lean-to';}
export const roofLabourLabels={'lean-to':'Lean-To','hipped-lean-to':'Hipped Lean-To (offset / central)','victorian-hipped':'Victorian Hipped Lean-To',gable:'Gable',edwardian:'Edwardian',victorian:'3 Facet Victorian','victorian-five':'5 Facet Victorian',combination:'Edwardian / Victorian','double-edwardian':'Double Hipped Edwardian','edwardian-p':'Edwardian P-Shape','victorian-p':'Victorian P-Shape'};
export function resolveRoofLabourBaseline(style,config={}){
 const family=roofLabourFamily(style),base=roofLabourBaselines[family];
 if(!base)throw new Error('No agreed labour baseline for '+family);
 const saved=config.styleBaselines?.[family]||{},number=(key,fallback,zero=false)=>{const n=Number(saved[key]);return saved[key]!==''&&saved[key]!=null&&Number.isFinite(n)&&(zero?n>=0:n>0)?n:fallback;};
 return {days:number('days',base.days),areaM2:number('areaM2',base.areaM2),incrementDaysPerM2:number('incrementDaysPerM2',.03,true)};
}
export function computeRoofLabour({widthMM,projectionMM,roofStyle='lean-to',config={},overrideDays}={}){
 const family=roofLabourFamily(roofStyle),base=resolveRoofLabourBaseline(family,config);
 const areaM2=Number(widthMM||0)*Number(projectionMM||0)/1e6,incrementDaysPerM2=base.incrementDaysPerM2,dayRate=Number(config.dayRate??300);
 const rawDays=base.days+Math.max(0,areaM2-base.areaM2)*incrementDaysPerM2;
 const override=Number(overrideDays),days=Number.isFinite(override)&&override>0?override:rawDays;
 return {areaM2,referenceAreaM2:base.areaM2,minimumDays:base.days,incrementDaysPerM2,complexity:days,rawDays,days,labourDays:days,labourCost:days*dayRate,dayRate,roofStyle:family};
}
export const isSlateCovering=value=>['liteslate','tapcoslate','tapco'].includes(String(value||'').toLowerCase());
export const britmetBenchmarkInputs=inputs=>({...inputs,tileProductId:'britmetShingle',tileSystem:'britmet',tile_system:'britmet',tile_type:'britmet',tileType:'britmet',roofCovering:'britmet'});
