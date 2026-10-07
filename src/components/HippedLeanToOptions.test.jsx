import HippedLeanToOptions from './HippedLeanToOptions';
const elements=node=>!node || typeof node!=='object'?[]:[node,...[node.props?.children].flat(Infinity).flatMap(elements)];
const props={leftHip:true,rightHip:true,leftHipWidthMM:1442.5,rightHipWidthMM:1442.5,requestedLeftSidePitchDeg:'',requestedRightSidePitchDeg:'',leftSidePitchDeg:20.7,rightSidePitchDeg:20.7,sideSoffitMode:'automatic'};
test('boss arrangement selector is available only to admin',()=>{
 for(const isAdmin of [false,true]){
  const nodes=elements(HippedLeanToOptions({...props,isAdmin}));
  const selector=nodes.filter(n=>n.type==='select' && ['offset','central'].includes(n.props.value));
  expect(selector.length).toBe(isAdmin?1:0);
 }
});
test('explicit selector change requests central arrangement',()=>{
 const onBossArrangementChange=jest.fn();
 const selector=elements(HippedLeanToOptions({...props,isAdmin:true,onBossArrangementChange})).find(n=>n.type==='select'&&n.props.value==='offset');
 selector.props.onChange({target:{value:'central'}});
 expect(onBossArrangementChange).toHaveBeenCalledWith('central');
});
test('central mode locks both hip and side-pitch controls while showing calculated pitches',()=>{
 const nodes=elements(HippedLeanToOptions({...props,isAdmin:true,bossArrangement:'central',centralBossPositionMM:2025}));
 const checkboxes=nodes.filter(n=>n.type==='input' && n.props.type==='checkbox');
 expect(checkboxes.slice(0,2).map(n=>[n.props.checked,n.props.disabled])).toEqual([[true,true],[true,true]]);
 const pitches=nodes.filter(n=>n.type==='input'&&n.props.placeholder==='Side pitch');
 expect(pitches.map(n=>[n.props.value,n.props.disabled])).toEqual([['20.7',true],['20.7',true]]);
 const offset=elements(HippedLeanToOptions({...props,isAdmin:true}));
 expect(offset.filter(n=>n.type==='input'&&n.props.placeholder==='Side pitch').some(n=>n.props.disabled)).toBe(false);
});
