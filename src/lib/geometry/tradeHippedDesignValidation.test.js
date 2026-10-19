import {validateTradeHippedDesign as validate} from './tradeHippedDesignValidation';
const base={roofStyle:'hippedLeanTo',widthMM:1000,projMM:6000,leftHip:true,rightHip:true,leftHipWidthMM:3000,rightHipWidthMM:3000};
test('trade rejects the crossed-hip 1000 by 6000 example',()=>{expect(validate(base).length).toBe(1);});
test('admin bypasses every customer geometry restriction',()=>{expect(validate({...base,isAdmin:true})).toEqual([]);});
test('offset bosses cannot coincide or overlap their 45mm rafters',()=>{
 for(const widthMM of [6000,6020,6044.9])expect(validate({...base,widthMM}).length).toBe(1);
 expect(validate({...base,widthMM:6045})).toEqual([]);
});
test('valid unusual proportions are not rejected',()=>{expect(validate({...base,leftHipWidthMM:400,rightHipWidthMM:400})).toEqual([]);});
test('central bosses use their own resolved geometry',()=>{expect(validate({...base,bossArrangement:'central'})).toEqual([]);});
test('single hips ignore the disabled hip and cannot overrun the roof',()=>{
 expect(validate({...base,rightHip:false,leftHipWidthMM:500})).toEqual([]);
 expect(validate({...base,rightHip:false,leftHipWidthMM:1100}).length).toBe(1);
});
test('trade requires positive finite dimensions and enabled hip runs',()=>{
 for(const value of [-1,0,Infinity,NaN]) {
  expect(validate({...base,widthMM:value}).length).toBe(1);
  expect(validate({...base,widthMM:7000,leftHipWidthMM:value}).length).toBe(1);
 }
});
test('simple lean-to and inactive hips are unaffected',()=>{
 expect(validate({...base,roofStyle:'leanTo'})).toEqual([]);
 expect(validate({...base,leftHip:false,rightHip:false})).toEqual([]);
});
