const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {babelTransform}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/lib/transform/babelBundle.js');
const root=path.resolve('project/src'),cache=new Map(),data={quoteapp_user_role:'admin',quoteapp_current_customer_v1:JSON.stringify({id:'admin-id',loginCode:'test-admin',role:'admin'})};
const storage={getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=v,removeItem:k=>delete data[k]};
let bank=[],idx=0,effects=[],rpcImpl=()=>{throw Error('Unexpected RPC')},fromImpl=()=>{throw Error('Unexpected query')};
const jsx=(type,props)=>({type,props}),react={useState:v=>{const i=idx++;if(!(i in bank))bank[i]=typeof v==='function'?v():v;return[bank[i],v=>bank[i]=typeof v==='function'?v(bank[i]):v]},useEffect:f=>effects.push(f),useMemo:f=>f(),useRef:v=>({current:v}),useId:()=> 'test',Fragment:'fragment'};
function load(file){if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);const requireLocal=n=>{if(n==='react')return react;if(n==='react/jsx-runtime')return{jsx,jsxs:jsx,Fragment:'fragment'};if(n==='react-router-dom')return{Link:'Link',Navigate:'Navigate',NavLink:'NavLink',useLocation:()=>({pathname:'/schedule'}),useNavigate:()=>()=>{}};if(n.endsWith('supabaseClient'))return{supabase:{rpc:(...args)=>{const result=rpcImpl(...args);return {then:(ok,bad)=>Promise.resolve(result).then(ok,bad),range:async()=>result};},from:(...args)=>fromImpl(...args)}};if(n.endsWith('.css')||n.endsWith('.jpg'))return{};if(!n.startsWith('.'))return{};let f=path.resolve(path.dirname(file),n);if(!path.extname(f))f+=fs.existsSync(f+'.js')?'.js':'.jsx';return load(f);};vm.runInNewContext(babelTransform(fs.readFileSync(file,'utf8'),file,false,[],[]).code,{require:requireLocal,exports:m.exports,console,localStorage:storage,window:{dispatchEvent:()=>{},confirm:()=>true,addEventListener:()=>{},removeEventListener:()=>{}},Event:function(){},setInterval:()=>0,clearInterval:()=>{}},{filename:file});return m.exports;}

const materials=load(root+'/lib/materials.js').getMaterials();
const inputs={widthMM:4470,projMM:3915,pitchDeg:20,soffitMM:150,tileProductId:'britmetShingle',victorianFacetGeometry:{mode:'survey',leftSideMM:2600,leftChamferMM:1860,frontMM:1850,rightChamferMM:1845,rightSideMM:2600,toleranceMM:2}};
const build=load(root+'/lib/geometry/victorianGeometry.js').buildVictorianGeometry;
const g=build({inputs,materials});assert.equal(g.valid,true,JSON.stringify(g.errors));console.log(JSON.stringify({fit:g.customFacetGeometry,pitches:g.facets.map(f=>f.pitchDeg),eaves:g.facetEaves.map(e=>e.plyBaseWidthMM)},null,2));
const model=load(root+'/lib/Calculations/victorianSummaryMaterialsModel.js').buildVictorianSummaryMaterialsModel({inputs,materials});console.log('MODEL',model.valid,model.errors);assert.equal(model.valid,true,JSON.stringify(model.errors));
load(root+'/components/VictorianFacetGeometryEditor.jsx');load(root+'/pages/victorian/VictorianManufacture.jsx');
const old=build({inputs:{...inputs,victorianFacetGeometry:null},materials});assert.equal(old.valid,true);
const oldfit=build({inputs:{...inputs,victorianFacetGeometry:{...inputs.victorianFacetGeometry,mode:'lengths'}},materials});assert.equal(oldfit.valid,false);
assert.equal(g.widthMM,4470);assert.equal(g.projectionMM,3915);assert.ok(g.customFacetGeometry.differencesMM.every(v=>Math.abs(v)<5));assert.ok(g.facets.some(f=>Math.abs(f.pitchDeg-20)>.01));
console.log('v285 geometry/material integration checks passed');

for(const tileProductId of ['britmetShingle','liteSlate']){const m=load(root+'/lib/Calculations/victorianSummaryMaterialsModel.js').buildVictorianSummaryMaterialsModel({inputs:{...inputs,tileProductId},materials});assert.equal(m.valid,true,JSON.stringify(m.errors));assert.ok(Number.isFinite(m.materialsCostForPricing));assert.ok(m.materialsCostForPricing>0);}
const spec={mode:'survey',leftSideMM:2600,leftChamferMM:Math.hypot(1200,1315),frontMM:1870,rightChamferMM:Math.hypot(1400,1315),rightSideMM:2600,toleranceMM:2};
const exact=build({inputs:{...inputs,victorianFacetGeometry:spec},materials});assert.equal(exact.valid,true,JSON.stringify(exact.errors));assert.ok(exact.customFacetGeometry.differencesMM.every(d=>Math.abs(d)<.001));
const mirror=build({inputs:{...inputs,victorianFacetGeometry:{...spec,leftChamferMM:spec.rightChamferMM,rightChamferMM:spec.leftChamferMM}},materials});assert.equal(mirror.valid,true);assert.ok(Math.abs(exact.facets[1].pitchDeg-mirror.facets[3].pitchDeg)<.0001);
const bad=build({inputs:{...inputs,victorianFacetGeometry:{...spec,leftSideMM:''}},materials});assert.equal(bad.valid,false);
const Customer=load(root+'/pages/victorian/VictorianCustomerPlan.jsx').default;assert.ok(Customer({geometry:g}));
console.log('v285 both coverings, exact survey, mirror and invalid-input checks passed');
