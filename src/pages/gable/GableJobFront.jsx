import React from 'react';
import ManufactureBookFront from '../../components/ManufactureBookFront';
const valueMM=value=>Number(value).toFixed(1)+'mm';
export default function GableJobFront({inputs,geometry:g,model,job,details,customerName,onChange,onSave,message}){
 const roof={customerName:customerName||inputs.customerName,reference:inputs.customerReference,style:'Gable',pitch:Number(g.pitchDeg).toFixed(1)+'°',frame:valueMM(g.frameMM),tileType:inputs.tileProductId==='liteSlate'?'LiteSlate':inputs.tileProductId==='metrotileShingle'?'Metrotile Shingle':'Britmet Shingle',tileColour:inputs.tileColour,fasciaColour:inputs.fasciaColour||'White',soffit:`Sides ${g.leftSoffitMM}/${g.rightSoffitMM}mm · front ${g.frontOverhangMM}mm`,gutters:`${inputs.gutterProfile||'square'} · ${inputs.gutterColour||'White'}`,downpipes:'Two round downpipes',dimensions:`${g.widthMM} × ${g.projectionMM}mm`,weight:Number(model.installedWeightKg).toFixed(1)+'kg incl. plasterboard'};
 const extras=Object.values(model.sections).flatMap(s=>s.lines).filter(row=>row.isAddedItem&&row.qty>0&&row.usage!=='factory').map(row=>`${Number(row.qty.toFixed(3))} ${row.units} ${row.label}`);
 return <ManufactureBookFront roof={roof} job={job} details={details} extras={extras} onChange={onChange} onSave={onSave} message={message} factoryNote={`Manufacturing projection ${valueMM(g.manufacturingProjectionMM)} includes the 5mm front soffit clearance. Do not add again. Requested external projection ${valueMM(g.externalProjectionMM)}. Roof weight includes plasterboard once; supply only when added.`}/>;
}
