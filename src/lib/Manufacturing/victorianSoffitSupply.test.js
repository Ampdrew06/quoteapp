import {buildVictorianGeometry} from '../geometry/victorianGeometry';
import {buildVictorianSoffitSupply} from './victorianSoffitSupply';
const input={widthMM:3392,projMM:3605,pitchDeg:25,frameThicknessMM:70,soffitMM:50,soffitMode:'specified'};
test('Leah 35mm strips share one 100mm five-metre board, including rip kerf',()=>{
 const g=buildVictorianGeometry({inputs:input}),s=buildVictorianSoffitSupply(g);
 expect(g.plyBaseWidthMM).toBe(110);expect(s.valid).toBe(true);expect(s.stripWidthMM).toBe(35);
 expect(s.totalRunMM).toBeCloseTo(9802.5575,1);expect(s.stripCount).toBe(2);
 expect(s.order).toEqual([{widthMM:100,qty:1}]);expect(s.ripInstructions[0].strips).toBe(2);
 expect(s.ripInstructions[0].lengthMM).toBe(5000);
});
test('standard 150mm boards stay full width with fitting tolerance in the base',()=>{
 const g=buildVictorianGeometry({inputs:{...input,soffitMM:150,soffitMode:'standard'}}),s=buildVictorianSoffitSupply(g);
 expect(g.plyBaseWidthMM).toBe(225);expect(s.stripWidthMM).toBe(150);
 expect(s.order).toEqual([{widthMM:150,qty:3}]);
});
test('rip plans fit the configured widths and fail when no stock can supply strips',()=>{
 const g=buildVictorianGeometry({inputs:input});
 const s=buildVictorianSoffitSupply(g,{soffit_board_widths_mm:[100],soffit_rip_kerf_mm:40});
 expect(s.order[0].qty).toBe(2);
 expect(buildVictorianSoffitSupply({...g,soffitStripWidthMM:250}).valid).toBe(false);
});
