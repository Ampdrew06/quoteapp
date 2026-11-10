const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {babelTransform}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/lib/transform/babelBundle.js');
const root=path.resolve('project/src'),cache=new Map(),data={quoteapp_user_role:'admin',quoteapp_current_customer_v1:JSON.stringify({id:'admin-id',loginCode:'test-admin',role:'admin'})};
const storage={getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=v,removeItem:k=>delete data[k]};
let bank=[],idx=0,effects=[],rpcImpl=()=>{throw Error('Unexpected RPC')},fromImpl=()=>{throw Error('Unexpected query')};
const jsx=(type,props)=>({type,props}),react={useState:v=>{const i=idx++;if(!(i in bank))bank[i]=typeof v==='function'?v():v;return[bank[i],v=>bank[i]=typeof v==='function'?v(bank[i]):v]},useEffect:f=>effects.push(f),useMemo:f=>f(),useRef:v=>({current:v}),useId:()=> 'test',Fragment:'fragment'};
function load(file){if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);const requireLocal=n=>{if(n==='react')return react;if(n==='react/jsx-runtime')return{jsx,jsxs:jsx,Fragment:'fragment'};if(n==='react-router-dom')return{Link:'Link',Navigate:'Navigate',NavLink:'NavLink',useLocation:()=>({pathname:'/schedule'}),useNavigate:()=>()=>{}};if(n.endsWith('supabaseClient'))return{supabase:{rpc:(...args)=>{const result=rpcImpl(...args);return {then:(ok,bad)=>Promise.resolve(result).then(ok,bad),range:async()=>result};},from:(...args)=>fromImpl(...args)}};if(n.endsWith('.css')||n.endsWith('.jpg'))return{};if(!n.startsWith('.'))return{};let f=path.resolve(path.dirname(file),n);if(!path.extname(f))f+=fs.existsSync(f+'.js')?'.js':'.jsx';return load(f);};vm.runInNewContext(babelTransform(fs.readFileSync(file,'utf8'),file,false,[],[]).code,{require:requireLocal,exports:m.exports,console,localStorage:storage,window:{dispatchEvent:()=>{},confirm:()=>true,addEventListener:()=>{},removeEventListener:()=>{}},Event:function(){},setInterval:()=>0,clearInterval:()=>{}},{filename:file});return m.exports;}



const {importPurchaseDraft}=load(root+'/lib/schedulePurchaseImport.js');
const {buildVictorianSummaryMaterialsModel}=load(root+'/lib/Calculations/victorianSummaryMaterialsModel.js');
const materials=load(root+'/lib/materials.js').getMaterials();
const inputs={roofStyle:'victorian',widthMM:3800,projMM:4200,pitchDeg:25,soffitMM:150,tileProductId:'britmetShingle',tileColour:'Bramble Brown'};
const importDraft=i=>importPurchaseDraft({inputs_json:i,materials_snapshot_json:materials});
const summary=buildVictorianSummaryMaterialsModel({inputs,materials});
const draft=importDraft(inputs);
assert.ok(!draft.error,draft.error);
const tiles=draft.items.filter(r=>r.group==='Tiles');
for (const line of summary.sections.tiles.lines.filter(r=>!r.excluded&&r.order_qty>0)){
 assert.ok(tiles.some(item=>item.description===line.label&&Number(item.qty)===line.order_qty&&item.status==='needed'),line.label);
}
assert.equal(tiles.filter(r=>/tile starter/i.test(r.description)).length,1);
assert.ok(tiles.some(r=>/ventilation strips/i.test(r.description)));
assert.ok(tiles.every(r=>r.specification.includes('Bramble Brown')));
const excluded=summary.sections.tiles.lines.find(r=>r.order_qty>0);
const withExclusion=importDraft({...inputs,summaryPricingState:{exclusions:{[excluded._k]:true}}});
assert.ok(!withExclusion.items.some(r=>r.group==='Tiles'&&r.description===excluded.label));
const purchasing=load(root+'/lib/schedulePurchasing.js');
assert.equal(purchasing.validatePurchases({items:tiles}),'');
const checked=purchasing.setPurchaseGroupOrdered(draft.items,'Tiles',true);
assert.ok(purchasing.purchaseGroupComplete(checked,'Tiles'));
assert.ok(checked.filter(r=>r.group!=='Tiles').every(r=>r.status==='needed'));
console.log('v291 saved quantities, colour, exclusions, starter grouping and Tiles checkbox passed');
