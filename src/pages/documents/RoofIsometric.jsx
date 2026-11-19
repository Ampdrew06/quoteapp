import React from 'react';
import {tilePreviewColour} from './tilePreviewColours';
import {buildRoofPlaneCoveringGeometry} from '../../lib/Calculations/roofPlaneCoveringGeometry';

// Approximate screen colours: product swatches can replace these without altering geometry.
const colours={'Titanium':'#696d72','Raven':'#383b40','Charcoal':'#45484a','Bramble Brown':'#62504b','Rustic Brown':'#785749','Rustic Terracotta':'#a26550','Rustic Red':'#994e42','Tartan Green':'#465d4c','Burnt Umber':'#705448','Antique Red':'#93594c','Iron Bark':'#66534d','Coal Black':'#303236','Scarlet':'#a44b42','Blister Brown':'#74574b','Forest Green':'#3d5949','Slate':'#646974','Ash':'#8a8d8d','Oak':'#796e60','Amethyst':'#696171','Sunset':'#9b6c58','Sunshine':'#ae9368','Pewter Grey':'#7b8085','Stone Black':'#3c4147','Red Rock':'#9d6555','Olive Green':'#69715a','Plum':'#6f5863','Brick Red':'#9d5b4e','Chestnut Brown':'#775a48','Mist Grey':'#92989a'};
const pt=(xMM,yMM)=>({xMM,yMM});
export function buildIllustrationSurface({family,geometry:g={},inputs:i={}}){
 const w=Number(g.widthMM??i.internalWidthMM??i.widthMM),p=Number(g.projectionMM??i.internalProjectionMM??i.projMM);
 if(!(w>0&&p>0))return {valid:false,facets:[]};
 let outline,facets,offsets;
 if(['victorian','victorian-five','victorian-hipped'].includes(family)){
  outline=g.internalOutline;facets=g.facets;
  offsets=outline?.map((a,n)=>{
   if(!g.externalOutline?.[n])return 0;
   const b=outline[(n+1)%outline.length],q=g.externalOutline[n],L=Math.hypot(b.xMM-a.xMM,b.yMM-a.yMM);
   return Math.max(0,(-(b.yMM-a.yMM)*(q.xMM-a.xMM)+(b.xMM-a.xMM)*(q.yMM-a.yMM))/L);
  });
 }else{
  outline=[pt(0,0),pt(0,p),pt(w,p),pt(w,0)];
  const pitch=Number(g.pitchDeg??g.frontPitchDeg??i.pitchDeg);
  const side=(id,n,pitchDeg)=>({id,start:outline[n],end:outline[n+1],internalLengthMM:n===1?w:p,pitchDeg});
  const hip=family==='lean-to'&&i.roofStyle==='hippedLeanTo';
  facets=family==='gable'?[side('left',0,pitch),side('right',2,pitch)]:
   family==='edwardian'?[side('left',0,pitch),side('front',1,g.frontPitchDeg),side('right',2,pitch)]:
   hip?[...(g.hasLeftHip?[side('left',0,g.leftSidePitchDeg)]:[]),side('front',1,g.frontPitchDeg),...(g.hasRightHip?[side('right',2,g.rightSidePitchDeg)]:[])]:
   [side('front',1,pitch)];
  offsets=family==='edwardian'?[g.externalLeftMM,g.externalFrontMM,g.externalRightMM,0]:
   family==='gable'?[g.feet?.[0]?.hfcMM,g.externalProjectionMM-p,g.feet?.[1]?.hfcMM,0]:
   hip?[g.leftFacet?.ringBeam?.baseWidthMM??0,g.frontFacet?.ringBeam?.baseWidthMM??0,g.rightFacet?.ringBeam?.baseWidthMM??0,0]:[0,0,0,0];
 }
 if(!outline||!facets)return {valid:false,facets:[]};
 const result=buildRoofPlaneCoveringGeometry({internalOutline:outline,facets,offsetsMM:offsets.map(v=>Math.max(0,Number(v)||0))});
 if(!result.valid)return result;
 return {...result,facets:result.facets.map(face=>{
  const f=facets.find(f=>f.id===face.id),L=f.internalLengthMM,ux=(f.end.xMM-f.start.xMM)/L,uy=(f.end.yMM-f.start.yMM)/L,tan=Math.tan(f.pitchDeg*Math.PI/180);
  const local=(u,v)=>({x:f.start.xMM+ux*u+uy*v,y:f.start.yMM+uy*u-ux*v,z:tan*v});
  const uv=face.points.map(q=>({u:(q.xMM-f.start.xMM)*ux+(q.yMM-f.start.yMM)*uy,v:(q.xMM-f.start.xMM)*uy-(q.yMM-f.start.yMM)*ux}));
  return {...face,local,uv,vertices:uv.map(q=>local(q.u,q.v))};
 })};
}
const project=p=>({x:.86*p.x-.65*p.y,y:.28*p.x+.4*p.y-p.z});
const shade=(hex,factor)=>'#'+hex.slice(1).match(/../g).map(v=>Math.max(0,Math.min(255,Math.round(parseInt(v,16)*factor))).toString(16).padStart(2,'0')).join('');
export default function RoofIsometric({family,geometry,inputs,roofVentLayout}){
 const surface=buildIllustrationSurface({family,geometry,inputs});
 if(!surface.valid)return null;
 const colour=inputs.tileColour??inputs.tileColor??inputs.tile_color;
 const fill=tilePreviewColour(inputs,colours[colour]??'#676b70');
 const fascia=/anthracite|black/i.test(inputs.fasciaColour??inputs.plastics_color??inputs.plasticsColor??'')?'#484b4e':/wood|oak|brown/i.test(inputs.fasciaColour??'')?'#77614d':'#eeeeeb';
 const all=surface.facets.flatMap(f=>f.vertices.flatMap(v=>[project(v),project({...v,z:v.z-100})]));
 const minX=Math.min(...all.map(p=>p.x)),maxX=Math.max(...all.map(p=>p.x)),minY=Math.min(...all.map(p=>p.y)),maxY=Math.max(...all.map(p=>p.y));
 const scale=Math.min(440/(maxX-minX),225/(maxY-minY));
 const mapped=p=>{const q=project(p);return {x:240+(q.x-(minX+maxX)/2)*scale,y:123+(q.y-(minY+maxY)/2)*scale};};
 const poly=points=>points.map(p=>{const q=mapped(p);return q.x+','+q.y;}).join(' ');
 const segment=(f,a,b,key)=><line key={key} x1={mapped(f.local(a.u,a.v)).x} y1={mapped(f.local(a.u,a.v)).y} x2={mapped(f.local(b.u,b.v)).x} y2={mapped(f.local(b.u,b.v)).y} stroke="#111" strokeOpacity=".24" strokeWidth=".55"/>;
 const faces=[...surface.facets].sort((a,b)=>a.vertices.reduce((n,v)=>n+v.x+v.y,0)/a.vertices.length-b.vertices.reduce((n,v)=>n+v.x+v.y,0)/b.vertices.length);
 return <figure className="rd-isometric"><svg viewBox="0 0 480 275" role="img" aria-label={'Illustrative isometric roof preview — '+(colour??'tile colour')}>
  {faces.map((f,index)=>{
   const clip='roof-illustration-'+index;
   const minU=Math.min(...f.uv.map(q=>q.u)),maxU=Math.max(...f.uv.map(q=>q.u)),minV=Math.min(...f.uv.map(q=>q.v)),maxV=Math.max(...f.uv.map(q=>q.v));
   const slate=/slate|tapco/i.test(inputs.tileProductId??inputs.tileSystem??inputs.tile_system??'');
   const gauge=(slate?190:250)*Math.cos(f.pitchDeg*Math.PI/180),tileWidth=slate?300:250;
   const lines=[];
   for(let v=Math.floor(minV/gauge)*gauge,row=0;v<=maxV;v+=gauge,row++){
    lines.push(segment(f,{u:minU,v},{u:maxU,v},'course'+row));
    for(let u=Math.floor(minU/tileWidth)*tileWidth+(row%2)*tileWidth/2;u<maxU;u+=tileWidth)
     lines.push(segment(f,{u,v},{u,v:Math.min(v+gauge,maxV)},row+':'+u));
   }
   const vents=f.id==='front' ? roofVentLayout?.openings ?? [] : [];
   const projection=Number(geometry?.projectionMM??inputs.internalProjectionMM??inputs.projMM);
   return <g key={f.id}>
    {f.vertices.map((a,n)=>{const b=f.vertices[(n+1)%f.vertices.length];return <polygon key={n} points={poly([a,b,{...b,z:b.z-90},{...a,z:a.z-90}])} fill={fascia} stroke="#555" strokeWidth=".5"/>;})}
    <defs><clipPath id={clip}><polygon points={poly(f.vertices)}/></clipPath></defs>
    <polygon points={poly(f.vertices)} fill={shade(fill,.86+index*.05)} stroke="#333" strokeWidth="1"/>
    <g clipPath={`url(#${clip})`}>
     {lines}
     {vents.map(vent=>{
      const left=vent.xMM,right=left+vent.widthMM,top=projection-vent.planYMM,bottom=top-vent.planHeightMM;
      const inset=14;
      return <g key={vent.id} aria-label={`Roof vent ${vent.widthMM} × ${vent.heightMM} mm`}>
       <polygon points={poly([f.local(left,bottom),f.local(right,bottom),f.local(right,top),f.local(left,top)])}
        fill="#263746" stroke="#182630" strokeWidth="1.3"/>
       <polygon points={poly([f.local(left+inset,bottom+inset),f.local(right-inset,bottom+inset),f.local(right-inset,top-inset),f.local(left+inset,top-inset)])}
        fill="#9dbed4" stroke="#d0e4ed" strokeWidth=".7"/>
      </g>;
     })}
    </g>
   </g>;
  })}
 </svg><figcaption>Illustrative roof view · colours approximate</figcaption></figure>;
}
