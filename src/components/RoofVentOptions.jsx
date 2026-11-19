import React, { useState } from 'react';
import { roofVentOptions } from '../lib/glazingOptions';
import { roofVentLabel } from '../lib/Calculations/roofVentPricing';

export default function RoofVentOptions({ quantities, onChange, pricing, layout, canMove, onPosition, onCentre, showPrice=true }) {
  const [selected, setSelected] = useState('');
  const [positionError,setPositionError]=useState('');
  const update = (code, quantity) => {
    const next = { ...quantities };
    if (quantity > 0) next[code] = quantity;
    else delete next[code];
    onChange(next);
  };
  return <fieldset>
    <legend>Roof vents</legend>
    <label>
      Size and finish{' '}
      <select value={selected} onChange={event => setSelected(event.target.value)}>
        <option value="">Select a roof vent</option>
        {roofVentOptions.map(option => <option key={option.code} value={option.code}>{roofVentLabel(option)}</option>)}
      </select>
    </label>{' '}
    <button type="button" disabled={!selected} onClick={() => update(selected, Number(quantities[selected] || 0) + 1)}>Add vent</button>
    {pricing.count > 0 && <ul>
      {roofVentOptions.filter(option => quantities[option.code] > 0).map(option => <li key={option.code}>
        {quantities[option.code]} × {roofVentLabel(option)}{' '}
        <button type="button" aria-label={`Remove one ${roofVentLabel(option)} vent`} onClick={() => update(option.code, quantities[option.code] - 1)}>Remove one</button>
      </li>)}
    </ul>}
    {layout?.openings.length > 0 && <div>
      <p>Enter a vent centre from the left internal edge, or use the arrows for 50 mm steps.</p>
      {layout.openings.map((vent,index) => {
        const place=centre=>{const error=onPosition(vent.id,centre);setPositionError(error||'');return error;};
        return <div key={vent.id}>
          <label>Vent {index + 1} · {roofVentLabel(vent)} · centre{' '}
            <input key={vent.centreMM} type="number" step="any" defaultValue={Number(vent.centreMM.toFixed(3))}
              style={{width:90}} onBlur={event=>{
                const value=event.target.valueAsNumber;
                if(value===Number(vent.centreMM.toFixed(3)))return;
                if(Number.isFinite(value)&&!place(value))return;
                if(!Number.isFinite(value))setPositionError('Enter a vent centre in millimetres.');
                event.target.value=Number(vent.centreMM.toFixed(3));
              }} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();event.currentTarget.blur();}}} /> mm
          </label>{' '}
          <button type="button" disabled={!canMove(vent.id,-50)} onClick={()=>place(vent.centreMM-50)} aria-label={`Move vent ${index + 1} left 50 mm`}>{'<'}</button>{' '}
          <button type="button" disabled={!canMove(vent.id,50)} onClick={()=>place(vent.centreMM+50)} aria-label={`Move vent ${index + 1} right 50 mm`}>{'>'}</button>
        </div>;
      })}
      {positionError&&<p role="alert">{positionError}</p>}
    </div>}
    {(layout?.openings.length > 0 || layout?.error) && <button type="button" onClick={()=>{setPositionError('');onCentre();}}>Reset vent positions</button>}
    {pricing.error
      ? <p role="status">{pricing.error}</p>
      : showPrice && pricing.count > 0 && <p>Roof vents: £{pricing.net.toFixed(2)} ex VAT, including slate flashing, one pole and carriage.</p>}
  </fieldset>;
}
