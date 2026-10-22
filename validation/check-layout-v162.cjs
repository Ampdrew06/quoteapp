const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {babelTransform}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/lib/transform/babelBundle.js');
const root=path.resolve('project/src'),cache=new Map(),data={},calls=[],routes=[];let response=[],apiError=null;
const storage={getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=v,removeItem:k=>delete data[k]};
const jsx=(type,props,key)=>({type,props,key});let bank=[],index=0;
const react={useState:init=>{const i=index++;if(!(i in bank))bank[i]=typeof init==='function'?init():init;return [bank[i],v=>bank[i]=typeof v==='function'?v(bank[i]):v]},useEffect:()=>{},useMemo:f=>f(),useRef:v=>({current:v}),Fragment:'fragment'};
const supabase={from(table){calls.push(['from',table]);return {select(columns){calls.push(['select',columns]);return {eq(key,value){calls.push(['eq',key,value]);return {order:async()=>({data:response,error:apiError})};}};}};}};
function load(file){if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);
const req=name=>{if(name==='react')return react;if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment:'fragment'};if(name==='react-router-dom')return {Link:'Link',NavLink:'NavLink',Navigate:'Navigate',useLocation:()=>({pathname:'/quote/victorian-five',state:null}),useNavigate:()=>((...args)=>routes.push(args))};if(name.includes('supabaseClient'))return {supabase};if(/\.(css|jpg|png)$/.test(name))return {default:'logo.jpg'};if(!name.startsWith('.'))return {};let dep=path.resolve(path.dirname(file),name);if(!path.extname(dep))dep+=fs.existsSync(dep+'.js')?'.js':'.jsx';return load(dep);};
vm.runInNewContext(babelTransform(fs.readFileSync(file,'utf8'),file,false,[],[]).code,{exports:m.exports,require:req,localStorage:storage,window:{localStorage:storage,dispatchEvent:()=>{},addEventListener:()=>{},removeEventListener:()=>{}},Event:function(){},console,setTimeout:()=>{}},{filename:file});return m.exports;}
const read=rel=>load(root+'/'+rel),role=read('lib/userRole.js'),customers=read('lib/customers.js');
const setAccount=(id,r='trade')=>{data.quoteapp_user_role=r;data[customers.CURRENT_CUSTOMER_KEY]=JSON.stringify({id,name:id,role:r});};
function find(tree,pred){if(!tree||typeof tree!=='object')return null;if(Array.isArray(tree)){for(const n of tree){const f=find(n,pred);if(f)return f;}return null;}if(pred(tree))return tree;return find(tree.props?.children,pred);}
function render(Component,props={}){index=0;return Component(props);}

const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
function markup(n){if(n==null||typeof n==='boolean')return '';if(Array.isArray(n))return n.map(markup).join('');if(typeof n!=='object')return esc(n);if(typeof n.type==='function')return markup(n.type(n.props));return '<'+n.type+'>'+markup(n.props?.children)+'</'+n.type+'>';}

setAccount('admin','admin');
const seed={widthMM:3800,projMM:4200,pitchDeg:25,soffitMM:150,soffitMode:'standard',cornerAnglesDeg:[135,135,135,135]};
data.victorianPlanPreviewInputs=JSON.stringify(seed);data.victorianFiveInputs=JSON.stringify(seed);
const content=tree=>Array.isArray(tree.props?.children)?tree.props.children:[tree.props?.children];
for(const five of [false,true]){
 bank=[];const tree=render(read('pages/victorian/VictorianManufacture.jsx').VictorianManufactureContent,{five});
 const children=content(tree);assert.equal(children[0].type.name,'VictorianNavigation');assert.ok(children[1].props.className.includes('em-front'));assert.equal(children[2].type,'details');assert.equal(children[2].props.open,undefined);assert.equal(children[2].props.className,'vm-controls');assert.ok(find(children[2],n=>n.type==='input'));
 bank=[];const summary=render(read('pages/victorian/VictorianSummary.jsx').VictorianSummaryContent,{five});const siblings=content(summary);assert.equal(siblings[0].type.name,'VictorianNavigation');assert.equal(siblings[1].type,'main');assert.equal(siblings[1].props.style.maxWidth,1100);assert.ok(find(siblings[1],n=>n.type==='details'&&find(n,c=>c.type==='input')));
 bank=[];const checklist=render(read('pages/victorian/VictorianIdiotList.jsx').VictorianChecklistContent,{five});assert.ok(!find(checklist,n=>n.type==='button'&&n.props.className==='vi-print'));
 console.log('PASS '+(five?'five':'three')+' facet book starts with front, optional fields collapsed; Summary banner outside content; checklist uses shared Print');
}
for(const [file,exportName] of [['VictorianPlanPreview.jsx','default'],['VictorianFivePlanPreview.jsx','FiveFacetReview']]){bank=[];const tree=render(read('pages/victorian/'+file)[exportName]);const siblings=content(tree);assert.equal(siblings[0].type.name,'VictorianNavigation');assert.equal(siblings[1].type,'main');assert.ok(find(siblings[1],n=>n.type==='details'&&n.props.className?.endsWith('settings')));console.log('PASS '+file+' full-width banner and collapsed technical settings');}
for(const rel of ['VictorianManufacture.jsx','VictorianSummary.jsx','VictorianPlanPreview.jsx','VictorianFivePlanPreview.jsx','VictorianIdiotList.jsx','VictorianNavigation.jsx'])babelTransform(fs.readFileSync(root+'/pages/victorian/'+rel,'utf8'),root+'/pages/victorian/'+rel,false,[],[]);
console.log('PASS all six changed components parse');
