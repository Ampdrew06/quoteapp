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
(async()=>{
setAccount('admin','admin');
const book=read('pages/victorian/VictorianManufacture.jsx'),draft=read('lib/victorianBookDraft.js');
for(const dims of [[3150,3300],[3800,4200]]){
 data.victorianFiveInputs=JSON.stringify({widthMM:dims[0],projMM:dims[1],pitchDeg:25,soffitMM:150,soffitMode:'standard'});bank=[];
 const tree=render(book.VictorianManufactureContent,{five:true}),html=markup(tree);
 assert.ok(html.includes('5 Facet Victorian'));assert.ok(html.includes('9mm ply upstands'));assert.ok(!html.includes('NaN'));assert.ok(!html.includes('Infinity'));assert.ok(!html.includes('>undefined<'));
 const beams=find(tree,n=>n.props?.beams)?.props.beams;assert.equal(beams.length,7);
 const geometry=find(tree,n=>n.props?.geometry)?.props.geometry;assert.equal(geometry.hips.length,6);assert.equal(geometry.jackRafters.length,dims[0]===3800?5:0);
 const jack=read('components/VictorianJackSetoutPages.jsx').default({geometry});const jackHTML=markup(jack);assert.equal(jackHTML.includes('schematic plan'),dims[0]===3800);
 assert.equal(draft.victorianBookDraftKey(bank[0]),'victorianFiveBookDetails');
 console.log('PASS actual book, truss, hip, seven ringbeam/upstand and checklist components: '+dims.join(' x '));
}
const five=bank[0];data.victorianBookDetails=JSON.stringify({design:draft.victorianBookIdentity({...five,roofStyle:'victorian',frontFacetCount:3}),details:{reference:'THREE'}});
assert.equal(draft.readVictorianBookDraft(five,storage),null);
data.victorianFiveBookDetails=JSON.stringify({design:draft.victorianBookIdentity(five),details:{reference:'FIVE'}});assert.equal(draft.readVictorianBookDraft(five,storage).reference,'FIVE');
assert.equal(draft.readVictorianBookDraft({...five,widthMM:9999},storage),null);
console.log('PASS book front drafts remain isolated between families and different designs');
for(const rel of ['pages/victorian/VictorianManufacture.jsx','pages/victorian/VictorianIdiotList.jsx','pages/victorian/VictorianNavigation.jsx','pages/Quotes.jsx','pages/Jobs.jsx','app/routes.js'])babelTransform(fs.readFileSync(root+'/'+rel,'utf8'),root+'/'+rel,false,[],[]);
setAccount('x','trade');assert.equal(render(book.default,{five:true}).type,'Navigate');
console.log('PASS changed routes parse and trade cannot access admin manufacture book');
setAccount('admin','admin');const records=read('lib/activeDesignRecord.js'),api=read('lib/quotes.js');let updates=[];
records.activateDesignRecord({id:'q5',roof_style:'victorian-five',inputs_json:five},storage);bank=[];let tree=render(book.VictorianManufactureContent,{five:true});let front=find(tree,n=>typeof n.props?.onSave==='function');front.props.onChange({reference:'WORKSHOP'});tree=render(book.VictorianManufactureContent,{five:true});front=find(tree,n=>typeof n.props?.onSave==='function');api.updateQuote=async(id,patch)=>{updates.push({id,patch});return {id,...patch}};await front.props.onSave();assert.equal(updates.length,1);assert.equal(updates[0].patch.inputs_json.victorianFiveBookDetails.reference,'WORKSHOP');assert.equal(draft.readVictorianBookDraft(JSON.parse(data.victorianFiveInputs),storage).reference,'WORKSHOP');
api.updateQuote=async()=>{throw Error('offline')};await front.props.onSave();assert.ok(data.victorianFiveBookDetails);assert.ok(bank.includes('Book details saved on this device; quote update failed. Please retry.'));
console.log('PASS actual front details save to matched quote, restore after activation and survive failed updates');

})().catch(e=>{console.error(e);process.exitCode=1});
