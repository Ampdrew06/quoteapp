const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {babelTransform}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/lib/transform/babelBundle.js');
const root=path.resolve('project/src'),cache=new Map(),data={},calls=[],routes=[];let response=[],apiError=null,pathname='/quote/edwardian';
const storage={getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=v,removeItem:k=>delete data[k]};
const jsx=(type,props,key)=>({type,props,key});let bank=[],index=0;
const react={useState:init=>{const i=index++;if(!(i in bank))bank[i]=typeof init==='function'?init():init;return [bank[i],v=>bank[i]=typeof v==='function'?v(bank[i]):v]},useEffect:()=>{},useMemo:f=>f(),useRef:v=>({current:v}),Fragment:'fragment'};
const supabase={from(table){calls.push(['from',table]);return {select(columns){calls.push(['select',columns]);return {eq(key,value){calls.push(['eq',key,value]);return {order:async()=>({data:response,error:apiError})};}};}};}};
function load(file){if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);
const req=name=>{if(name==='react')return react;if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment:'fragment'};if(name==='react-router-dom')return {Link:'Link',NavLink:'NavLink',Navigate:'Navigate',useLocation:()=>({pathname,state:null}),useNavigate:()=>((...args)=>routes.push(args))};if(name.includes('supabaseClient'))return {supabase};if(/\.(css|jpg|png)$/.test(name))return {default:'logo.jpg'};if(!name.startsWith('.'))return {};let dep=path.resolve(path.dirname(file),name);if(!path.extname(dep))dep+=fs.existsSync(dep+'.js')?'.js':'.jsx';return load(dep);};
vm.runInNewContext(babelTransform(fs.readFileSync(file,'utf8'),file,false,[],[]).code,{exports:m.exports,require:req,localStorage:storage,window:{localStorage:storage,dispatchEvent:()=>{},addEventListener:()=>{},removeEventListener:()=>{}},Event:function(){},console,setTimeout:()=>{}},{filename:file});return m.exports;}
const read=rel=>load(root+'/'+rel),role=read('lib/userRole.js'),customers=read('lib/customers.js');
const setAccount=(id,r='trade')=>{data.quoteapp_user_role=r;data[customers.CURRENT_CUSTOMER_KEY]=JSON.stringify({id,name:id,role:r});};
function find(tree,pred){if(!tree||typeof tree!=='object')return null;if(Array.isArray(tree)){for(const n of tree){const f=find(n,pred);if(f)return f;}return null;}if(pred(tree))return tree;return find(tree.props?.children,pred);}
function render(Component,props={}){index=0;return Component(props);}

const Nav=read('components/NavTabs.jsx').default,remember=read('lib/roofNavigation.js');
setAccount('admin','admin');react.useEffect=f=>f();
function expand(n){return typeof n.type==='function'?expand(n.type(n.props)):n;}
for(const family of ['lean-to','gable','edwardian','victorian','victorian-five']){
 pathname='/quote/'+family;
 const custom=family==='edwardian'?read('pages/edwardian/EdwardianNavigation.jsx').default:family==='gable'?read('pages/gable/GableNavigation.jsx').default:family.startsWith('victorian')?read('pages/victorian/VictorianNavigation.jsx').default:Nav;
 render(custom,{five:family==='victorian-five'});assert.equal(remember.readRoofNavigation(storage),family);
 for(const page of ['/quotes','/jobs','/customers','/materials','/my-quotes']){
  pathname=page;const tree=expand(render(Nav));const link=find(tree,n=>n.type==='NavLink'&&n.props.to==='/quote/'+family);assert.ok(link,family+' from '+page);
 }
 console.log('PASS shared navigation returns to '+family+' across five shared pages');
}
react.useEffect=()=>{};pathname='/quote/edwardian';data.edwardianInputs=JSON.stringify({widthMM:3800,projMM:4200,pitchDeg:25,quoteDisplayed:true});data.leanToInputs=JSON.stringify({roofStyle:'hippedLeanTo',widthMM:1000,projMM:6000});bank=[];
const Edwardian=read('pages/edwardian/EdwardianDesign.jsx').default;render(Edwardian);assert.equal(bank[0].widthMM,3800);assert.equal(bank[0].projMM,4200);assert.equal(bank[3],true);
console.log('PASS Edwardian dimensions and displayed quote restore independently of a stored Hipped Lean-To');
const book=read('pages/victorian/VictorianManufacture.jsx');
for(const five of [false,true]){data[five?'victorianFiveInputs':'victorianPlanPreviewInputs']=JSON.stringify({widthMM:3800,projMM:4200,pitchDeg:25,soffitMM:150,soffitMode:'standard'});bank=[];const tree=render(book.VictorianManufactureContent,{five});const nav=find(tree,n=>typeof n.type==='function'&&n.type.name==='VictorianNavigation');assert.ok(nav);assert.equal(nav.props.five,five);const tabs=expand(nav);assert.ok(find(tabs,n=>n.type==='NavLink'&&n.props.to==='/quote/'+(five?'victorian-five':'victorian')+'/plan-manufacture'));}
console.log('PASS both Victorian manufacture books include the correct family tabs');
for(const file of ['components/NavTabs.jsx','lib/roofNavigation.js','pages/gable/GableNavigation.jsx','pages/edwardian/EdwardianNavigation.jsx','pages/victorian/VictorianNavigation.jsx','pages/victorian/VictorianManufacture.jsx'])babelTransform(fs.readFileSync(root+'/'+file,'utf8'),root+'/'+file,false,[],[]);
console.log('PASS all changed JSX/modules parse');

setAccount('trade','trade');remember.rememberRoofNavigation('edwardian',storage);pathname='/my-quotes';let tradeNav=expand(render(Nav));assert.ok(find(tradeNav,n=>n.type==='NavLink'&&n.props.to==='/quote/edwardian'));assert.ok(find(tradeNav,n=>n.type==='NavLink'&&n.props.to==='/my-quotes'));assert.ok(!find(tradeNav,n=>n.type==='NavLink'&&n.props.to==='/customers'));assert.ok(!find(tradeNav,n=>n.type==='NavLink'&&n.props.to.includes('plan-manufacture')));console.log('PASS remembered roof navigation retains trade access restrictions');
