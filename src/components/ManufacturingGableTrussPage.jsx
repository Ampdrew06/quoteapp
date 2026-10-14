import React from 'react';

// Workshop presentation only: use the existing resolved manufacturing polygons.
export function WorkshopShape({points,title,showAngles=true,cutPitch,footPitch=cutPitch,compact=false}) {
  const minX=Math.min(...points.map(p=>p.xMM)),maxX=Math.max(...points.map(p=>p.xMM));
  const minY=Math.min(...points.map(p=>p.yMM)),maxY=Math.max(...points.map(p=>p.yMM));
  const scale=Math.min(550/Math.max(1,maxX-minX),135/Math.max(1,maxY-minY));
  const map=p=>({x:105+(p.xMM-minX)*scale,y:55+(maxY-p.yMM)*scale});
  const signed=points.reduce((n,p,i)=>{const q=points[(i+1)%points.length];return n+p.xMM*q.yMM-q.xMM*p.yMM;},0);
  return <svg viewBox="0 0 760 255" role="img" aria-label={title} style={{fontFamily:'Arial,sans-serif'}}>
    <polygon points={points.map(p=>{const q=map(p);return `${q.x},${q.y}`;}).join(' ')} fill="none" stroke="#111827" strokeWidth="2"/>
    {cutPitch!=null&&<><text x={compact?660:110} y="243" textAnchor={compact?'end':'start'} fontSize={compact?19:14} fontWeight="700" fill="#dc2626">Foot cut: {footPitch.toFixed(1)}°</text><text x={compact?105:660} y="25" textAnchor={compact?'start':'end'} fontSize={compact?19:14} fontWeight="700" fill="#dc2626">{compact?'Top cut':'Apex'}: {cutPitch.toFixed(1)}° off square</text></>}
    {points.map((p,i)=>{
      const next=points[(i+1)%points.length],prev=points[(i+points.length-1)%points.length];
      const a=map(p),b=map(next),dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1;
      const sign=signed>0?1:-1,nx=-dy/length*20*sign,ny=dx/length*20*sign;
      const x=(a.x+b.x)/2+nx,y=(a.y+b.y)/2+ny;
      let rotation=Math.atan2(dy,dx)*180/Math.PI;if(rotation>90)rotation-=180;if(rotation<-90)rotation+=180;
      const ux=prev.xMM-p.xMM,uy=prev.yMM-p.yMM,vx=next.xMM-p.xMM,vy=next.yMM-p.yMM;
      let angle=Math.acos(Math.max(-1,Math.min(1,(ux*vx+uy*vy)/(Math.hypot(ux,uy)*Math.hypot(vx,vy)||1))))*180/Math.PI;
      if((ux*vy-uy*vx)*signed>0)angle=360-angle;
      return <g key={i}>
        <path d={`M${a.x},${a.y}L${a.x+nx*1.2},${a.y+ny*1.2} M${b.x},${b.y}L${b.x+nx*1.2},${b.y+ny*1.2} M${a.x+nx},${a.y+ny}L${b.x+nx},${b.y+ny}`} fill="none" stroke="#94a3b8"/>
        <text x={x} y={y-4} transform={`rotate(${rotation} ${x} ${y})`} textAnchor="middle" fontSize={compact?20:14} fontWeight="700">{Math.hypot(next.xMM-p.xMM,next.yMM-p.yMM).toFixed(1)}{!compact||Math.hypot(next.xMM-p.xMM,next.yMM-p.yMM)>=500?' mm':''}</text>
        {showAngles&&<text x={a.x+(a.x<380?10:-10)} y={a.y+16} textAnchor={a.x<380?'start':'end'} fontSize="13" fontWeight="700" fill="#dc2626">{angle.toFixed(1)}°</text>}
      </g>;
    })}
  </svg>;
}

function Card({title,points,cutPitch}) {return <div className="gt-card"><h3>{title}</h3><WorkshopShape title={title} points={points} showAngles={cutPitch==null} cutPitch={cutPitch}/></div>;}
export default function ManufacturingGableTrussPage({schedule:s,assemblyNotes}) {
  const j=s.geometry.truss;
  return <section className="gm-page gt-page"><h2>Truss manufacture</h2>
    <div className="gt-members">{s.members.map(f=><Card key={f.side} title={`${f.side==='left'?'Left':'Right'} member · ×${s.trusses.length}`} points={f.points} cutPitch={s.geometry.pitchDeg}/>)}</div>
    <div className="gt-joints">
      <Card title={`18mm chevrons · ×${s.componentCounts.chevrons}`} points={j.chevron.points}/>
      <Card title={`9mm gussets · ${s.componentCounts.gussets} joint faces`} points={j.gusset.points}/>
      <Card title={`45mm rafter-offcut closures · ×${s.componentCounts.closures}`} points={j.closure.points}/>
    </div>
    <p>Dimensions are cut edge lengths. Red values on joint pieces are included corner angles; member labels give saw settings. Apex saw setting {s.geometry.pitchDeg.toFixed(1)}° off square. 220mm joists with current 45mm flanges. Glue and fix closures using the established workshop method.</p>
    <p>{assemblyNotes || 'Rear truss: 9mm faceplate and wall packers. Intermediate trusses: PIR cradles on both faces. End trusses: inward faces only. Front outer face is detailed on the following page.'}</p>
    <style>{`.gt-page .gt-card{border:1px solid #cbd5e1;border-radius:6px;padding:8px;break-inside:avoid}.gt-page .gt-card h3{font-size:12px;margin:0 0 3px}.gt-members{display:grid;gap:8px}.gt-members svg{height:48mm!important}.gt-joints{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px}.gt-joints svg{height:46mm!important}.gt-joints .gt-card:last-child{grid-column:1/-1}.gt-joints .gt-card:last-child svg{height:32mm!important}`}</style>
  </section>;
}
