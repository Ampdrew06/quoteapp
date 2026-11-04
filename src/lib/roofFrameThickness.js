// Per-design setting; never changes the shared Materials default.
export function roofFrameThickness(inputs={},materials={}){
 const value=Number(inputs.frameThicknessMM??inputs.side_frame_thickness_mm??materials.side_frame_thickness_mm??70);
 return Number.isFinite(value)&&value>0?value:70;
}
export function withRoofFrameMaterials(inputs={},materials={}){
 const frame=roofFrameThickness(inputs,materials);
 return {...materials,side_frame_thickness_mm:frame,...(inputs.frameThicknessMM!=null?{frame_on_mm:frame}:{})};
}
