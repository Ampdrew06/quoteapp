const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {babelTransform}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/lib/transform/babelBundle.js');
const root=path.resolve('project/src'),cache=new Map(),data={quoteapp_user_role:'admin',quoteapp_current_customer_v1:JSON.stringify({id:'admin-id',loginCode:'test-admin',role:'admin'})};
const storage={getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=v,removeItem:k=>delete data[k]};
let bank=[],idx=0,effects=[],rpcImpl=()=>{throw Error('Unexpected RPC')},fromImpl=()=>{throw Error('Unexpected query')};
const jsx=(type,props)=>({type,props}),react={useState:v=>{const i=idx++;if(!(i in bank))bank[i]=typeof v==='function'?v():v;return[bank[i],v=>bank[i]=typeof v==='function'?v(bank[i]):v]},useEffect:f=>effects.push(f),useMemo:f=>f(),useRef:v=>({current:v}),useId:()=> 'test',Fragment:'fragment'};
function load(file){if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);const requireLocal=n=>{if(n==='react')return react;if(n==='react/jsx-runtime')return{jsx,jsxs:jsx,Fragment:'fragment'};if(n==='react-router-dom')return{Link:'Link',Navigate:'Navigate',NavLink:'NavLink',useLocation:()=>({pathname:'/schedule'}),useNavigate:()=>()=>{}};if(n.endsWith('supabaseClient'))return{supabase:{rpc:(...args)=>{const result=rpcImpl(...args);return {then:(ok,bad)=>Promise.resolve(result).then(ok,bad),range:async()=>result};},from:(...args)=>fromImpl(...args)}};if(n.endsWith('.css')||n.endsWith('.jpg'))return{};if(!n.startsWith('.'))return{};let f=path.resolve(path.dirname(file),n);if(!path.extname(f))f+=fs.existsSync(f+'.js')?'.js':'.jsx';return load(f);};vm.runInNewContext(babelTransform(fs.readFileSync(file,'utf8'),file,false,[],[]).code,{require:requireLocal,exports:m.exports,console,localStorage:storage,window:{dispatchEvent:()=>{},confirm:()=>true,addEventListener:()=>{},removeEventListener:()=>{}},Event:function(){},setInterval:()=>0,clearInterval:()=>{}},{filename:file});return m.exports;}




const {importPurchaseDraft}=load(root+'/lib/schedulePurchaseImport.js');
const {monthlyStockRequirements}=load(root+'/lib/scheduleStockRequirements.js');
const {convertTimberStock}=load(root+'/lib/scheduleTimberStock.js');
const materials={...load(root+'/lib/materials.js').getMaterials(),steico:{stock_len_m:10},ply9mm:{sheet_len_m:3,sheet_width_m:1.5},ply18mm:{sheet_len_m:2,sheet_width_m:1}};
const inputs={roofStyle:'gable',widthMM:3800,projMM:4200,pitchDeg:25,tileProductId:'britmetShingle',leftSoffitMM:150,frontOverhangMM:150};
const model=load(root+'/lib/Calculations/gableSummaryMaterialsModel.js').buildGableSummaryMaterialsModel({inputs,materials});
const result=importPurchaseDraft({inputs_json:inputs,materials_snapshot_json:materials});
assert.ok(result.items,result.error);
const src=model.sections.timber.lines;
const timber=result.items.filter(r=>r.group==='Timber');
const entry=desc=>timber.find(r=>r.description===desc);
assert.equal(Number(entry('Joist lengths').qty),Math.ceil(src.find(r=>r.key==='gable_joists').qty/10));
assert.equal(Number(entry('9 mm ply').qty),Math.ceil(src.filter(r=>['gable_gussets','gable_frontFace','gable_bases','gable_upstands'].includes(r.key)).reduce((n,r)=>n+r.qty,0)/4.5));
assert.equal(Number(entry('18 mm ply').qty),Math.ceil(src.find(r=>r.key==='gable_chevrons').qty/2));
const kept={group:'Timber',description:'Joists',qty:12,unit:'m',status:'ordered'};
const legacy=convertTimberStock([kept,{...kept,qty:34.116,description:'220mm truss members',status:'needed'}],materials);
assert.equal(legacy[0].qty,'4');
assert.equal(legacy[1],kept);
const totals=monthlyStockRequirements([{data:{purchaseChecklist:{items:[
 ...['needed','ordered','stock'].map(status=>({description:'SuperQuilt — 12m² roll',qty:1.5,unit:'rolls',status})),entry('Joist lengths')
]}}}]);
assert.equal(totals.totals.find(r=>r.id==='quilt12').qty,4.5);
assert.equal(totals.totals.find(r=>r.id==='quilt12').yetToOrder,1.5);
assert.equal(totals.review.length,0);
const Preview=load(root+'/pages/gable/GableDesignPreview.jsx').default;
function find(node,p){if(Array.isArray(node))return node.map(n=>find(n,p)).find(Boolean);if(!node||typeof node!=='object')return;return p(node)?node:find(node.props?.children,p);}
function render(fresh=false){idx=0;effects=[];return Preview({mode:'design',fresh});}
function form(tree){return find(tree,n=>n.props?.onQuote&&n.props?.onReset).props;}
function persist(){effects.at(-1)();}
data.gableDesignPreviewInputs=JSON.stringify(inputs);
assert.equal(form(render()).showQuote,false);
form(render()).onQuote();
assert.equal(form(render()).showQuote,true);
persist();
bank=[];
assert.equal(form(render()).showQuote,true);
assert.ok(find(render(),n=>n.type?.name==='GableQuoteResults'));
form(render()).onReset();assert.equal(form(render()).showQuote,false);persist();
assert.equal(JSON.parse(data.gableDesignPreviewInputs).quoteDisplayed,false);
data.gableDesignPreviewInputs=JSON.stringify({...inputs,quoteDisplayed:true});
bank=[];assert.equal(form(render(true)).showQuote,false);
load(root+'/pages/Schedule.jsx');
console.log('v293 stock allowance, legacy preservation, remaining quantities and Gable remount/reset passed');
