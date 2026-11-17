import React from 'react';
import {DEFAULT_METROTILE_CARRIAGE_GBP} from '../lib/doubleEdwardianTileOptions';
export default function MetrotileCarriageField({admin,inputs,update}){
 if(!admin||inputs.tileProductId!=='metrotileShingle')return null;
 return <label>Metrotile supplier carriage (£, ex VAT)
 <input aria-label="Metrotile supplier carriage (£, ex VAT)" type="number" min="0" step="0.01"
 value={inputs.metrotileCarriageGBP??DEFAULT_METROTILE_CARRIAGE_GBP} onChange={e=>update('metrotileCarriageGBP',e.target.value)}/>
 </label>;
}
