import React from 'react';
const mm=v=>Number(v).toFixed(1);
export default function TrussAssembly({truss:t,count,styleName="Edwardian"}){
 const maxY=t.apexTop.yMM,minX=Math.min(...t.members.flatMap(m=>m.points.map(p=>p.xMM))),maxX=Math.max(...t.members.flatMap(m=>m.points.map(p=>p.xMM))),scale=Math.min(880/(maxX-minX),320/maxY);
 const map=points=>points.map(p=>`${60+(p.xMM-minX)*scale},${55+(maxY-p.yMM)*scale}`).join(' ');
 return <svg viewBox="0 0 1000 450" role="img" aria-label={`${styleName} truss assembly`} style={{fontFamily:'Arial,sans-serif'}}><text x="500" y="27" textAnchor="middle" fontSize="24">{count} assembled trusses — terminal carries boss and hips</text>{t.members.map(m=><polygon key={m.side} points={map(m.points)} fill="#e7c994" stroke="#111827" strokeWidth="2"/>)}<polygon points={map(t.gusset.points)} fill="#dbeafe" fillOpacity="0.65" stroke="#2563eb" strokeWidth="2"/><polygon points={map(t.chevron.points)} fill="none" stroke="#0f766e" strokeWidth="2"/><polygon points={map(t.closure.points)} fill="#94a3b8" stroke="#111827" strokeWidth="2"/><text x="500" y="425" textAnchor="middle" fontSize="22">Internal width {mm(t.widthMM)}mm · 595mm closure / gusset bottom</text></svg>;
}
