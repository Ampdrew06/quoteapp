import React from 'react';
// Home illustrations only: these do not alter manufacture or pricing geometry.
const tall='M65 25H235V205H65Z';
// Intersect each rafter with its actual plane boundary, so no line ends in mid-air.
const bands=(polygon,axis,positions)=>positions.map(value=>{
 const cross=[];
 polygon.forEach((a,i)=>{const b=polygon[(i+1)%polygon.length],k=axis==='x'?0:1,other=1-k;
  if(a[k]===b[k])return;
  const t=(value-a[k])/(b[k]-a[k]);if(t>=0&&t<=1)cross.push(a[other]+t*(b[other]-a[other]));
 });
 if(cross.length<2)return '';
 const lo=Math.min(...cross),hi=Math.max(...cross);
 return axis==='x'?`M${value} ${lo}V${hi}`:`M${lo} ${value}H${hi}`;
}).join('');
const rectangle=[[65,25],[235,25],[235,205],[65,205]];
const upper=bands(rectangle,'y',[58,91,124,157,181]);
const frontRows=[58.333333,91.666667,125];
const edRidge=332.5,vicRidge=345;
const plans={
 'lean-to':['M40 60H260V185H40Z','',bands([[40,60],[260,60],[260,185],[40,185]],'x',[84,128,172,216])],
 'hipped-lean-to':['M40 60H260V185H40Z','M96 60L40 185M204 60L260 185',bands([[96,60],[204,60],[260,185],[40,185]],'x',[95,150,205])+bands([[40,60],[96,60],[40,185]],'y',[101.666667,143.333333])+bands([[204,60],[260,60],[260,185]],'y',[101.666667,143.333333])],
 'victorian-hipped':['M40 60H260V150L210 185H90L40 150Z','M96 60L40 150M96 60L90 185M204 60L210 185M204 60L260 150',bands([[96,60],[204,60],[210,185],[90,185]],'x',[120,150,180])+bands([[40,60],[96,60],[40,150]],'y',[90,120])+bands([[204,60],[260,60],[260,150]],'y',[90,120])],
 gable:[tall,'M150 25V205',upper],
 edwardian:[tall,'M150 25V135M150 135L65 205M150 135L235 205',bands(rectangle,'y',[58,91,124])+bands([[65,135],[150,135],[65,205]],'y',[170])+bands([[150,135],[235,135],[235,205]],'y',[170])+bands([[150,135],[235,205],[65,205]],'x',[107.5,150,192.5])],
 'double-edwardian':['M15 65H285V205H15Z','M15 65L115 135M15 205L115 135H195M195 135L285 65M195 135L285 205M15 76H285',bands([[15,65],[285,65],[195,135],[115,135]],'x',[70,115,155,195,235])+bands([[15,205],[115,135],[195,135],[285,205]],'x',[70,115,155,195,235])+bands([[15,65],[115,135],[15,205]],'y',[100,135,170])+bands([[285,65],[285,205],[195,135]],'y',[100,135,170])],
 victorian:['M65 25H235V155L180 215H120L65 155Z','M150 25V125M150 125L65 155M150 125L120 215M150 125L180 215M150 125L235 155',bands(rectangle,'y',frontRows)],
 'victorian-five':['M65 25H235V155L212 190L182 218H118L88 190L65 155Z','M150 25V125M150 125L65 155M150 125L88 190M150 125L118 218M150 125L182 218M150 125L212 190M150 125L235 155',bands(rectangle,'y',frontRows)],
 combination:['M65 25H235V155L187 205H65Z','M150 25V135M150 135L65 205M150 135L235 155M150 135L187 205',bands(rectangle,'y',[61.666667,98.333333,135])+bands([[65,135],[150,135],[65,205]],'y',[158.333333,181.666667])+bands([[150,135],[187,205],[65,205]],'x',[99,125,151])],
 'edwardian-p':['M20 25H440V245H225V195H20Z',`M${edRidge} 25L225 195M${edRidge} 25V160M${edRidge} 160L225 245M${edRidge} 160L440 245`,bands([[20,25],[edRidge,25],[225,195],[20,195]],'x',[65,110,155,200,245,290])+bands([[edRidge,25],[440,25],[440,245],[edRidge,160],[225,245],[225,195]],'y',[59,93,127,161,195])+bands([[edRidge,160],[440,245],[225,245]],'x',[260,296.25,332.5,368.75,405])],
 'victorian-p':['M20 25H440V195L385 245H310L250 195V160H20Z',`M${vicRidge} 25L250 160M${vicRidge} 25V160M${vicRidge} 160L250 195M${vicRidge} 160L310 245M${vicRidge} 160L385 245M${vicRidge} 160L440 195`,bands([[20,25],[vicRidge,25],[250,160],[20,160]],'x',[65,110,155,200,245,290])+bands([[vicRidge,25],[440,25],[440,195],[vicRidge,160],[250,195],[250,160]],'y',[58.75,92.5,126.25,160])],
};
export default function RoofStylePlan({id,name}){
 const [outline,hips,rafters]=plans[id]||plans['lean-to'];
 return <svg className="th-plan" viewBox={id.endsWith('-p')?'0 0 460 270':'0 0 300 240'} role="img" aria-label={name+' roof plan, viewed from above'}><path className="th-plane" d={outline}/><path className="th-rafter" d={rafters}/><path className="th-member" d={hips}/></svg>;
}
