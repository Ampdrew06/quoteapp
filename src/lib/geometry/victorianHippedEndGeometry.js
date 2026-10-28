import {resolveVictorianHippedFacetGeometry} from './victorianHippedFacetGeometry';
import {calculateWallplateBossGeometry} from './wallplateBossGeometry';
import {resolveVictorianHippedEaves} from './victorianHippedEaves';
import {buildVictorianHippedRafterLayout} from './victorianHippedRafterLayout';
const pt=(xMM,yMM)=>({xMM,yMM});
const dist=(a,b)=>Math.hypot(a.xMM-b.xMM,a.yMM-b.yMM);
const area=ps=>Math.abs(ps.reduce((s,a,i)=>{const b=ps[(i+1)%ps.length];return s+a.xMM*b.yMM-b.xMM*a.yMM;},0))/2;

// Mixed-end topology retains stable facet IDs and explicit perimeter-edge
// indices so layout and cutting adapters consume the same selected ends.
export function buildVictorianHippedEndGeometry({inputs={},materials={}}={}){
 const fail=message=>({valid:false,errors:[message]});
 const left=inputs.leftEndType??'victorian',right=inputs.rightEndType??'victorian';
 if(![left,right].every(v=>['victorian','edwardian','wall'].includes(v)))return fail('Choose Victorian, Edwardian or Against a wall for each end.');
 const w=Number(inputs.widthMM),p=Number(inputs.projMM),c=Number(inputs.cornerInsetMM??0),pitch=Number(inputs.pitchDeg??17),frame=Number(inputs.frameThicknessMM??70),soffit=Number(inputs.soffitMM??150),mode=inputs.soffitMode??'standard';
 if(![w,p,c,pitch,frame,soffit].every(Number.isFinite)||w<=0||p<=0||pitch<=0||pitch>=60||frame<0||soffit<0)return fail('Enter positive width/projection, pitch between 0° and 60°, and non-negative frame/soffit dimensions.');
 if(!['standard','specified'].includes(mode))return fail('Choose standard board or specified envelope soffit.');
 const facetGeometry=resolveVictorianHippedFacetGeometry({widthMM:w,projectionMM:p,cornerInsetMM:c,leftEndType:left,rightEndType:right,specification:inputs.facetGeometry});
 if(!facetGeometry.valid)return {valid:false,errors:facetGeometry.errors};
 const cl=facetGeometry.left.widthRunMM,cr=facetGeometry.right.widthRunMM,dl=facetGeometry.left.projectionRunMM,dr=facetGeometry.right.projectionRunMM;
 const rise=p*Math.tan(pitch*Math.PI/180),requested=inputs.requestedSidePitchDeg;
 const hasRequested=requested!==null&&requested!==undefined&&String(requested).trim()!=='';
 if(hasRequested&&(!Number.isFinite(Number(requested))||Number(requested)<=0||Number(requested)>=60))return fail('Use a side pitch above 0° and below 60°.');
 const joint=calculateWallplateBossGeometry({riseMM:rise,memberDepthMM:220,bossCentrePositionMM:inputs.bossInsetMM,requestedSidePitchDeg:hasRequested?requested:null});
 const active=(left!=='wall'?1:0)+(right!=='wall'?1:0),b=joint.bossCentrePositionMM;
 if(active&&(!joint.valid||b*active>=w))return fail('The selected ends need boss positions inside the width with a positive horizontal wallplate.');
 const fascia=Number(materials.fascia_thickness_mm??10),tolerance=Number(materials.ply_projection_allowance_mm??5),d=frame+soffit+(mode==='standard'?tolerance:-fascia);
 if(![fascia,tolerance,d].every(Number.isFinite)||fascia<0||tolerance<0||d<95)return fail('The ply base must accommodate the 95mm PSE.');
 const BL=left==='wall'?null:{id:'BL',...pt(b,0)},BR=right==='wall'?null:{id:'BR',...pt(w-b,0)};
 const rearLeft=BL||pt(0,0),rearRight=BR||pt(w,0),bosses=[BL,BR].filter(Boolean);
 const outline=[pt(0,0),pt(0,p-dl),...(cl?[pt(cl,p)]:[]),pt(w-cr,p),...(cr?[pt(w,p-dr)]:[]),pt(w,0)];
 const defs=[];
 const add=(id,label,edgeIndex,boss,kind)=>defs.push({id,label,edgeIndex,boss,kind});
 let edge=0;
 if(left!=='wall')add('F1','Facet 1',edge,BL,'side');edge++;
 if(cl){add('F2','Facet 2',edge,BL,'chamfer');edge++;}
 add('F3','Facet 3',edge,null,'front');edge++;
 if(cr){add('F4','Facet 4',edge,BR,'chamfer');edge++;}
 if(right!=='wall')add('F5','Facet 5',edge,BR,'side');
 const facets=defs.map(f=>{const start=outline[f.edgeIndex],end=outline[f.edgeIndex+1],L=dist(start,end),polygon=f.kind==='front'?[start,end,rearRight,rearLeft]:[start,end,f.boss],run=f.kind==='front'?p:Math.abs((end.xMM-start.xMM)*(f.boss.yMM-start.yMM)-(end.yMM-start.yMM)*(f.boss.xMM-start.xMM))/L,angle=Math.atan2(rise,run)*180/Math.PI;
 return {...f,start,end,points:polygon,bossIds:f.kind==='front'?bosses.map(v=>v.id):[f.boss.id],internalLengthMM:L,planRunMM:run,pitchDeg:angle,planAreaM2:area(polygon)/1e6,slopeAreaM2:area(polygon)/1e6/Math.cos(angle*Math.PI/180)};});
 const eaves=resolveVictorianHippedEaves({facets,frontPitchDeg:pitch,sidePitchDeg:joint.pitchDeg,frameMM:frame,soffitMM:soffit,soffitMode:mode,baseWidthMM:d,materials,sideSoffitMode:inputs.sideSoffitMode,sideSoffitControlSide:inputs.sideSoffitControlSide,specifiedSideSoffitMM:inputs.specifiedSideSoffitMM});if(!eaves.valid)return {valid:false,errors:eaves.errors};
 facets.forEach((f,i)=>{f.eaves=eaves.rows[i];f.plyBaseWidthMM=f.eaves.plyBaseWidthMM;});
 const lines=outline.map((a,i)=>{const end=outline[(i+1)%outline.length],L=dist(a,end),nx=-(end.yMM-a.yMM)/L,ny=(end.xMM-a.xMM)/L,f=facets.find(v=>v.edgeIndex===i);return {nx,ny,c:nx*a.xMM+ny*a.yMM+(f?.plyBaseWidthMM??0)};});
 const external=lines.map((line,i)=>{const prev=lines[(i+lines.length-1)%lines.length],det=prev.nx*line.ny-line.nx*prev.ny;return pt((prev.c*line.ny-line.c*prev.ny)/det,(prev.nx*line.c-line.nx*prev.c)/det);});
 facets.forEach(f=>{f.externalLengthMM=dist(external[f.edgeIndex],external[f.edgeIndex+1]);});
 const hips=[];
 const hip=(boss,end)=>{const plan=dist(boss,end);hips.push({id:`H${hips.length+1}`,bossId:boss.id,start:boss,end,planLengthMM:plan,geometricSlopeMM:Math.hypot(plan,rise),pitchDeg:Math.atan2(rise,plan)*180/Math.PI});};
 if(BL){hip(BL,pt(0,p-dl));if(cl)hip(BL,pt(cl,p));}
 if(BR){if(cr)hip(BR,pt(w-cr,p));hip(BR,pt(w,p-dr));}
 const mitresDeg=facets.slice(0,-1).map((f,i)=>{const next=facets[i+1],u={x:(f.end.xMM-f.start.xMM)/f.internalLengthMM,y:(f.end.yMM-f.start.yMM)/f.internalLengthMM},v={x:(next.end.xMM-next.start.xMM)/next.internalLengthMM,y:(next.end.yMM-next.start.yMM)/next.internalLengthMM};return Math.acos(Math.max(-1,Math.min(1,u.x*v.x+u.y*v.y)))*90/Math.PI;});
 const wallMembers=[];
 if(left==='wall')wallMembers.push({id:'WL',start:pt(0,0),end:pt(0,p),label:'Left wallbar — locked'});
 if(right==='wall')wallMembers.push({id:'WR',start:pt(w,0),end:pt(w,p),label:'Right wallbar — locked'});
 const geometry={valid:true,errors:[],style:'Victorian Hipped Lean-To',leftEndType:left,rightEndType:right,endConfigurationReviewRequired:false,facetGeometry,eaves,sidePitchDeg:joint.pitchDeg||0,wallplateJoint:joint,mitresDeg,cornerAnglesDeg:mitresDeg.map(a=>180-2*a),widthMM:w,projectionMM:p,cornerInsetMM:c,bossInsetMM:b||0,pitchDeg:pitch,riseMM:rise,frameMM:frame,soffitMM:eaves.effectiveReferenceSoffitMM??soffit,soffitMode:mode,plyBaseWidthMM:eaves.referenceBaseWidthMM??d,fasciaThicknessMM:fascia,fittingToleranceMM:tolerance,internalOutline:outline,externalOutline:external,bosses,facets,hips,wallMembers,horizontalWallplateMM:rearRight.xMM-rearLeft.xMM,externalWidthMM:Math.max(...external.map(q=>q.xMM))-Math.min(...external.map(q=>q.xMM)),externalProjectionMM:Math.max(...external.map(q=>q.yMM)),internalPlanAreaM2:area(outline)/1e6,internalSlopeAreaM2:facets.reduce((s,f)=>s+f.slopeAreaM2,0),wallplate:[{start:pt(0,0),end:rearLeft},{start:rearLeft,end:rearRight},{start:rearRight,end:pt(w,0)}].filter(v=>dist(v.start,v.end)>1e-6)};
 const layout=buildVictorianHippedRafterLayout({geometry,positionsByFacet:inputs.victorianHippedFacetPositionsMM,materials});
 return {...geometry,valid:layout.valid,errors:layout.errors,rafterLayout:layout};
}
