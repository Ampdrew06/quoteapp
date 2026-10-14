import React from 'react';

// Presentation only: dimensions come from the accepted Lean-To manufacture geometry.
// These drawings never feed the material audit, ordering, pricing or roof geometry.
function Dimension({ x1, y1, x2, y2, label, vertical = false }) {
  const x = (x1 + x2) / 2;
  const y = (y1 + y2) / 2;
  return <g stroke="#64748b" strokeWidth="1">
    <line x1={x1} y1={y1} x2={x2} y2={y2}/>
    <path d={vertical ? `M${x1-5},${y1}h10 M${x2-5},${y2}h10` : `M${x1},${y1-5}v10 M${x2},${y2-5}v10`}/>
    <text x={x} y={y-5} transform={vertical ? `rotate(-90 ${x} ${y})` : undefined} stroke="none" fill="#111827" textAnchor="middle" fontSize="16" fontWeight="700">{label}</text>
  </g>;
}

function Strip({ length, depth, quantity, label }) {
  return <svg viewBox="0 0 800 150" role="img" aria-label={label} style={{display:'block',width:'100%',height:'34mm',fontFamily:'Arial,sans-serif'}}>
    <rect x="95" y="53" width="610" height="48" fill="none" stroke="#111827" strokeWidth="2"/>
    <Dimension x1={95} y1={29} x2={705} y2={29} label={`${Math.round(length)} mm`}/>
    <path d="M95,29V50 M705,29V50 M72,53H92 M72,101H92" fill="none" stroke="#94a3b8"/>
    <Dimension x1={72} y1={53} x2={72} y2={101} label={`${depth} mm`} vertical/>
    <text x="400" y="84" textAnchor="middle" fontSize="16" fontWeight="700">×{quantity}</text>
    <text x="103" y="124" fill="#dc2626" fontSize="16" fontWeight="700">90°</text>
    <text x="697" y="124" textAnchor="end" fill="#dc2626" fontSize="16" fontWeight="700">90°</text>
  </svg>;
}

function Card({title, children}) {
  return <div style={{border:'1px solid #cbd5e1',borderRadius:6,padding:8,breakInside:'avoid'}}>
    <h3 style={{fontSize:12,margin:'0 0 4px',fontWeight:700}}>{title}</h3>{children}
  </div>;
}

export default function ManufacturingLeanToWallplate({lengthMM, manufactureRef, geometry}) {
  if (!(lengthMM > 0)) return null;
  return <section className="pm-page pm-leanto-wallplate-page">
    <div style={{height:'100%',boxSizing:'border-box',padding:'4mm',background:'#fff',border:'1px solid #cbd5e1',borderRadius:8}}>
      <h2 style={{fontSize:16,margin:'0 0 10px',fontWeight:800}}>Wallplate</h2>
      <div style={{display:'grid',gap:10}}>
        <Card title={`P${manufactureRef} · Straight wallplate · ×1`}>
          <Strip length={lengthMM} depth={geometry.rafterDepthMM} quantity={1} label="Straight 220mm wallplate with square end cuts"/>
        </Card>
        <Card title="18mm plywood infill · front and back · ×2">
          <Strip length={lengthMM} depth={143} quantity={2} label="Two straight 18mm plywood infills"/>
        </Card>
        <Card title="9mm plywood front faceplate · split to suit 2400mm sheets">
          <Strip length={lengthMM} depth={220} quantity={1} label="Front faceplate total assembled length"/>
        </Card>
        <Card title="9mm rear packers · retain current assembly · maximum 800mm centres">
          <svg viewBox="0 0 800 165" role="img" aria-label="Rear packer 50 by 220mm and current 63mm assembly thickness" style={{display:'block',width:'100%',height:'38mm',fontFamily:'Arial,sans-serif'}}>
            <rect x="140" y="44" width="40" height="85" fill="none" stroke="#111827" strokeWidth="2"/>
            <Dimension x1={140} y1={24} x2={180} y2={24} label="50 mm"/>
            <Dimension x1={115} y1={44} x2={115} y2={129} label="220 mm" vertical/>
            <text x="160" y="154" textAnchor="middle" fontSize="14">Rear packer</text>
            <rect x="440" y="44" width="18" height="85" fill="none" stroke="#111827" strokeWidth="2"/>
            <rect x="458" y="44" width="90" height="85" fill="none" stroke="#111827" strokeWidth="2"/>
            <rect x="548" y="44" width="18" height="85" fill="none" stroke="#111827" strokeWidth="2"/>
            <Dimension x1={440} y1={24} x2={566} y2={24} label={`${geometry.wallplateThicknessMM} mm`}/>
            <text x="425" y="89" textAnchor="end" fontSize="14">Front · 9mm</text>
            <text x="503" y="89" textAnchor="middle" fontSize="14">45mm</text>
            <text x="582" y="89" fontSize="14">9mm · Rear</text>
            <text x="503" y="154" textAnchor="middle" fontSize="14">Assembly thickness at packer</text>
          </svg>
        </Card>
      </div>
    </div>
  </section>;
}
