import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import PlanDiagramHippedLeanTo from './PlanDiagramHippedLeanTo';
import {calculateHippedLeanToGeometry} from '../lib/geometry/hippedLeanToGeometry';
const build=(bossArrangement)=>{
 const central=bossArrangement==='central',hip=central?1750:1250;
 const g=calculateHippedLeanToGeometry({bossArrangement,widthMM:3500,projectionMM:2500,pitchDeg:15,soffitDepthMM:150,materials:{},hippedSides:'both',leftHipWidthMM:hip,rightHipWidthMM:hip});
 return <PlanDiagramHippedLeanTo bossArrangement={bossArrangement} iw={3500} ip={2500} leftHipWidth={hip} rightHipWidth={hip} hippedSides="both" pitchDeg={15} frontRafterLayout={g.frontRafterLayoutV2} leftSidePitchDeg={g.leftSidePitchDeg} rightSidePitchDeg={g.rightSidePitchDeg} externalWidthMM={g.externalWidthMM} externalProjectionMM={g.externalProjectionMM} leftExternalAllowanceMM={g.leftExternalAllowanceMM} rightExternalAllowanceMM={g.rightExternalAllowanceMM} leftSideRingBeamLayout={g.leftSideRingBeamLayout} rightSideRingBeamLayout={g.rightSideRingBeamLayout} leftBoundaryType="hipped" rightBoundaryType="hipped" isAdmin/>;
};
test('central boss uses the standard dimensioned plan without a zero-length wallplate dimension',()=>{
 const html=renderToStaticMarkup(build('central'));
 expect(html).toContain('3500 int');expect(html).toContain('2500 int');expect(html).toContain('1750 HP');expect(html).not.toContain('EWPL');
 expect(html).toContain('Left side jack');expect(html).toContain('Right side jack');
});
test('offset bosses retain the wallplate dimension and side jack rafters',()=>{
 const html=renderToStaticMarkup(build('offset'));
 expect(html).toContain('1000 EWPL');expect(html).toContain('1250 HP');expect(html).toContain('Left side jack');expect(html).toContain('Right side jack');
});
