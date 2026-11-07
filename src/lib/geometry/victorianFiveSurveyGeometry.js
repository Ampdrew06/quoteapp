// Numerical survey fit: square rear corners, parallel sides and centre front.
// Eight corner coordinates, seven lengths. Small template regularisation chooses
// a nearby convex outline where measurements alone do not determine one shape.
export function resolveVictorianFiveSurvey({widthMM,projectionMM,specification:s={}}={}){
 const w=Number(widthMM),p=Number(projectionMM),target=s.lengthsMM?.map(Number),tol=Number(s.toleranceMM??2);
 const fail=message=>({valid:false,errors:[message]});
 if(s.mode!=='survey')return fail('Choose best-fit survey for measured five-facet geometry.');
 if(!(w>0&&p>w/2+79.5))return fail('Enter width and projection with room behind the ridge.');
 if(!Array.isArray(s.lengthsMM)||s.lengthsMM.length!==7||s.lengthsMM.some(v=>v==null||String(v).trim()==='')||target.some(v=>!Number.isFinite(v)||v<=0))return fail('Enter seven positive internal facet lengths.');
 if(!Number.isFinite(tol)||tol<0)return fail('Enter a non-negative survey tolerance.');
 const L=w/(2+Math.sqrt(3)),rise=L*(Math.sqrt(3)+1)/2;
 const seed=[L/2,L*(1+Math.sqrt(3))/2,w-L*(1+Math.sqrt(3))/2,w-L/2,p-rise,p-L/2,p-L/2,p-rise];
 const corners=a=>[{xMM:0,yMM:a[4]},{xMM:a[0],yMM:a[5]},{xMM:a[1],yMM:p},{xMM:a[2],yMM:p},{xMM:a[3],yMM:a[6]},{xMM:w,yMM:a[7]}];
 const outline=a=>[{xMM:0,yMM:0},...corners(a),{xMM:w,yMM:0}];
 const lengths=a=>{const q=outline(a);return q.slice(0,-1).map((v,i)=>Math.hypot(q[i+1].xMM-v.xMM,q[i+1].yMM-v.yMM));};
 const angles=a=>{const q=outline(a);return q.slice(1,-1).map((v,i)=>{const u=q[i],z=q[i+2];return Math.acos(Math.max(-1,Math.min(1,((u.xMM-v.xMM)*(z.xMM-v.xMM)+(u.yMM-v.yMM)*(z.yMM-v.yMM))/(Math.hypot(u.xMM-v.xMM,u.yMM-v.yMM)*Math.hypot(z.xMM-v.xMM,z.yMM-v.yMM)))))*180/Math.PI;});};
 const valid=a=>a.every(Number.isFinite)&&0<a[0]&&a[0]<a[1]&&a[1]<a[2]&&a[2]<a[3]&&a[3]<w&&p-w/2<a[4]&&a[4]<a[5]&&a[5]<p&&p-w/2<a[7]&&a[7]<a[6]&&a[6]<p&&angles(a).every(v=>v>90.001&&v<179.999);
 if(!valid(seed))return fail('Projection cannot accommodate the standard five-facet front.');
 const residual=a=>[...lengths(a).map((v,i)=>v-target[i]),...a.map((v,i)=>(v-seed[i])*1e-5)];
 const cost=a=>residual(a).reduce((n,v)=>n+v*v,0);
 const solve=(A,b)=>{const q=A.map((r,i)=>[...r,b[i]]),n=b.length;for(let i=0;i<n;i++){let k=i;for(let j=i+1;j<n;j++)if(Math.abs(q[j][i])>Math.abs(q[k][i]))k=j;[q[i],q[k]]=[q[k],q[i]];if(Math.abs(q[i][i])<1e-18)return null;const d=q[i][i];for(let j=i;j<=n;j++)q[i][j]/=d;for(let k=0;k<n;k++)if(k!==i){const d=q[k][i];for(let j=i;j<=n;j++)q[k][j]-=d*q[i][j];}}return q.map(r=>r[n]);};
 let a=seed.slice(),lambda=1e-3;
 for(let it=0;it<400;it++){
  const r=residual(a),J=a.map((v,i)=>{const b=a.slice();b[i]+=.001;return residual(b).map((x,k)=>(x-r[k])/.001);});
  const A=J.map((u,i)=>J.map((v,j)=>u.reduce((n,x,k)=>n+x*v[k],0)+(i===j?lambda:0))),b=J.map(u=>-u.reduce((n,x,k)=>n+x*r[k],0)),step=solve(A,b);if(!step)break;
  const next=a.map((v,i)=>v+step[i]);
  if(valid(next)&&cost(next)<cost(a)){const improvement=cost(a)-cost(next);a=next;lambda=Math.max(1e-12,lambda/3);if(improvement<1e-15)break;}else lambda=Math.min(1e12,lambda*10);
 }
 const applied=lengths(a),diff=applied.map((v,i)=>v-target[i]),cornerAnglesDeg=angles(a);
 if(!valid(a))return fail('No valid convex five-facet outline could be fitted. Review the survey.');
 return {valid:true,errors:[],mode:'survey',parameters:a,corners:corners(a),lengthsMM:applied,suppliedMM:target,differencesMM:diff,toleranceMM:tol,outsideTolerance:diff.some(v=>Math.abs(v)>tol+1e-6),equalPitchValidated:false,requiresManufactureReview:true,cornerAnglesDeg,frontMM:applied[3]};
}
