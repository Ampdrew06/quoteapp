import {automaticSupportCentres,splitOversizedSupportBays} from './automaticSupportSpacing';
import {resolveLeanToRafterLayout} from './leanToRafterLayout';

test('rear set-out retains full centres and halves the final oversized bay',()=>{
 expect(automaticSupportCentres({startMM:31.5,endMM:2067})).toEqual([31.5,696.5,1361.5,1714.25,2067]);
});
test('fixed starting datums and manual edits remain intact',()=>{
 const g=resolveLeanToRafterLayout({widthMM:2040});
 expect(g.interiorMM).toEqual([690,1355,1697.5]);
 expect(resolveLeanToRafterLayout({widthMM:4000,positions:[800,1600]}).interiorMM).toEqual([800,1600]);
});
test('symmetric fixed positions stay fixed when an oversized bay is split',()=>{
 expect(splitOversizedSupportBays([0,500,1300,1800])).toEqual([0,500,900,1300,1800]);
});
