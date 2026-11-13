export const valleyOutletCount = inputs => inputs?.valleyOutlets==='none'?0: ['left','right'].includes(inputs?.valleyOutlets)?1:2;
// Stock allowances for estimating only. They are not lap or outlet dimensions.
export const valleySurfaces={bungalow:'Bungalow roof',wall:'Sheer wall',flat:'Flat roof'};
export const epdmStockMM=[3050,3600,4570,6100];
export const epdmDefaultAllowanceMM={single:350,joined:850};
const allowance=(value,fallback)=>value==null||value===''?fallback:Number(value);

function selectStrips(width,single,joined){
 const one=epdmStockMM.find(length=>length>=width+single);
 if(one)return [one];
 const target=Math.ceil((width+Math.max(single,joined))/10), lengths=epdmStockMM.map(length=>length/10);
 const best=new Array(target+lengths.at(-1)).fill(null);
 best[0]=[];
 for(let length=0;length<best.length;length++){
  const strips=best[length];
  if(!strips)continue;
  if(length>=target&&strips.length>=2)return strips.sort((a,b)=>b-a);
  for(const stock of lengths){
   const next=length+stock;
   if(next<best.length&&(!best[next]||best[next].length>strips.length+1))best[next]=[...strips,stock*10];
  }
 }
 return [];
}

export function buildDoubleEdwardianValleyOrder(g,inputs={}){
 const surface=inputs.valleySurface,finish=inputs.valleyFinish;
 if(!g?.valid||!Object.prototype.hasOwnProperty.call(valleySurfaces,surface))return null;
 const width=g.externalWidthMM;
 const runsMM=surface==='bungalow'?[width,width+500]:[width];
 // Four nominal 280 mm strips across each standard 2400 × 1200 mm sheet.
 const stripCount=runsMM.reduce((sum,length)=>sum+Math.ceil(length/2400),0);
 const sheets=Math.ceil(stripCount/4);
 const result={surface,finish,runsMM,stripCount,sheets,epdm:[],totalMM:0,excessMM:0};
 if(finish!=='epdm')return result;
 const single=allowance(inputs.valleySingleAllowanceMM,epdmDefaultAllowanceMM.single),joined=allowance(inputs.valleyJoinedAllowanceMM,epdmDefaultAllowanceMM.joined);
 if([single,joined].some(n=>!Number.isFinite(n)||n<0||n>5000)||width>100000)return {...result,error:'Use EPDM stock allowances from 0 to 5,000 mm and a valley width of no more than 100,000 mm for automatic stock selection.'};
 const strips=selectStrips(width,single,joined);
 const totalMM=strips.reduce((sum,length)=>sum+length,0);
 return {...result,totalMM,excessMM:totalMM-width,epdm:epdmStockMM.map(length=>({length,qty:strips.filter(s=>s===length).length})).filter(row=>row.qty>0)};
}
