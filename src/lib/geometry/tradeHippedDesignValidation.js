// Customer geometry guard only. Admin retains unrestricted diagnostic access.
// No roof size, aspect-ratio or structural span limits are imposed here.
export function validateTradeHippedDesign({isAdmin=false,roofStyle,widthMM,projMM,bossArrangement='offset',leftHip=true,rightHip=true,leftHipWidthMM,rightHipWidthMM}) {
 if(isAdmin||roofStyle!=='hippedLeanTo')return [];
 const width=Number(widthMM),projection=Number(projMM);
 if(!Number.isFinite(width)||width<=0||!Number.isFinite(projection)||projection<=0)return ['Enter a positive width and projection before quoting.'];
 // Central-boss geometry resolves both runs to half the width elsewhere.
 if(bossArrangement==='central')return [];
 const runs=[leftHip?Number(leftHipWidthMM):0,rightHip?Number(rightHipWidthMM):0];
 if(runs.some((run,i)=>(i===0?leftHip:rightHip)&&(!Number.isFinite(run)||run<=0)))return ['Enter a positive width for each selected hip.'];
 const total=runs[0]+runs[1];
 if(total>width+1e-7)return [`The combined hip widths (${Math.round(total)}mm) exceed the roof width (${Math.round(width)}mm). Reduce the hip widths or contact Timberlite for assistance.`];
 if(leftHip&&rightHip&&width-total<=1e-7)return ['The two offset bosses meet at the centre. Select the central-boss arrangement or reduce the hip widths.'];
 // Distinct full boss rafters are 45mm wide: their footprints must not overlap.
 if(leftHip&&rightHip&&width-total<45-1e-7)return ['There is insufficient space between the two offset boss rafters. Reduce the hip widths or contact Timberlite for assistance.'];
 return [];
}
