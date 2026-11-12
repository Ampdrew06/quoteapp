export const gableStabilityBarKey='gable_lateral_stability_bar';

export function gableStabilityBarIncluded(inputs,widthMM,exclusions=inputs.summaryPricingState?.exclusions||{}){
 const excluded=exclusions[gableStabilityBarKey];
 return typeof excluded==='boolean'?!excluded:widthMM>3800||inputs.gableAboveDoorway===true;
}

export function gableAFrameDimensions({widthMM,pitchDeg,flatMM=595,withBar=false}={}){
 const width=Number(widthMM), pitch=Number(pitchDeg), flat=Number(flatMM);
 if(!Number.isFinite(width)||width<=0||!Number.isFinite(pitch)||pitch<=0||pitch>=90)
  return {error:'Enter a valid Gable width and pitch in Design/Options.'};
 if(String(flatMM??'').trim()===''||!Number.isFinite(flat)||flat<=0||flat>=width)
  return {error:'Enter a top flat greater than zero and smaller than the internal width.'};
 const run=(width-flat)/2, height=run*Math.tan(pitch*Math.PI/180)-(withBar?6:0);
 if(!Number.isFinite(height)||height<=0)return {error:'These inputs leave no positive A-frame height.'};
 return {width,flat,run,height,slope:Math.hypot(run,height),pitch:Math.atan2(height,run)*180/Math.PI};
}
