import React from 'react';
const mm = value => Number(value).toFixed(1).replace(/\.0$/, '');
const cell = { border: '1px solid #cbd5e1', padding: '7px', fontSize: 14 };
function Strip({ lengthMM, widthMM, label }) {
  return <svg viewBox="0 0 700 125" style={{ width: '100%', maxHeight: 125 }} aria-label={label}>
    <rect x="100" y="38" width="470" height="45" fill="#eff6ff" stroke="#334155" strokeWidth="2" />
    <path d="M100 28 V15 H570 V28 M580 38 H605 V83 H580" fill="none" stroke="#334155" />
    <text x="335" y="12" textAnchor="middle" fontSize="18">{mm(lengthMM)} mm</text>
    <text x="615" y="64" fontSize="18">{mm(widthMM)} mm</text>
    <text x="335" y="112" textAnchor="middle" fontSize="16">{label} — schematic</text>
  </svg>;
}
export default function PlasticsCuttingGuide({ audit }) {
  if (!audit?.valid) return <p>Plastics cutting guide requires valid perimeter geometry.</p>;
  return <div>
    <h3 style={{ marginTop: 0 }}>Fascia &amp; soffit preparation guide</h3>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead><tr>{['Run', 'External run', 'Fascia external cut height', 'Reveal Liner stock', 'Finished soffit width'].map(title => <th key={title} style={cell}>{title}</th>)}</tr></thead>
      <tbody>{audit.rows.map(row => <tr key={row.edgeId}>
        <td style={cell}>{row.side}</td><td style={cell}>{mm(row.runM * 1000)} mm</td>
        <td style={cell}>{mm(row.finishedFasciaHeightMM)} mm</td><td style={cell}>{row.fasciaWidthMM} mm</td>
        <td style={cell}>{mm(row.soffitGeometryMM)} mm</td>
      </tr>)}</tbody>
    </table>
    <p style={{ fontSize: 14 }}>Fascia height calculation: {mm(audit.rows[0].structuralFasciaHeightMM)} + 10 soffit + 10 lip → {audit.rows[0].fasciaCut.fullExternalHeightMM} mm rounded up − 5 starter clearance = <b>{audit.rows[0].fasciaCut.externalCutHeightMM} mm external cut height</b>. Coverage above internal lip: {audit.rows[0].fasciaCut.coverageHeightMM} mm.</p>
    <p style={{ fontSize: 14 }}>Reveal Liner widths are measured from the internal lip to the top edge. Cut height includes 10mm soffit allowance and 10mm lip; round up, then deduct 5mm clearance below the tile starter. Trim first, then machine the venting slots. Full stock lengths remain the supplied order.</p>
    {['fascia', 'soffit'].map(type => {
      const plan = type === 'fascia' ? audit.fasciaPlan : audit.soffitPlan;
      return <div key={type} style={{ breakInside: 'avoid' }}>
        <h4>{type === 'fascia' ? 'Fascia' : 'Soffit'} length layout</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>
          {['Run', 'Pieces along run', 'Finished width'].map(title => <th key={title} style={cell}>{title}</th>)}
        </tr></thead><tbody>{plan.runPieces.map(run => {
          const row = audit.rows.find(item => item.edgeId === run.edgeId);
          const width = type === 'fascia' ? row.finishedFasciaHeightMM : row.soffitGeometryMM;
          return <tr key={run.edgeId}><td style={cell}>{row.side}</td><td style={cell}>{run.lengthsM.map(length => `${mm(length * 1000)} mm`).join(' + ')}</td><td style={cell}>{mm(width)} mm</td></tr>;
        })}</tbody></table>
        <Strip lengthMM={audit.rows.find(row => row.side === 'front')?.runM * 1000 || 0}
          widthMM={type === 'fascia' ? audit.rows[0].finishedFasciaHeightMM : audit.rows.find(row => row.side === 'front')?.soffitGeometryMM || 0}
          label={type === 'fascia' ? 'Front fascia external cut height' : 'Front soffit run envelope'} />
      </div>;
    })}
    <p style={{ fontSize: 14 }}>Lengths above follow the external eaves runs and show the stock/offcut layout. They are preparation references, not verified final mitre endpoints: mark corner mitres and fitting clearances on assembly before final cutting. Side soffit strips may be ripped from shared wider stock as shown below.</p>
    <p style={{ fontSize: 14 }}>Soffit supply: {audit.soffitPlan.order.map(item => `${item.qty} × ${item.widthMM} mm`).join('; ')}. Rip kerf allowance: {audit.soffitPlan.kerfMM} mm.</p>
  </div>;
}
