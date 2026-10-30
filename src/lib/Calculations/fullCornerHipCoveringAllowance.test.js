import {fullCornerHipCoveringAllowance as build} from './fullCornerHipCoveringAllowance';
const p=(xMM,yMM)=>({xMM,yMM});
const hip={start:p(500,0),end:p(0,1000)};
const facets=[{id:'side',start:p(0,0),end:hip.end,pitchDeg:45},{id:'front',start:hip.end,end:p(2000,1000),pitchDeg:Math.atan(.5)*180/Math.PI}];
test('unequal eaves retain enough covering for the whole corner on both faces',()=>{
 const a=build({hip,facets,internalOutline:[p(0,0),hip.end,p(2000,1000)],externalOutline:[p(-100,0),p(-100,1100),p(2100,1100)],centreLineLengthMM:Math.sqrt(1500000)*1.1});
 expect(a.externalCorner).toEqual(p(-100,1100));
 expect(a.lengthMM).toBeCloseTo(Math.sqrt(1100**2+2*600**2),7);
 expect(a.lengthMM).toBeGreaterThan(a.centreLineLengthMM);
});
test('matching eaves give the same developed length on both faces',()=>{
 const a=build({hip,facets,internalOutline:[p(0,0),hip.end,p(2000,1000)],externalOutline:[p(-50,0),p(-50,1100),p(2050,1100)],centreLineLengthMM:Math.sqrt(1500000)*1.1});
 expect(a.faceAllowances[0].lengthMM).toBeCloseTo(a.faceAllowances[1].lengthMM,7);
});
test('existing longer centre-line requirements are never shortened',()=>{
 const a=build({hip,facets,internalOutline:[p(0,0),hip.end],externalOutline:[p(-50,0),p(-50,1100)],centreLineLengthMM:2000});
 expect(a.lengthMM).toBe(2000);
});
