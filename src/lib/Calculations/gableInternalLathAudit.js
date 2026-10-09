const rate=value=>value==null||value===''||!Number.isFinite(Number(value))||Number(value)<0?null:Number(value);

// Longitudinal laths span house to front; their row positions follow the
// internal ceiling cross-section, not the external soffit extensions.
export function buildGableInternalLathAudit({geometry:g,materials:m={},maximumSpacingMM=400}={}) {
 const fail=message=>({valid:false,readOnly:true,errors:[message],rows:[]});
 if(!g?.valid)return fail('Valid Gable geometry is required.');
 const spacing=Number(maximumSpacingMM),flatWidthMM=Number(g.truss.closure.cutLengthMM);
 const projectionMM=Number(g.manufacturingProjectionMM??g.externalProjectionMM);
 if(!Number.isFinite(spacing)||spacing<=0||flatWidthMM<=0||flatWidthMM>=g.widthMM||projectionMM<=0)return fail('Positive lath spacing and a valid internal ceiling profile are required.');
 const cos=Math.cos(g.pitchDeg*Math.PI/180);
 const slopeRunMM=(g.widthMM-flatWidthMM)/2/cos;
 const slopeIntervals=Math.ceil(slopeRunMM/spacing),slopeRows=slopeIntervals+1;
 // Two runs on the standard flat. Wider future flats gain runs so the gap
 // between adjoining slope boundaries and flat rows remains <= spacing.
 const flatRows=Math.max(2,Math.ceil(flatWidthMM/spacing)-1);
 const rows=[];
 for(const side of ['left','right'])for(let n=0;n<slopeRows;n++)rows.push({id:`${side}-${n+1}`,surface:side,positionMM:slopeRunMM*n/slopeIntervals,lengthMM:projectionMM});
 for(let n=1;n<=flatRows;n++)rows.push({id:`flat-${n}`,surface:'flat',positionMM:flatWidthMM*n/(flatRows+1),lengthMM:projectionMM});
 const totalLengthM=rows.length*projectionMM/1000;
 const pricePerM=rate(m.lath25x50?.price_per_m),weightPerM=rate(m.chamferLath?.weight_kg_per_m);
 return {valid:true,readOnly:true,errors:[],rows,slopeRunMM,slopeRows,flatRows,rowCount:rows.length,projectionMM,
  maximumSpacingMM:spacing,slopeGapMM:slopeRunMM/slopeIntervals,flatGapMM:flatWidthMM/(flatRows+1),totalLengthM,
  cost:pricePerM==null?null:totalLengthM*pricePerM,installedWeightKg:weightPerM==null?null:totalLengthM*weightPerM,
  notes:[
   'The lower lath is at the rafter foot-cut/ring-beam junction, at the internal frame line. Side soffit extensions are outside this internal lath cross-section.',
   'Both slopes include lower and upper support runs. Positions are distributed at no more than approximately 400mm; factory positioning remains subject to installation review.',
   'Two longitudinal runs are allowed across the standard 595mm flat. Wider future flats gain runs to maintain the spacing allowance.',
   'Every run extends from the house wall to the front external edge of the last truss, using manufacturing projection including the existing 5mm allowance once.',
   'Laths sit over approximately 9mm compressed SuperQuilt. Plasterboard is nominally 9.5mm; its existing installed weight is retained and supply is not added.',
   'The longer lath runs support the front overhang; they do not extend installed SuperQuilt or plasterboard area beyond the inside front frame.',
   'Net installed lath length is shown for the audit. Stock is pooled with the other 25×50 uses in the reconciliation; do not add a separately rounded internal stock order.',
  ]};
}
