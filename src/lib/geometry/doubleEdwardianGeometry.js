import {buildDoubleEdwardianMembers} from './doubleEdwardianMembers';
import {computeLeanToManufactureGeometry} from '../leanToManufactureGeometry';
export const doubleEdwardianDefaults={widthMM:'',projMM:'',pitchDeg:25,soffitMM:150,frameThicknessMM:70};
// Plan datums: y=0 is the house-facing edge of the valley plate.
// The plate occupies the first 63mm (existing Lean-To specification) within IP.
export function buildDoubleEdwardianGeometry(inputs={}){
 const frame=Number(inputs.frameThicknessMM??70);
 const w=Number(inputs.widthMM),p=Number(inputs.projMM),pitch=Number(inputs.pitchDeg),soffit=Number(inputs.soffitMM);
 if(!(w>0&&p>0&&pitch>0&&pitch<75&&soffit>=0)||!(frame>0)||![w,p,pitch,soffit,frame].every(Number.isFinite))return {valid:false,error:'Enter positive width and projection, a pitch between 0° and 75°, and a non-negative soffit.'};
 const lean=computeLeanToManufactureGeometry({internalProjectionMM:p,pitchDeg:pitch,soffitDepthMM:soffit,frameThicknessMM:frame});
 const plate=lean.wallplateThicknessMM;
 if(Math.min(w,p)<=plate*2)return {valid:false,error:'Dimensions are too small for the valley plate and roof.'};
 const point=(x,y)=>({x,y}),d=Math.min(w,p)/2;
 const a=point(d,d),b=w>=p?point(w-d,d):point(d,p-d);
 const corners=[point(0,0),point(w,0),point(w,p),point(0,p)];
 const ridgeForCorner=w>=p?[a,b,b,a]:[a,a,b,b];
 const facets=[{name:'Rear / valley',lengthMM:w,vertices:[corners[0],corners[1],w>=p?b:a,a]},{name:'Right',lengthMM:p,vertices:[corners[1],corners[2],b,w>=p?b:a]},{name:'Front',lengthMM:w,vertices:[corners[2],corners[3],w>=p?a:b,b]},{name:'Left',lengthMM:p,vertices:[corners[3],corners[0],a,w>=p?a:b]}];
 const extension=frame+soffit;
 const geometry={valid:true,frameMM:frame,widthMM:w,projectionMM:p,pitchDeg:pitch,soffitMM:soffit,plateThicknessMM:plate,externalWidthMM:w+2*extension,externalProjectionMM:p+extension,extensionMM:extension,ridge:[a,b],ridgeLengthMM:Math.abs(w-p),ridgeOrientation:w===p?'Point apex':w>p?'Parallel to front / rear':'Parallel to sides',riseMM:d*Math.tan(pitch*Math.PI/180),corners,hips:corners.map((c,i)=>[c,ridgeForCorner[i]]),facets};
 const layout=buildDoubleEdwardianMembers(geometry,inputs.memberPositionsMM||{});
 return {...geometry,layout,valid:layout.valid,error:layout.errors.join(' ')};
}
