/** Metre-based cloth ribbon: independently moving edge and centre particles,
 * coupled by stretch, shear and bending constraints. Only the attachment is pinned.
 */
type Constraint={a:number;b:number;rest:number;stiffness:number;structural:boolean;maximum?:boolean};
type Collider={min:number[];max:number[];c:number;s:number;x:number;z:number};
export class RibbonDynamics {
 readonly segments=24; readonly columns=3;
 readonly particles=new Float64Array(225); readonly previous=new Float64Array(225);
 readonly positions=new Float64Array(75); readonly anchor:number[];
 readonly length=.029; readonly width=.0043;
 readonly bookWidth:number; readonly height:number; readonly depth:number; readonly board:number;
 readonly paperGap:number;
 private initialized=false; private lastQ=[0,0,0,1];
 private quietTime=0; private lastCover=0; private accumulator=0; revision=0;
 private previousStep=1/240;
 private constraints:Constraint[]=[]; private colliders:Collider[]=[];
 constructor(bookWidth:number,height:number,depth:number,board:number,paperGap=.0011){
  this.bookWidth=bookWidth;this.height=height;this.depth=depth;this.board=board;
  this.paperGap=paperGap;
  this.anchor=[0,-height/2+.0008,.0006];this.reset();
  const add=(a:number,b:number,stiffness:number,structural=true)=>{const p=this.particles;this.constraints.push({a:a*3,b:b*3,rest:Math.hypot(p[a*3]-p[b*3],p[a*3+1]-p[b*3+1],p[a*3+2]-p[b*3+2]),stiffness,structural});};
  for(let row=0;row<=24;row++)for(let col=0;col<3;col++){
   const a=row*3+col;if(row>0)add(a,a-3,1);if(col>0)add(a,a-1,1);
   if(row>0&&col>0){add(a,a-4,.85,false);add(a-1,a-3,.85,false);}
   if(row>1)add(a,a-6,.035,false);
   if(row>1)this.constraints.push({a:a*3,b:(3+col)*3,rest:(row-1)*this.length/24,stiffness:1,structural:false,maximum:true});
  }
 }
 reset(){
  for(let row=0;row<=24;row++)for(let col=0;col<3;col++){
   const k=row*9+col*3;this.particles[k]=(col-1)*this.width/2;this.particles[k+1]=this.anchor[1]-this.length*row/24;this.particles[k+2]=this.anchor[2];
  }
  this.previous.set(this.particles);this.previousStep=1/240;this.initialized=false;this.quietTime=0;this.accumulator=0;this.revision++;this.updateCentreline();
 }
 /** Start in a drape appropriate to the book's mounted orientation. */
 private initializePose(orientation:number[]){
  const gravity=[0,0,0];this.rotate(0,-1,0,[-orientation[0],-orientation[1],-orientation[2],orientation[3]],gravity);
  // Seed an unstretched developable strip. A sideways offset with parallel
  // cross-sections preloaded shear and made newly mounted ribbons untwist.
  gravity[0]=0;
  gravity[1]=Math.min(-.08,gravity[1]);
  const length=Math.hypot(...gravity);for(let i=0;i<3;i++)gravity[i]/=length;
  const centre=[0,this.anchor[1]-this.length/24,this.anchor[2]];
  this.pin();
  for(let row=2;row<=24;row++){
   const mix=Math.min(1,(row-1)/5),x=gravity[0]*mix,y=-(1-mix)+gravity[1]*mix,z=gravity[2]*mix;
   const step=this.length/24/Math.hypot(x,y,z);centre[0]+=x*step;centre[1]+=y*step;centre[2]+=z*step;
   for(let col=0;col<3;col++){const k=row*9+col*3;this.particles[k]=centre[0]+(col-1)*this.width/2;this.particles[k+1]=centre[1];this.particles[k+2]=centre[2];}
  }
  this.previous.set(this.particles);this.lastQ=[...orientation];this.initialized=true;this.revision++;this.updateCentreline();
 }
 private updateCentreline(){for(let row=0;row<=24;row++)for(let a=0;a<3;a++)this.positions[row*3+a]=this.particles[row*9+3+a];}
 private pin(){for(let row=0;row<2;row++)for(let col=0;col<3;col++){const k=row*9+col*3;this.particles[k]=(col-1)*this.width/2;this.particles[k+1]=this.anchor[1]-this.length*row/24;this.particles[k+2]=this.anchor[2];}}
 private rotate(x:number,y:number,z:number,q:number[],out:Float64Array|number[],k=0){
  const tx=2*(q[1]*z-q[2]*y),ty=2*(q[2]*x-q[0]*z),tz=2*(q[0]*y-q[1]*x);
  out[k]=x+q[3]*tx+q[1]*tz-q[2]*ty;out[k+1]=y+q[3]*ty+q[2]*tx-q[0]*tz;out[k+2]=z+q[3]*tz+q[0]*ty-q[1]*tx;
 }
 private contact(k:number,from=k-9){
  const p=this.particles;
  if(p[k+1]<-this.height/2-.00018&&p[from+1]<-this.height/2-.00018)return;
  for(const box of this.colliders){
   const {min,max,c,s,x,z}=box,px=p[k]-x,pz=p[k+2]-z,ax=p[from]-x,az=p[from+2]-z;
   const v=[c*px-s*pz,p[k+1],s*px+c*pz],start=[c*ax-s*az,p[from+1],s*ax+c*az];
   let near=0,far=1,hit=-1,edge=0;
   for(let axis=0;axis<3;axis++){
    const delta=v[axis]-start[axis];if(Math.abs(delta)<1e-12){if(start[axis]<=min[axis]||start[axis]>=max[axis])far=-1;continue;}
    const entry=((delta>0?min[axis]:max[axis])-start[axis])/delta,leave=((delta>0?max[axis]:min[axis])-start[axis])/delta;
    if(entry>=near-1e-9){near=Math.max(0,entry);hit=axis;edge=delta>0?min[axis]:max[axis];}far=Math.min(far,leave);
   }
   if(hit>=0&&near<=far&&near<=1)v[hit]=edge;
   else{
    if(v.some((a,i)=>a<=min[i]||a>=max[i]))continue;
    let displacement=Infinity,axis=0;
    for(let i=0;i<3;i++)for(const edge of [min[i],max[i]])if(Math.abs(edge-v[i])<Math.abs(displacement)){axis=i;displacement=edge-v[i];}
    v[axis]+=displacement;
   }
   p[k]=c*v[0]+s*v[2]+x;p[k+1]=v[1];p[k+2]=-s*v[0]+c*v[2]+z;
  }
 }
 private solve(constraint:Constraint){
  const {a,b,rest,stiffness}=constraint,p=this.particles,wa=a<18?0:1,wb=b<18?0:1;if(!wa&&!wb)return;
  const x=p[b]-p[a],y=p[b+1]-p[a+1],z=p[b+2]-p[a+2],length=Math.max(1e-12,Math.sqrt(x*x+y*y+z*z));
  if(constraint.maximum&&length<=rest)return;
  const s=(length-rest)/length*stiffness/(wa+wb);
  if(wa){p[a]+=x*s;p[a+1]+=y*s;p[a+2]+=z*s;}if(wb){p[b]-=x*s;p[b+1]-=y*s;p[b+2]-=z*s;}
 }
 step(elapsed:number,orientation:number[],cover=0,reduced=false){
  const orientationChange=1-Math.abs(orientation.reduce((sum,v,i)=>sum+v*this.lastQ[i],0));
  if(reduced){
   if(!this.initialized||orientationChange>1e-10||Math.abs(cover-this.lastCover)>1e-5){this.reset();this.initializePose(orientation);this.lastCover=cover;}
   return;
  }
  let dt=Math.min(.05,Math.max(0,elapsed));if(!dt)return;
  if(this.quietTime>.4&&orientationChange<1e-10&&Math.abs(cover-this.lastCover)<1e-5)return;
  this.accumulator+=dt;const ticks=Math.floor((this.accumulator+1e-10)*240);if(!ticks)return;
  dt=ticks/240;this.accumulator-=dt;
  const before=Float64Array.from(this.particles);this.lastCover=cover;
  if(!this.initialized)this.initializePose(orientation);
  const q=[-orientation[0],-orientation[1],-orientation[2],orientation[3]],a=q,b=this.lastQ;
  const relative=[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
  if(relative[3]<0)for(let i=0;i<4;i++)relative[i]*=-1;
  const angle=2*Math.acos(Math.max(-1,Math.min(1,relative[3]))),count=Math.max(1,Math.ceil(dt*240),Math.ceil(angle/.012)),h=dt/count,sin=Math.sin(angle/2);
  const lag=.35,lagFactor=sin>1e-8?Math.sin(angle/count/2*lag)/sin:lag/count;
  const rotation=[relative[0]*lagFactor,relative[1]*lagFactor,relative[2]*lagFactor,Math.cos(angle/count/2*lag)];
  const gravity=[0,0,0];this.rotate(0,-9.81,0,q,gravity);this.lastQ=[...orientation];
  const w=this.bookWidth/2,hh=this.height/2,d=this.depth/2,pd=(this.depth-this.board-2*this.paperGap)/2,r=.00018;
  this.colliders=[
   // Include the tucked foot lining in the ribbon's contact proxy. The inset
   // paper-only proxy left a narrow pocket that could trap the exiting cloth.
   {min:[-w-.0015-r,-hh-r,-pd-r],max:[w-.0025+r,hh-.0026+r,pd+r],c:1,s:0,x:0,z:0},
   {min:[-w-r,-hh-r,-this.board/2-r],max:[w+r,hh+r,this.board/2+r],c:1,s:0,x:0,z:-d},
   {min:[-r,-hh-r,-this.board/2-r],max:[w*2+r,hh+r,this.board/2+r],c:Math.cos(cover),s:Math.sin(cover),x:-w,z:d},
  ];
  const p=this.particles;
  let refinements=0;
  const advance=(h:number,rotation:number[],depth=0)=>{
   const checkpoint=Float64Array.from(p),oldPrevious=Float64Array.from(this.previous),previousStep=this.previousStep;
   for(let k=18;k<p.length;k+=3){
    // Carry the attachment's translation with the book, retaining angular lag
    // along the free fabric. Rotating around the book centre overstrained the
    // first free span, causing contact recovery to discard every shelf step.
    this.rotate(p[k]-this.anchor[0],p[k+1]-this.anchor[1],p[k+2]-this.anchor[2],rotation,p,k);
    this.rotate(this.previous[k]-this.anchor[0],this.previous[k+1]-this.anchor[1],this.previous[k+2]-this.anchor[2],rotation,this.previous,k);
    for(let axis=0;axis<3;axis++){p[k+axis]+=this.anchor[axis];this.previous[k+axis]+=this.anchor[axis];}
    // Adaptive substeps must rescale Verlet displacement to their duration.
    // Otherwise halving a failed step repeats its entire velocity impulse.
    const vx=p[k]-this.previous[k],vy=p[k+1]-this.previous[k+1],vz=p[k+2]-this.previous[k+2];
    const speed=Math.sqrt(vx*vx+vy*vy+vz*vz)/previousStep;
    // A short fabric bookmark loses energy quickly to air and internal friction.
    // Bound impulses left by sudden contact corrections, without pinning its body.
    const inertia=Math.min(1,.16/Math.max(1e-12,speed))*(h/previousStep)*Math.exp(-24*h);
    for(let axis=0;axis<3;axis++){const value=p[k+axis];p[k+axis]+=(value-this.previous[k+axis])*inertia+gravity[axis]*h*h;this.previous[k+axis]=value;}
   }
   this.pin();
   for(let iteration=0;iteration<12;iteration++){
    if(iteration%2)for(let i=this.constraints.length-1;i>=0;i--)this.solve(this.constraints[i]);else for(const c of this.constraints)this.solve(c);
    for(let k=18;k<p.length;k+=3){this.contact(k);if(k%9){this.contact(k,k-3);this.contact(k,k-12);this.contact(k-3,k-9);}}
   }
   // Stretch limits get the last word after the softer bending/shear solve.
   for(let iteration=0;iteration<256;iteration++){
    for(const c of this.constraints)if(c.structural||c.maximum)this.solve(c);
    for(let k=18;k<p.length;k+=3){this.contact(k);if(k%9){this.contact(k,k-3);this.contact(k,k-12);this.contact(k-3,k-9);}}
    if(iteration%4===3&&this.maxStretch()<.001)break;
   }
   this.previousStep=h;
   if(this.maxStretch()>.004){
    p.set(checkpoint);this.previous.set(oldPrevious);
    this.previousStep=previousStep;
    if(depth<3&&refinements<8){
     refinements++;
     const halfW=Math.sqrt((1+rotation[3])/2),denom=Math.max(1e-12,2*halfW);
     const half=[rotation[0]/denom,rotation[1]/denom,rotation[2]/denom,halfW];
     advance(h/2,half,depth+1);advance(h/2,half,depth+1);
    }
   }
  };
  for(let sub=0;sub<count;sub++)advance(h,rotation);
  let movement=0;for(let i=0;i<p.length;i++)movement=Math.max(movement,Math.abs(p[i]-before[i]));
  this.quietTime=movement<.000002?this.quietTime+dt:0;this.revision++;this.updateCentreline();
 }
 sample(u:number,v:number,point:number[],normal:number[]){
  const row=Math.min(23.999999,Math.max(0,v*24)),col=Math.min(1.999999,Math.max(0,u*2)),ri=Math.floor(row),ci=Math.floor(col),t=row-ri,s=col-ci,p=this.particles,a=ri*9+ci*3,b=a+3,c=a+9,d=c+3;
  const right=[0,0,0],along=[0,0,0];
  const cubic=(column:number,axis:number)=>{
   const at=(row:number)=>p[Math.max(0,Math.min(24,row))*9+column*3+axis];
   const p0=at(ri-1),p1=at(ri),p2=at(ri+1),p3=at(ri+2);
   const value=.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t);
   return Math.max(Math.min(p1,p2),Math.min(Math.max(p1,p2),value));
  };
  for(let axis=0;axis<3;axis++){
   point[axis]=cubic(ci,axis)*(1-s)+cubic(ci+1,axis)*s;
   right[axis]=(p[b+axis]-p[a+axis])*(1-t)+(p[d+axis]-p[c+axis])*t;along[axis]=(p[c+axis]-p[a+axis])*(1-s)+(p[d+axis]-p[b+axis])*s;
  }
  normal[0]=right[1]*along[2]-right[2]*along[1];normal[1]=right[2]*along[0]-right[0]*along[2];normal[2]=right[0]*along[1]-right[1]*along[0];
  const length=Math.max(1e-12,Math.hypot(...normal));for(let axis=0;axis<3;axis++)normal[axis]/=length;
  // The smooth render surface also observes contact between simulation rows.
  if(v>.05)for(const box of this.colliders){
   const {min,max,c,s,x,z}=box,px=point[0]-x,pz=point[2]-z,local=[c*px-s*pz,point[1],s*px+c*pz];
   if(local.some((a,i)=>a<=min[i]||a>=max[i]))continue;
   let axis=0,offset=Infinity;for(let i=0;i<3;i++)for(const edge of [min[i],max[i]])if(Math.abs(edge-local[i])<Math.abs(offset)){axis=i;offset=edge-local[i];}
   local[axis]+=offset;point[0]=c*local[0]+s*local[2]+x;point[1]=local[1];point[2]=-s*local[0]+c*local[2]+z;
  }
 }
 maxStretch(){let result=0;const p=this.particles;for(const {a,b,rest,structural} of this.constraints)if(structural){const x=p[a]-p[b],y=p[a+1]-p[b+1],z=p[a+2]-p[b+2];result=Math.max(result,Math.abs(Math.sqrt(x*x+y*y+z*z)/rest-1));}return result;}
}
