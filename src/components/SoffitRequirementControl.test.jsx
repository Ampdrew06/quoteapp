import SoffitRequirementControl from './SoffitRequirementControl';
const nodes=n=>!n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(nodes):[n,...nodes(n.props?.children)];
test('common labels and restriction entry use the supplied callbacks',()=>{
 const onModeChange=jest.fn(),onSizeChange=jest.fn(),tree=SoffitRequirementControl({mode:'specified',size:80,onModeChange,onSizeChange}),all=nodes(tree);
 expect(all.filter(n=>n.type==='option').map(n=>n.props.children)).toEqual(['Automatic','Soffit restriction to side','No soffit']);
 all.find(n=>n.type==='select').props.onChange({target:{value:'none'}});
 all.find(n=>n.type==='input').props.onChange({target:{value:'60'}});
 expect(onModeChange).toHaveBeenCalledWith('none');expect(onSizeChange).toHaveBeenCalledWith('60');
});
test('front-only Lean-To does not duplicate its separate side-overhang controls',()=>{
 const all=nodes(SoffitRequirementControl({allowSideRestriction:false}));
 expect(all.filter(n=>n.type==='option').map(n=>n.props.children)).toEqual(['Automatic','No soffit']);
});
