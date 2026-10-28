export function resolveGableSoffitInputs(inputs={}){
 if(inputs.sideSoffitMode==='none')return {...inputs,leftSoffitMM:0,rightSoffitMM:0,separateSideSoffits:false};
 if(inputs.sideSoffitMode==='specified')return {...inputs,leftSoffitMM:inputs.specifiedSideSoffitMM,rightSoffitMM:inputs.specifiedSideSoffitMM,separateSideSoffits:false};
 return inputs;
}
