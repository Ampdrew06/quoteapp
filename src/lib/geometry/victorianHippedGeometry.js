// Standard symmetric 135-degree perimeter, two rear bosses and four hips.
// Frame-datum geometry only: timber cut deductions, vents, glazing and pricing
// are deliberately not inferred from the non-standard reference order.
const point=(xMM,yMM)=>({xMM,yMM});
const length=(a,b)=>Math.hypot(a.xMM-b.xMM,a.yMM-b.yMM);
export const victorianHippedDefaults={widthMM:7300,projMM:3370,cornerInsetMM:1135,bossInsetMM:2210,pitchDeg:17,frameThicknessMM:70,soffitMM:150,soffitMode:'standard'};
export function buildVictorianHippedGeometry({inputs={},materials={}}={}){
 const fail=message=>({valid:false,errors:[message]});
 const w=Number(inputs.widthMM),p=Number(inputs.projMM),c=Number(inputs.cornerInsetMM),pitch=Number(inputs.pitchDeg??17),b=Number(inputs.bossInsetMM),frame=Number(inputs.frameThicknessMM??70),soffit=Number(inputs.soffitMM??150),mode=inputs.soffitMode??'standard';
 if(![w,p,c,pitch,b,frame,soffit].every(Number.isFinite))return fail('Enter finite dimensions and pitch.');
 if(w<=0||p<=0||c<=0||c>=p||2*c>=w)return fail('The corner inset must be positive and smaller than the projection and half the width.');
 if(b<=0||2*b>=w)return fail('Each boss must sit inside the width with a positive horizontal wallplate between the bosses.');
 if(pitch<=0||pitch>=60||frame<0||soffit<0)return fail('Use a front pitch above 0° and below 60°, with non-negative frame and soffit dimensions.');
 if(!['standard','specified'].includes(mode))return fail('Choose standard board or specified envelope soffit.');
 if(inputs.cornerAnglesDeg&&(!Array.isArray(inputs.cornerAnglesDeg)||inputs.cornerAnglesDeg.length!==4||inputs.cornerAnglesDeg.some(a=>Number(a)!==135)))return fail('This first preview supports four fixed 135° corners.');
 const fascia=Number(materials.fascia_thickness_mm??10),tolerance=Number(materials.ply_projection_allowance_mm??5),d=frame+soffit+(mode==='standard'?tolerance:-fascia);
 if(![fascia,tolerance,d].every(Number.isFinite)||fascia<0||tolerance<0||d<=0)return fail('The ply-base width must be positive with valid fascia and fitting allowances.');
 const outline=[point(0,0),point(0,p-c),point(c,p),point(w-c,p),point(w,p-c),point(w,0)],bosses=[{id:'BL',...point(b,0)},{id:'BR',...point(w-b,0)}],rise=p*Math.tan(pitch*Math.PI/180);
 // Outward offset each eaves line; house-wall datum stays y=0.
 const lines=outline.map((a,i)=>{const end=outline[(i+1)%6],L=length(a,end),nx=-(end.yMM-a.yMM)/L,ny=(end.xMM-a.xMM)/L;return {nx,ny,c:nx*a.xMM+ny*a.yMM+(i===5?0:d)};});
 const external=lines.map((line,i)=>{const prev=lines[(i+5)%6],det=prev.nx*line.ny-line.nx*prev.ny;return point((prev.c*line.ny-line.c*prev.ny)/det,(prev.nx*line.c-line.nx*prev.c)/det);});
 const names=['Left side','Front left','Front centre','Front right','Right side'];
 const facets=outline.slice(0,5).map((start,i)=>{const end=outline[i+1],boss=bosses[i<=2?0:1],L=length(start,end),run=Math.abs((end.xMM-start.xMM)*(boss.yMM-start.yMM)-(end.yMM-start.yMM)*(boss.xMM-start.xMM))/L,facetPitch=Math.atan2(rise,run)*180/Math.PI;
 const polygon=i===2?[start,end,bosses[1],bosses[0]]:[start,end,boss];
 const area=Math.abs(polygon.reduce((n,a,k)=>{const e=polygon[(k+1)%polygon.length];return n+a.xMM*e.yMM-e.xMM*a.yMM;},0))/2;
 return {id:`F${i+1}`,label:names[i],start,end,bossIds:i===2?['BL','BR']:[boss.id],points:polygon,internalLengthMM:L,externalLengthMM:length(external[i],external[i+1]),planRunMM:run,pitchDeg:facetPitch,planAreaM2:area/1e6,slopeAreaM2:area/1e6/Math.cos(facetPitch*Math.PI/180)};
 });
 const hips=[outline[1],outline[2],outline[3],outline[4]].map((end,i)=>{const start=bosses[i<2?0:1],plan=length(start,end);return {id:`H${i+1}`,bossId:start.id,start,end,planLengthMM:plan,geometricSlopeMM:Math.hypot(plan,rise),pitchDeg:Math.atan2(rise,plan)*180/Math.PI};});
 return {valid:true,errors:[],style:'Victorian Hipped Lean-To',widthMM:w,projectionMM:p,cornerInsetMM:c,bossInsetMM:b,pitchDeg:pitch,riseMM:rise,frameMM:frame,soffitMM:soffit,soffitMode:mode,plyBaseWidthMM:d,fasciaThicknessMM:fascia,fittingToleranceMM:tolerance,cornerAnglesDeg:[135,135,135,135],mitresDeg:[22.5,22.5,22.5,22.5],internalOutline:outline,externalOutline:external,bosses,facets,hips,horizontalWallplateMM:w-2*b,externalWidthMM:w+2*d,externalProjectionMM:p+d,internalPlanAreaM2:(w*p-c*c)/1e6,internalSlopeAreaM2:facets.reduce((n,f)=>n+f.slopeAreaM2,0),wallplate:[{start:outline[0],end:bosses[0]},{start:bosses[0],end:bosses[1]},{start:bosses[1],end:outline[5]}]};
}
