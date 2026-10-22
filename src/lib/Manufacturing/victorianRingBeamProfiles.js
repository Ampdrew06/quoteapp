// Plan profiles only. Member cut lengths and upstand slots are independent.
export function buildVictorianRingBeamProfiles(g) {
  if(!g?.valid)return {valid:false,errors:['Valid Victorian plan required.'],beams:[]};
  const tan=a=>Math.tan(a*Math.PI/180);
  const make=(length,innerOffset,width,start,end)=>{
    const a=innerOffset*tan(start),b=innerOffset*tan(end),c=(innerOffset+width)*tan(start),d=(innerOffset+width)*tan(end);
    return {widthMM:width,internalEdgeLengthMM:length+a+b,externalEdgeLengthMM:length+c+d,
      startInnerExtensionMM:a,endInnerExtensionMM:b,startOuterExtensionMM:c,endOuterExtensionMM:d,
      startMitreDeg:start,endMitreDeg:end,startSquareLegMM:start?0:width,endSquareLegMM:end?0:width,
      outline:[{xMM:0,yMM:0},{xMM:length+a+b,yMM:0},{xMM:length+d+a,yMM:width},{xMM:-c+a,yMM:width}]};
  };
  if(g.plyBaseWidthMM<95)return {valid:false,errors:['Ply base is narrower than the existing 95mm PSE. Workshop review required.'],beams:[]};
  const last=g.facets.length-1;
  const beams=g.facets.map((f,i)=>{
    const start=i===0?0:g.mitresDeg[i-1],end=i===last?0:g.mitresDeg[i];
    const length=f.internalLengthMM;
    const slots=i===0||i===last?g.layout.centresMM.map(y=>{const x=i===0?y:length-y;return {left:x-24,right:x+24};}):[];
    if(i>0)slots.push({left:0,right:48});
    if(i<last)slots.push({left:length-48,right:length});
    [...g.intermediateBars,...(g.jackRafters||[])].filter(r=>r.facetId===f.id).forEach(r=>slots.push({left:r.positionMM-24,right:r.positionMM+24}));
    slots.sort((a,b)=>a.left-b.left);
    const upstands=[];
    for(let n=1;n<slots.length;n++){
      const widthMM=slots[n].left-slots[n-1].right;
      if(widthMM<0)continue;
      if(widthMM>0)upstands.push({bay:n,widthMM,heightMM:g.upstandHeightMM??195,thicknessMM:9});
    }
    return {slots,upstands,reference:`RB${i+1}`,label:f.label,startMitreDeg:start,endMitreDeg:end,
      layers:{pse30x90:make(f.internalLengthMM,0,95,start,end),ply9Base:make(f.internalLengthMM,0,g.plyBaseWidthMM,start,end),outerLath25x50:make(f.internalLengthMM,g.plyBaseWidthMM-50,50,start,end)}};
  });
  if(beams.some(b=>b.slots.some((s,i)=>s.left<0||s.right> b.layers.pse30x90.internalEdgeLengthMM+1e-6||(i>0&&s.left<b.slots[i-1].right-1e-6))))return {valid:false,errors:['Member slots overlap or extend beyond a ring-beam. Review the support layout.'],beams:[]};
  return {valid:true,errors:[],beams};
}
