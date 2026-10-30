import {pirBoardAllowance,pir50InstalledWeight,frameLineRoofArea} from './pirInsulationRules';
test('whole sheet orders include waste once while installed cradle weight excludes it',()=>{
 const net={cradleAreaM2:10,ringAreaM2:4,kgPerM2:1.6,cradleMultiplier:.6};
 expect(pir50InstalledWeight(net)).toBe(16);
 expect(pir50InstalledWeight({...net,cradleMultiplier:0})).toBe(6.4);
 expect(pirBoardAllowance({areaM2:14,wastePercent:5}).sheets).toBe(6);
 expect(pirBoardAllowance({areaM2:14,wastePercent:0}).sheets).toBe(5);
 expect(pirBoardAllowance({areaM2:14,wastePercent:-1})).toBeNull();
 expect(pirBoardAllowance({areaM2:14,sheetWidthM:0})).toBeNull();
});
test('outside-frame surface extends active eaves but leaves house-wall edges unchanged',()=>{
 const p=(xMM,yMM)=>({xMM,yMM}),outline=[p(0,0),p(0,1000),p(1000,1000),p(1000,0)];
 const a=frameLineRoofArea({outline,facets:[{start:outline[1],end:outline[2],pitchDeg:30}],frameMM:100});
 expect(a.areaM2).toBeCloseTo(1.1/Math.cos(Math.PI/6),8);
 expect(Math.max(...a.domain.map(p=>p.yMM))).toBe(1100);
 expect(Math.min(...a.domain.map(p=>p.yMM))).toBe(0);
});
