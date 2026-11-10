const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {babelTransform}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/lib/transform/babelBundle.js');
const root=path.resolve('project/src'),cache=new Map(),data={quoteapp_user_role:'admin',quoteapp_current_customer_v1:JSON.stringify({id:'admin-id',loginCode:'test-admin',role:'admin'})};
const storage={getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=v,removeItem:k=>delete data[k]};
let bank=[],idx=0,effects=[],rpcImpl=()=>{throw Error('Unexpected RPC')},fromImpl=()=>{throw Error('Unexpected query')};
const jsx=(type,props)=>({type,props}),react={useState:v=>{const i=idx++;if(!(i in bank))bank[i]=typeof v==='function'?v():v;return[bank[i],v=>bank[i]=typeof v==='function'?v(bank[i]):v]},useEffect:f=>effects.push(f),useMemo:f=>f(),useRef:v=>({current:v}),useId:()=> 'test',Fragment:'fragment'};
function load(file){if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);const requireLocal=n=>{if(n==='react')return react;if(n==='react/jsx-runtime')return{jsx,jsxs:jsx,Fragment:'fragment'};if(n==='react-router-dom')return{Link:'Link',Navigate:'Navigate',NavLink:'NavLink',useLocation:()=>({pathname:'/schedule'}),useNavigate:()=>()=>{}};if(n.endsWith('supabaseClient'))return{supabase:{rpc:(...args)=>{const result=rpcImpl(...args);return {then:(ok,bad)=>Promise.resolve(result).then(ok,bad),range:async()=>result};},from:(...args)=>fromImpl(...args)}};if(n.endsWith('.css')||n.endsWith('.jpg'))return{};if(!n.startsWith('.'))return{};let f=path.resolve(path.dirname(file),n);if(!path.extname(f))f+=fs.existsSync(f+'.js')?'.js':'.jsx';return load(f);};vm.runInNewContext(babelTransform(fs.readFileSync(file,'utf8'),file,false,[],[]).code,{require:requireLocal,exports:m.exports,console,localStorage:storage,window:{dispatchEvent:()=>{},confirm:()=>true,addEventListener:()=>{},removeEventListener:()=>{}},Event:function(){},setInterval:()=>0,clearInterval:()=>{}},{filename:file});return m.exports;}



const {monthlyStockRequirements}=load(root+'/lib/scheduleStockRequirements.js');
const {inScheduleMonth}=load(root+'/lib/scheduleModel.js');
const item=(description,qty,unit,status='needed',specification='')=>({description,qty,unit,status,specification});
const order=(items,overrides={})=>({data:{customerName:'Test',deliveryDate:'2026-11-08',purchaseChecklist:{items},...overrides}});
const rows=[
 order([item('Joists','10','lengths','ordered'),item('SuperQuilt — 12m² roll',2,'rolls','stock'),item('SuperQuilt',3,'rolls','needed','15 m'),item('100mm PIR',4,'sheets'),item('Breather membrane',2,'rolls'),item('Expanding foam tape — hips',5,'5.6m rolls'),item('3m tile starter',6,'lengths'),item('Spar hooks',7,'each'),item('Joist hangers',8,'each'),item('Jack rafter brackets',9,'each'),item('Jack rafter hooks',10,'each')]),
 order([item('Joists',2,'lengths','stock'),item('220mm I-joist — hips',27,'m'),item('SuperQuilt',3,'rolls'),item('50mm PIR',99,'sheets'),item('Gutter lengths',99,'lengths')]),
 order([item('Joists',90,'lengths')],{status:'Cancelled'}),
 order([item('Joists',90,'lengths')],{archived:true}),
 order([item('Joists',90,'lengths')],{deliveryDate:'2026-12-01'}),
 order([],{purchaseChecklist:undefined}),
 order([],{purchaseChecklist:{items:[],reviewed:true}})
];
const result=monthlyStockRequirements(rows.filter(r=>inScheduleMonth(r,'2026-11')));
assert.equal(JSON.stringify(result.totals.map(r=>r.qty)),JSON.stringify([12,2,3,4,2,5,6,7,8,9,10]));
assert.equal(result.review.length,2);
assert.equal(result.missingChecklists,1);
const {importPurchaseDraft}=load(root+'/lib/schedulePurchaseImport.js');
const {buildVictorianSummaryMaterialsModel}=load(root+'/lib/Calculations/victorianSummaryMaterialsModel.js');
const materials=load(root+'/lib/materials.js').getMaterials(),inputs={roofStyle:'victorian',widthMM:3800,projMM:4200,pitchDeg:25,soffitMM:150,tileProductId:'britmetShingle'};
const source=buildVictorianSummaryMaterialsModel({inputs,materials}).sections.misc.lines.find(l=>l.key==='insulation_superQuilt');
assert.ok(source?.basis);
const draft=importPurchaseDraft({inputs_json:inputs,materials_snapshot_json:materials});
const imported=monthlyStockRequirements([order(draft.items)]);
assert.equal(imported.totals.filter(r=>r.id.startsWith('quilt')).reduce((n,r)=>n+r.qty,0),source.order_qty);
assert.ok(imported.totals.find(r=>r.id==='starter').qty>0);
load(root+'/components/ScheduleStockRequirements.jsx');
load(root+'/pages/Schedule.jsx');
console.log('v292 monthly demand, status, exclusions, unknown units and imported roll mix passed');
