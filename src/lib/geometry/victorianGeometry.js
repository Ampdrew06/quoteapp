import {buildEdwardianGeometry} from './edwardianGeometry';
const rad=d=>d*Math.PI/180;
const length=(a,b)=>Math.hypot(b.xMM-a.xMM,b.yMM-a.yMM);

// Plan geometry only. No timber terminal deductions, cut lengths or pricing.
export function buildVictorianGeometry({inputs={},materials={}}={}) {
  const fail=message=>({valid:false,errors:[message]});
  const w=Number(inputs.widthMM),p=Number(inputs.projMM),pitch=Number(inputs.pitchDeg??25);
  const angles=inputs.cornerAnglesDeg??[135,135,135,135];
  if(!Array.isArray(angles)||angles.length!==4||angles.some(a=>!Number.isFinite(Number(a))||Number(a)<=90||Number(a)>=180))return fail('Four corner angles between 90° and 180° are required.');
  const turns=angles.map(a=>180-Number(a));
  if(Math.abs(turns.reduce((n,a)=>n+a,0)-180)>1e-6)return fail('The four corner angles must total 540° to retain parallel sides.');
  // Equal front facets; the final corner closes against the right side.
  let heading=90;const headings=turns.slice(0,3).map(turn=>{heading-=turn;return heading;});
  const advance=headings.reduce((n,a)=>n+Math.cos(rad(a)),0);
  if(!(w>0&&p>0&&advance>0))return fail('Enter positive width and projection.');
  const frontLengthMM=w/advance;
  let x=0,y=0;const front=[{xMM:x,yMM:y}];
  for(const a of headings){x+=frontLengthMM*Math.cos(rad(a));y+=frontLengthMM*Math.sin(rad(a));front.push({xMM:x,yMM:y});}
  const shift=p-Math.max(...front.map(a=>a.yMM));
  const corners=front.map(a=>({xMM:a.xMM,yMM:a.yMM+shift}));
  if(Math.min(corners[0].yMM,corners[3].yMM)<=0)return fail('The projection is too short for this Victorian front.');
  const inherited=buildEdwardianGeometry({inputs:{...inputs,ridgeMode:'automatic',maxFinishedHeightMM:''},materials});
  if(!inherited.valid)return fail(inherited.errors.join(' '));
  const soffitMode=inputs.soffitMode??(Number(inputs.soffitMM??150)===150?'standard':'specified');
  if(!['standard','specified'].includes(soffitMode))return fail('Choose standard board or specified envelope soffit mode.');
  const soffitMM=Number(inputs.soffitMM??150),frameMM=inherited.frameMM;
  const fasciaThicknessMM=Number(materials.fascia_thickness_mm??10);
  const fittingToleranceMM=Number(materials.ply_projection_allowance_mm??5);
  const stripTrimAllowanceMM=Number(materials.soffit_trim_allowance_mm??5);
  const plyBaseWidthMM=frameMM+soffitMM+(soffitMode==='standard'?fittingToleranceMM:-fasciaThicknessMM);
  if(![plyBaseWidthMM,fasciaThicknessMM,fittingToleranceMM,stripTrimAllowanceMM].every(Number.isFinite)||plyBaseWidthMM<=0||Math.min(fasciaThicknessMM,fittingToleranceMM,stripTrimAllowanceMM)<0)return fail('Valid soffit and ply-base allowances are required.');
  const soffitStripWidthMM=soffitMode==='standard'?soffitMM:Math.max(0,soffitMM-fasciaThicknessMM-stripTrimAllowanceMM);
  const ridge=inherited.ridge;
  const internalOutline=[{xMM:0,yMM:0},...corners,{xMM:w,yMM:0}];
  const names=['Left side','Front left','Front centre','Front right','Right side','House wall'];
  const offset=(a,b,i)=>{
    const dx=b.xMM-a.xMM,dy=b.yMM-a.yMM,l=Math.hypot(dx,dy),nx=-dy/l,ny=dx/l;
    const d=i===5?0:plyBaseWidthMM;
    return {nx,ny,c:nx*a.xMM+ny*a.yMM+d};
  };
  const lines=internalOutline.map((a,i)=>offset(a,internalOutline[(i+1)%6],i));
  const externalOutline=lines.map((b,i)=>{
    const a=lines[(i+5)%6],det=a.nx*b.ny-b.nx*a.ny;
    return {xMM:(a.c*b.ny-b.c*a.ny)/det,yMM:(a.nx*b.c-b.nx*a.c)/det};
  });
  const facets=internalOutline.slice(0,5).map((start,i)=>{
    const end=internalOutline[i+1],dx=end.xMM-start.xMM,dy=end.yMM-start.yMM,l=length(start,end);
    const distance=Math.abs(dx*(ridge.yMM-start.yMM)-dy*(ridge.xMM-start.xMM))/l;
    return {id:`facet-${i+1}`,label:names[i],start,end,internalLengthMM:l,externalLengthMM:length(externalOutline[i],externalOutline[i+1]),pitchDeg:Math.atan2(inherited.riseMM,distance)*180/Math.PI,planRunMM:distance};
  });
  const hips=corners.map((end,i)=>({id:`H${i+1}`,start:ridge,end,planLengthMM:length(ridge,end),pitchDeg:Math.atan2(inherited.riseMM,length(ridge,end))*180/Math.PI}));
  const intermediateBars=[],jackRafters=[];
  // Intersect an upslope line with the two hips bounding a facet.
  const jack=(f,t,id)=>{
    const end={xMM:f.start.xMM+(f.end.xMM-f.start.xMM)*t,yMM:f.start.yMM+(f.end.yMM-f.start.yMM)*t};
    const dx=(f.end.yMM-f.start.yMM)/f.internalLengthMM,dy=-(f.end.xMM-f.start.xMM)/f.internalLengthMM;
    const hits=[f.start,f.end].map(c=>{
      const vx=c.xMM-ridge.xMM,vy=c.yMM-ridge.yMM,det=dx*vy-dy*vx;
      if(Math.abs(det)<1e-9)return null;
      const qx=ridge.xMM-end.xMM,qy=ridge.yMM-end.yMM;
      const u=(qx*vy-qy*vx)/det,v=(qx*dy-qy*dx)/det;
      return u>0&&v>=-1e-8&&v<=1+1e-8?{u,start:{xMM:end.xMM+u*dx,yMM:end.yMM+u*dy}}:null;
    }).filter(Boolean).sort((a,b)=>a.u-b.u);
    return hits.length?{id,start:hits[0].start,end,facetId:f.id,positionMM:t*f.internalLengthMM}:null;
  };
  facets.slice(1,4).forEach((f,i)=>{
    if(f.internalLengthMM<=750+1e-7)return;
    if(f.internalLengthMM<=1500+1e-7)intermediateBars.push({id:`R${i+1}`,facetId:f.id,positionMM:f.internalLengthMM/2,start:ridge,end:{xMM:(f.start.xMM+f.end.xMM)/2,yMM:(f.start.yMM+f.end.yMM)/2}});
    else {const bays=Math.ceil((f.internalLengthMM-1e-7)/750);for(let n=1;n<bays;n++){const r=jack(f,n/bays,`J${i+1}.${n}`);if(r)jackRafters.push(r);}}
  });
  const centresMM=[31.5];
  for(let y=697;y<inherited.terminalTrussCentreMM-48;y+=665)centresMM.push(y);
  if(inherited.terminalTrussCentreMM>centresMM[0]+48)centresMM.push(inherited.terminalTrussCentreMM);
  else return fail('Insufficient room for the rear and boss trusses.');
  const layout={...inherited.layout,centresMM,trussCount:centresMM.length};
  [facets[0],facets[4]].forEach((f,i)=>{
    const shoulder=i===0?f.end.yMM:f.start.yMM;
    const run=shoulder-inherited.terminalTrussCentreMM,bays=run<=750+1e-7?1:Math.ceil(run/665);
    for(let n=1;n<bays;n++){
      const y=inherited.terminalTrussCentreMM+run*n/bays;
      const t=i===0?y/f.internalLengthMM:1-y/f.internalLengthMM;
      const r=jack(f,t,`JS${i+1}.${jackRafters.length+1}`);if(r)jackRafters.push(r);
    }
  });
  const minimumY=Math.min(corners[0].yMM,corners[3].yMM);
  if(ridge.yMM>=minimumY)return fail('The ridge must sit behind the two side-to-front corners. Review the angles or projection.');
  return {valid:true,errors:[],adjustedAngles:angles.some(a=>Math.abs(Number(a)-135)>1e-8),style:'Victorian 3-facet',widthMM:w,projectionMM:p,pitchDeg:pitch,frameMM:inherited.frameMM,soffitMM,soffitMode,plyBaseWidthMM,fasciaThicknessMM,fittingToleranceMM,stripTrimAllowanceMM,soffitStripWidthMM,
    cornerAnglesDeg:angles.map(Number),mitresDeg:turns.map(a=>a/2),frontLengthMM,internalOutline,externalOutline,facets,hips,intermediateBars,jackRafters,
    ridge,ridgeEndYMM:ridge.yMM,terminalTrussCentreMM:inherited.terminalTrussCentreMM,layout,riseMM:inherited.riseMM,
    externalWidthMM:Math.max(...externalOutline.map(a=>a.xMM))-Math.min(...externalOutline.map(a=>a.xMM)),externalProjectionMM:Math.max(...externalOutline.map(a=>a.yMM)),
    nominalExternalProjectionMM:p+frameMM+soffitMM,frontManufacturingAllowanceMM:soffitMode==='standard'?fittingToleranceMM:-fasciaThicknessMM,
    nominalFootRunMM:frameMM+soffitMM};
}
