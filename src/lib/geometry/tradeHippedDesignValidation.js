// Physical fit checks for both admin and trade. No arbitrary size or aspect-ratio limits.
export function validateTradeHippedDesign({roofStyle,widthMM,projMM,bossArrangement='offset',leftHip=true,rightHip=true,leftHipWidthMM,rightHipWidthMM,resolvedLeftHipWidthMM,resolvedRightHipWidthMM,requestedLeftSidePitchDeg,requestedRightSidePitchDeg}) {
 if(roofStyle!=='hippedLeanTo')return [];
 if(bossArrangement!=='central'&&!leftHip&&!rightHip)return ['Both hips are removed. Select Lean-To from Home for this roof; the no-hip configuration is not yet connected to the shared Lean-To calculations.'];
 const width=Number(widthMM),projection=Number(projMM);
 if(!Number.isFinite(width)||width<=0||!Number.isFinite(projection)||projection<=0)return ['Enter a positive width and projection before quoting.'];
 // Central-boss geometry resolves both runs to half the width elsewhere.
 if(bossArrangement==='central')return [];
 const runs=[];
 for(const [enabled,side,input,resolved,requestedPitch] of [
  [leftHip,'left',leftHipWidthMM,resolvedLeftHipWidthMM,requestedLeftSidePitchDeg],
  [rightHip,'right',rightHipWidthMM,resolvedRightHipWidthMM,requestedRightSidePitchDeg],
 ]){
  if(!enabled){runs.push(0);continue;}
  const pitchSet=requestedPitch!=null&&String(requestedPitch).trim()!=='';
  if(pitchSet&&!(Number(requestedPitch)>0&&Number(requestedPitch)<90))return [`Enter a ${side} side pitch greater than 0° and less than 90°.`];
  if(!pitchSet&&!(Number.isFinite(Number(input))&&Number(input)>0))return [`Enter a positive width for the ${side} hip.`];
  const run=Number(resolved??input);
  if(!Number.isFinite(run)||run<=0)return [`The ${side} hip has no usable width. Adjust its side pitch or hip width.`];
  runs.push(run);
 }
 const total=runs[0]+runs[1];
 if(total>width+1e-7)return [`The ${leftHip&&rightHip?'combined hip widths':'hip width'} (${Math.round(total)} mm) will not fit within the internal roof width (${Math.round(width)} mm). Reduce the hip widths or adjust the side pitches.`];
 if(leftHip&&rightHip&&width-total<=1e-7)return ['The two offset bosses meet at the centre. Select the central-boss arrangement or reduce the hip widths.'];
 if(!(leftHip&&rightHip)&&width-total<=1e-7)return ['The hip spans the entire roof width, leaving no front facet. Reduce its width or adjust its side pitch.'];
 // Distinct full boss rafters are 45mm wide: their footprints must not overlap.
 if(leftHip&&rightHip&&width-total<45-1e-7)return ['There is insufficient space between the two offset boss rafters. Reduce the hip widths or contact Timberlite for assistance.'];
 return [];
}
