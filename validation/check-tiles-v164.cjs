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

setAccount('a','admin');const page=read('pages/shared/DesignedRoofTilesLaths.jsx');
const seed={widthMM:3800,projMM:4200,pitchDeg:25,soffitMM:150,soffitMode:'standard',leftSoffitMM:150,rightSoffitMM:150,frontSoffitMM:150,cornerAnglesDeg:[135,135,135,135]};
for(const [family,key,facets] of [['gable','gableDesignPreviewInputs',2],['edwardian','edwardianInputs',3],['victorian','victorianPlanPreviewInputs',5],['victorian-five','victorianFiveInputs',7]]){
 data[key]=JSON.stringify(seed);bank=[];const tree=render(page.DesignedRoofTilesLathsContent,{family});const html=markup(tree);const totals=find(tree,n=>n.type.name==='RoofTilingTotals');assert.ok(totals,family+': '+html.slice(0,500));assert.equal(totals.props.result.facets.length,facets);assert.ok(!html.includes('NaN'));assert.ok(!html.includes('undefined'));assert.ok(!html.includes('Infinity'));assert.ok(totals.props.result.tileQuantityOrdered>0);
 const Nav=family==='gable'?read('pages/gable/GableNavigation.jsx').default:family==='edwardian'?read('pages/edwardian/EdwardianNavigation.jsx').default:read('pages/victorian/VictorianNavigation.jsx').default;const nav=render(Nav,{five:family==='victorian-five'});const tile=find(nav,n=>n.type==='NavLink'&&n.props.to==='/quote/'+family+'/tiles-laths');const technical=find(nav,n=>n.type==='NavLink'&&n.props.to==='/quote/'+family+'/technical');assert.ok(tile);assert.ok(technical);assert.notEqual(tile.props.to,technical.props.to);assert.equal(tile.props.className({isActive:false}),'nav-tab');assert.equal(technical.props.className({isActive:true}),'nav-tab nav-tab-active');console.log('PASS '+family+' separate navigation and '+facets+' actual facet results with finite quantities');
}
setAccount('a','trade');assert.equal(render(page.default,{family:'gable'}).type,'Navigate');
for(const rel of ['pages/shared/DesignedRoofTilesLaths.jsx','pages/gable/GableNavigation.jsx','pages/edwardian/EdwardianNavigation.jsx','pages/victorian/VictorianNavigation.jsx','app/routes.js'])babelTransform(fs.readFileSync(root+'/'+rel,'utf8'),root+'/'+rel,false,[],[]);
console.log('PASS admin guard and changed routes parse');
