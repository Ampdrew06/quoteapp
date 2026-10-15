import React from 'react';
import {EdwardianTrussCutPage} from './EdwardianVisualCutPages';
import TrussAssembly from './ManufacturingTrussAssembly';
import {buildVictorianTrussSchedule} from '../lib/Manufacturing/victorianTrussSchedule';
export default function VictorianTrussPreview({geometry,materials}) {
 const s=buildVictorianTrussSchedule({geometry,materials});
 if(!s.valid)return <p role="alert">{s.errors.join(' ')}</p>;
 return <div className="victorian-truss-preview"><EdwardianTrussCutPage schedule={s} assembly={<TrussAssembly truss={s.truss} count={s.counts.trusses} styleName="Victorian"/>}/><style>{`.victorian-truss-preview{background:white;border:1px solid #cbd5e1;padding:12px;margin:16px 0}.victorian-truss-preview h2{font-size:16px}.victorian-truss-preview .ev-truss{height:auto}.victorian-truss-preview svg{border:0;margin:0;max-height:none}.victorian-truss-preview .ev-card h3{font-size:12px}`}</style></div>;
}
