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

const geo=read('lib/geometry/victorianHippedGeometry.js'),defaults=geo.victorianHippedDefaults;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const [w,p,c,b,pitch] of [[7300,3370,1135,2210,17],[5000,3000,800,1500,15],[8000,4000,1400,2500,25]]){
 const g=geo.buildVictorianHippedGeometry({inputs:{...defaults,widthMM:w,projMM:p,cornerInsetMM:c,bossInsetMM:b,pitchDeg:pitch}});assert.ok(g.valid);assert.equal(g.facets.length,5);assert.equal(g.hips.length,4);assert.equal(g.hips.filter(h=>h.bossId==='BL').length,2);assert.equal(g.hips.filter(h=>h.bossId==='BR').length,2);
 near(g.facets.reduce((n,f)=>n+f.planAreaM2,0),g.internalPlanAreaM2);near(g.facets[0].pitchDeg,g.facets[4].pitchDeg);near(g.facets[1].pitchDeg,g.facets[3].pitchDeg);near(g.facets[2].pitchDeg,pitch);near(g.hips[0].geometricSlopeMM,g.hips[3].geometricSlopeMM);near(g.hips[1].geometricSlopeMM,g.hips[2].geometricSlopeMM);
 for(const f of g.facets){for(const id of f.bossIds){const boss=g.bosses.find(b=>b.id===id),dx=f.end.xMM-f.start.xMM,dy=f.end.yMM-f.start.yMM,dist=Math.abs(dx*(boss.yMM-f.start.yMM)-dy*(boss.xMM-f.start.xMM))/f.internalLengthMM;near(dist*Math.tan(f.pitchDeg*Math.PI/180),g.riseMM);}}
 const growth=g.plyBaseWidthMM*Math.tan(Math.PI/8);near(g.facets[0].externalLengthMM-g.facets[0].internalLengthMM,growth);for(const f of g.facets.slice(1,4))near(f.externalLengthMM-f.internalLengthMM,2*growth);
 console.log('PASS '+w+'x'+p+' topology, plane heights, mirrored hips, area closure and 135-degree ply offset');
}
for(const patch of [{widthMM:0},{cornerInsetMM:4000},{bossInsetMM:4000},{pitchDeg:0},{widthMM:'abc'},{soffitMM:-1},{cornerAnglesDeg:[134,136,136,134]}])assert.equal(geo.buildVictorianHippedGeometry({inputs:{...defaults,...patch}}).valid,false);
const specified=geo.buildVictorianHippedGeometry({inputs:{...defaults,soffitMode:'specified',soffitMM:50}});near(specified.plyBaseWidthMM,110);assert.equal(geo.buildVictorianHippedGeometry({inputs:defaults}).plyBaseWidthMM,225);
console.log('PASS invalid input guards and standard/specified soffit allowances');
setAccount('a','admin');bank=[];data.victorianPlanPreviewInputs=JSON.stringify({widthMM:3392});data.leanToInputs=JSON.stringify({widthMM:3500});const before=[data.victorianPlanPreviewInputs,data.leanToInputs];const page=read('pages/victorian-hipped/VictorianHippedPreview.jsx');const tree=render(page.VictorianHippedPreviewContent);const html=markup(tree);assert.ok(html.includes('RB5'));assert.ok(!html.includes('NaN'));assert.ok(!html.includes('undefined'));assert.ok(!html.includes('Infinity'));assert.deepEqual([data.victorianPlanPreviewInputs,data.leanToInputs],before);
setAccount('a','trade');assert.equal(render(page.default).type,'Navigate');
for(const f of ['pages/victorian-hipped/VictorianHippedPreview.jsx','app/routes.js','pages/QuoteWizard.js'])babelTransform(fs.readFileSync(root+'/'+f,'utf8'),root+'/'+f,false,[],[]);
console.log('PASS actual preview rendering, isolated inputs, admin-only entry and route parsing');
