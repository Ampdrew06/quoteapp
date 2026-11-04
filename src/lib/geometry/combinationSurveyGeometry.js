// Square-base survey fit. Only the chamfer runs change; no skew rear corners.
export function solveCombinationSurvey({widthMM,projectionMM,leftSide,rightSide,specification:s}){
 const w=Number(widthMM),p=Number(projectionMM),left=leftSide==='victorian',right=rightSide==='victorian',c=w/(2+Math.SQRT2);
 const fail=message=>({valid:false,errors:[message]});
 if(!(w>0&&p>w/2+79.5)||( !left&&!right))return fail('Enter dimensions with room behind the ridge and at least one Victorian side.');
 const initial=Array.isArray(s.parameters)&&s.parameters.length===4&&s.parameters.every(v=>Number.isFinite(Number(v)))?s.parameters.map(Number):[c,c,c,c];
 const active=[...(left?[0,1]:[]),...(right?[2,3]:[])];
 const lengths=a=>[p-(left?a[1]:0),...(left?[Math.hypot(a[0],a[1])]:[]),w-(left?a[0]:0)-(right?a[2]:0),...(right?[Math.hypot(a[2],a[3])]:[]),p-(right?a[3]:0)];
 const clamp=a=>a.map((v,i)=>Math.max(1,Math.min(i%2?Math.min(p,w/2)-1:w-2,v)));
 const base=clamp(initial),requested=s.mode==='adjust'?lengths(base):s.lengthsMM?.map(Number),index=Number(s.facetIndex),target=Number(s.targetMM);
 if(!requested||requested.length!==lengths(base).length||requested.some(v=>!Number.isFinite(v)||v<=0))return fail('Enter positive measured lengths for every facet.');
 if(s.mode==='adjust'&&(!Number.isInteger(index)||index<0||index>=requested.length||!(target>0)))return fail('Choose a facet and a positive required length.');
 if(s.mode==='adjust')requested[index]=target;
 const residual=a=>{const ls=lengths(a),r=ls.map((v,i)=>(v-requested[i])*(s.mode==='adjust'&&i!==index?0:1));
 // Choose the least movement from the current plan when one edit is underdetermined.
 if(s.mode==='adjust')active.forEach(i=>r.push((a[i]-base[i])*0.000001));return r;};
 const cost=a=>residual(a).reduce((n,v)=>n+v*v,0);
 let best=base;
 if(s.mode==='adjust'){
  best=base.slice();const frontIndex=left?2:1;
  if(index===0){if(!left&&Math.abs(target-p)>0.001)return fail('The Edwardian side equals the fixed projection. Change projection to alter this facet.');if(left)best[1]=p-target;}
  else if(index===requested.length-1){if(!right&&Math.abs(target-p)>0.001)return fail('The Edwardian side equals the fixed projection. Change projection to alter this facet.');if(right)best[3]=p-target;}
  else if(index===frontIndex){const sum=w-target,old=(left?best[0]:0)+(right?best[2]:0);if(left)best[0]=sum*(right?best[0]/old:1);if(right)best[2]=sum*(left?best[2]/old:1);}
  else {const k=left&&index===1?0:2;if(target>best[k+1]+1)best[k]=Math.sqrt(target*target-best[k+1]*best[k+1]);else {const scale=target/Math.hypot(best[k],best[k+1]);best[k]*=scale;best[k+1]*=scale;}}
  if(active.some(i=>best[i]<=0||best[i]!==clamp(best)[i])||(left?best[0]:0)+(right?best[2]:0)>=w-1)return fail('That edit cannot fit the fixed width, projection and ridge position.');
 }

 // Bounded coordinate search; multiple scales handle substantial angle changes.
 if(s.mode==='survey')for(let step=Math.max(w,p)/4;step>0.0000001;step/=2){let improved=true,iterations=0;while(improved&&iterations++<500){improved=false;for(const i of active)for(const dir of [-1,1]){const a=best.slice();a[i]+=dir*step;const b=clamp(a);if((left?b[0]:0)+(right?b[2]:0)>=w-1)continue;if(cost(b)<cost(best)-1e-18){best=b;improved=true;}}}}
 const applied=lengths(best),differencesMM=applied.map((v,i)=>v-requested[i]),toleranceMM=Number(s.toleranceMM??2);
 if(!Number.isFinite(toleranceMM)||toleranceMM<0)return fail('Enter a non-negative survey tolerance.');
 if(s.mode==='adjust'&&Math.abs(differencesMM[index])>0.01)return fail('That facet length cannot be achieved with the fixed width, projection and ridge position.');
 const corners=[...(left?[{xMM:0,yMM:p-best[1]},{xMM:best[0],yMM:p}]:[{xMM:0,yMM:p}]),...(right?[{xMM:w-best[2],yMM:p},{xMM:w,yMM:p-best[3]}]:[{xMM:w,yMM:p}])];
 const outline=[{xMM:0,yMM:0},...corners,{xMM:w,yMM:0}],cornerAnglesDeg=corners.map((v,i)=>{const a=outline[i],b=outline[i+2],u=Math.hypot(a.xMM-v.xMM,a.yMM-v.yMM),z=Math.hypot(b.xMM-v.xMM,b.yMM-v.yMM);return Math.acos(Math.max(-1,Math.min(1,((a.xMM-v.xMM)*(b.xMM-v.xMM)+(a.yMM-v.yMM)*(b.yMM-v.yMM))/(u*z))))*180/Math.PI;});
 const ridge={xMM:w/2,yMM:p-w/2},runs=outline.slice(0,-1).map((a,i)=>{const b=outline[i+1];return Math.abs((b.xMM-a.xMM)*(ridge.yMM-a.yMM)-(b.yMM-a.yMM)*(ridge.xMM-a.xMM))/applied[i];});
 const equalPitchValidated=runs.every(v=>Math.abs(v-w/2)<0.001),outsideTolerance=differencesMM.some(v=>Math.abs(v)>toleranceMM+1e-6);
 return {valid:true,errors:[],mode:s.mode,parameters:best,lengthsMM:applied,suppliedMM:requested,differencesMM,toleranceMM,outsideTolerance,equalPitchValidated,requiresManufactureReview:true,cornerAnglesDeg,corners};
}
