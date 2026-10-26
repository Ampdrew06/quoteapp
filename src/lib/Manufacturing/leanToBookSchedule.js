import {resolveLeanToRafterLayout} from '../geometry/leanToRafterLayout';
import { buildRingBeam } from './ringBeamBuilder';
import { buildRingBeamManufactureSchedule } from './ringBeamManufactureSchedule';

// Drawing adapter only. Never used by Summary, pricing or material ordering.
export function buildLeanToBookRingBeam({widthMM, lengthMM, leftExtensionMM, firstCentreMM=690, spacingMM=665, geometry, reference, rafterPositionsMM=null}) {
  if (!(widthMM > 0 && lengthMM > 0 && spacingMM > 0 && firstCentreMM > 0)) return null;
  const resolved=resolveLeanToRafterLayout({widthMM,positions:rafterPositionsMM,firstCentreMM,spacingMM});
  if(!resolved.valid)return null;
  const positions=resolved.centresMM;
  const bays=positions.slice(1).map((p,i)=>Math.max(0,p-positions[i]-48));
  const beam=buildRingBeam({id:'front-ring-beam',label:'Front Ring-beam',lengthMM,internalLengthMM:lengthMM,externalLengthMM:lengthMM,baseWidthMM:geometry.horizontalExtensionMM,pitchDeg:geometry.pitchDeg,soffitDepthMM:geometry.effectiveSoffitMM,plumbCutHeightMM:geometry.manufacturedPlumbCutHeightMM,bayWidthsMM:bays});
  // A simple Lean-To has square ends: all continuous layers run the full width.
  Object.values(beam.layerProfiles).forEach(p=>{p.outline=[{xMM:0,yMM:0},{xMM:lengthMM,yMM:0},{xMM:lengthMM,yMM:p.widthMM},{xMM:0,yMM:p.widthMM}];});
  const group=buildRingBeamManufactureSchedule({members:[{side:'front',manufactureRef:reference,ringBeam:beam}]}).groups[0];
  // Include the real end margins and clip slots at wall ends. No upstand is
  // invented outside the end rafters; the widths match the page-two centres.
  const layout=[];let cursor=0;
  positions.forEach((p,i)=>{
    const centre=leftExtensionMM+p,start=Math.max(0,centre-24),end=Math.min(lengthMM,centre+24);
    if(start>cursor) layout.push({type:'upstand-bay',widthMM:start-cursor,bayLabel:i===0?'End':`B${i}`});
    if(end>start)layout.push({type:'member-slot',widthMM:end-start});
    cursor=end;
  });
  if(cursor<lengthMM)layout.push({type:'upstand-bay',widthMM:lengthMM-cursor,bayLabel:'End'});
  group.cuts.baseLayout=layout;group.cuts.baseLayoutLengthMM=lengthMM;
  return group;
}
