import {calculateSquaredSteelTileOffcut} from './squaredSteelTileOffcut';
test('squares a mitred remnant before checking the intact rib and 200mm visible face',()=>{
 const p=calculateSquaredSteelTileOffcut({cutBottomMM:295,cutTopMM:500});
 expect(p.valid).toBe(true);expect(p.squareLengthMM).toBe(295);
 expect(p.visibleCoverageMM).toBe(200);expect(p.usable).toBe(true);
 expect(p.discardedAreaMM2).toBeCloseTo(205*300/2,6);
 expect(p.offcutAreaMM2).toBeCloseTo(295*300+p.discardedAreaMM2,6);
});
test('rejects a long diagonal tip when the square portion is too short',()=>{
 const p=calculateSquaredSteelTileOffcut({cutBottomMM:294,cutTopMM:700});
 expect(p.longestLengthMM).toBe(700);expect(p.visibleCoverageMM).toBe(199);expect(p.usable).toBe(false);
});
test('either slope direction keeps the same shortest square length',()=>{
 const a=calculateSquaredSteelTileOffcut({cutBottomMM:400,cutTopMM:600});
 const b=calculateSquaredSteelTileOffcut({cutBottomMM:600,cutTopMM:400});
 expect(a.squareLengthMM).toBe(b.squareLengthMM);expect(a.discardedAreaMM2).toBe(b.discardedAreaMM2);
});
test('uses the full tile depth in calculating triangular waste rather than the course gauge',()=>{
 const p=calculateSquaredSteelTileOffcut({cutBottomMM:300,cutTopMM:600});
 expect(p.tileDepthMM).toBe(300);expect(p.discardedAreaMM2).toBe(45000);
});
test('clips a diagonal crossing outside the original stock without inventing an intact rib',()=>{
 const p=calculateSquaredSteelTileOffcut({cutBottomMM:-100,cutTopMM:400});
 expect(p.squareLengthMM).toBe(0);expect(p.ribIntact).toBe(false);expect(p.usable).toBe(false);
 expect(p.offcutAreaMM2).toBeGreaterThan(0);
 const q=calculateSquaredSteelTileOffcut({cutBottomMM:2000,cutTopMM:1500});
 expect(q.squareLengthMM).toBe(1340);expect(q.discardedAreaMM2).toBe(0);
});
test('rejects invalid dimensions and diagonal coordinates',()=>{
 expect(calculateSquaredSteelTileOffcut().valid).toBe(false);
 expect(calculateSquaredSteelTileOffcut({cutBottomMM:300,cutTopMM:400,tileDepthMM:0}).valid).toBe(false);
});
