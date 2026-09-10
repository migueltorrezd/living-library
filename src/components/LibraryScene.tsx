"use client";

import {Component,Suspense,useEffect,useMemo,useRef,type ReactNode} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import {easing} from 'maath';
import {BOOKS} from '@/lib/books';
import {configureBookLoader} from '@/lib/book-loader';
import {BOOK_ARRIVAL_SECONDS,BOOK_RETURN_SECONDS,bookEase} from '@/lib/library-motion';
import {libraryMotion,restingView,useLibrary} from '@/store/useLibrary';
import {useShelf} from '@/store/useShelf';
import {bookModelUrl,getModelSpec,shareTextureSource,useBookModel} from './BlenderBook';
import {BookLighting} from './BookLighting';
import {useBookMechanics} from './useBookMechanics';
import {useRibbonMechanics} from './useRibbonMechanics';
import {useReducedMotion} from './useReducedMotion';
import {usePrintedPaper,usePrintedPages} from './usePrintedPages';

const shelfRotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().set(0,-1,0,0,0,0,1,0,-1,0,0,0,0,0,0,1));
const axis=new THREE.Vector3(1,0,0);
function fitBookWidth(scale:number,position:THREE.Vector3,rotation:THREE.Quaternion,spec:ReturnType<typeof getModelSpec>,cameraZ:number,frustum:number,corner:THREE.Vector3,center=0){
 for(let i=0;i<8;i++){
  corner.set((i&1?1:-1)*spec.width*.54,(i&2?1:-1)*spec.height*.54,(i&4?1:-1)*spec.depth*.65).applyQuaternion(rotation);
  for(const side of [-1,1]){
   const limit=frustum+side*center;
   const extent=side*corner.x+limit*corner.z;
   if(extent>0)scale=Math.min(scale,((cameraZ-position.z)*limit-side*position.x)/extent);
  }
 }
 return Math.max(0,scale);
}
class BookBoundary extends Component<{index:number;children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(){useLibrary.getState().fail(this.props.index);}
 render(){return this.state.failed?null:this.props.children;}
}

/** Promote only textures after arrival. The visible geometry and cloth never remount. */
function FinePrint({model,slug}:{model:THREE.Group;slug:string}){
 const full=useGLTF(bookModelUrl(slug),true,true,configureBookLoader);
 const {gl}=useThree();
 useEffect(()=>{
 const sources=new Map<string,THREE.MeshPhysicalMaterial>();
  full.scene.traverse(o=>{if(o instanceof THREE.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])sources.set(m.name,m);});
  const updates:(()=>void)[]=[];
  model.traverse(o=>{
   if(!(o instanceof THREE.Mesh))return;
   for(const m of Array.isArray(o.material)?o.material:[o.material]){
    if(m.userData.interiorPrint)continue;
    const source=sources.get(m.name);if(!source)continue;
    updates.push(()=>{
     for(const key of ['map','normalMap','roughnessMap','metalnessMap','aoMap','clearcoatMap','clearcoatRoughnessMap','clearcoatNormalMap'] as const){
      const texture=source[key];if(texture){shareTextureSource(texture);texture.anisotropy=Math.min(8,gl.capabilities.getMaxAnisotropy());gl.initTexture(texture);m[key]=texture;}
     }
     m.needsUpdate=true;
    });
   }
  });
  let frame=0,cancelled=false;
  const tick=()=>{if(cancelled)return;updates.shift()?.();if(updates.length)frame=requestAnimationFrame(tick);else model.userData.fullResolution=true;};
  frame=requestAnimationFrame(tick);
  return()=>{cancelled=true;cancelAnimationFrame(frame);};
 },[model,full.scene,gl]);
 return null;
}

function LibraryBook({index}:{index:number}){
 const slug=BOOKS[index].slug,model=useBookModel(slug,'library'),spec=getModelSpec(slug);
 const group=useRef<THREE.Group>(null);
 const view=useLibrary(s=>s.views[index]||restingView);
 const active=useLibrary(s=>s.active===index&&s.phase==='reading');
 const entered=useLibrary(s=>s.entrance==='ready');
 const reduce=useReducedMotion(),compiled=useRef(false),reported=useRef(false);
 const {gl,camera,scene}=useThree();
 const printedPaper=usePrintedPaper(model,slug);
 const mechanics=useBookMechanics(model,slug,view.open,view.turned);
 usePrintedPages(model,slug,printedPaper,mechanics,view.open,active&&entered);
 const motion=useMemo(()=>({
  phase:'',revision:-1,visible:false,fromVisible:false,scale:1,fromScale:1,spread:0,
  from:new THREE.Vector3(),fromQ:new THREE.Quaternion(),target:new THREE.Vector3(),dock:new THREE.Vector3(),corner:new THREE.Vector3(),readCenter:new THREE.Vector3(),q:new THREE.Quaternion(),rotation:new THREE.Euler(),
 }),[]);
 useEffect(()=>{
  let cancelled=false,frame=0;
  const textures=new Set<THREE.Texture>();
  model.traverse(o=>{if(o instanceof THREE.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])for(const value of Object.values(m))if(value instanceof THREE.Texture)textures.add(value);});
  const pending=[...textures];
  const warm=()=>{if(cancelled)return;try{for(let i=0;i<2&&pending.length;i++)gl.initTexture(pending.shift()!);if(pending.length)frame=requestAnimationFrame(warm);else compiled.current=true;}catch{useLibrary.getState().fail(index);}};
  const prepare=()=>{
   if(cancelled)return;
   // Compile against the captured studio, after its portal lights have mounted.
   if(!scene.environment?.pmremVersion){frame=requestAnimationFrame(prepare);return;}
   gl.compileAsync(model,camera,scene).then(()=>{if(!cancelled)frame=requestAnimationFrame(warm);}).catch(()=>{if(!cancelled)useLibrary.getState().fail(index);});
  };
  frame=requestAnimationFrame(prepare);
  return()=>{cancelled=true;cancelAnimationFrame(frame);};
 },[gl,camera,scene,model,index]);
 useEffect(()=>{const gesture=libraryMotion.gestures[index];gesture.pitch=0;gesture.yaw=0;gesture.zoom=1;},[view.reset,index]);
 useFrame(({size},delta)=>{
  const g=group.current;if(!g||!compiled.current)return;
  const state=useLibrary.getState(),phase=state.phase,selected=state.active===index;
  const dt=Math.min(delta,.05),h=size.height,w=size.width,upp=2*camera.position.z*Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov/2))/h;
  const frustum=upp*w/(2*camera.position.z)*.94;
  const row=libraryMotion.shelfRows[index];
  const shelfX=row?(row.left+row.width/2-w/2)*upp:0;
  const shelfFrustum=w<900&&row?upp*row.width/(2*camera.position.z):frustum;
  const shelfCenter=w<900?shelfX/camera.position.z:0;
  const isShelf=phase==='shelf'||phase==='preparing';
  const transitioning=phase==='entering'||phase==='leaving';
  const gesture=libraryMotion.gestures[index];
  let targetScale=1,visible=true;
  if(isShelf||phase==='leaving'){
   if(!row){g.visible=false;return;}
   motion.target.set(shelfX,(h/2-(row.top+row.height/2-window.scrollY))*upp,0);
   targetScale=Math.min(w*(w<700?.86:.49),1100)*upp/2.35;
   motion.q.setFromAxisAngle(axis,useShelf.getState().hovered===index?.18:.08).multiply(shelfRotation);
   targetScale=fitBookWidth(targetScale,motion.target,motion.q,spec,camera.position.z,shelfFrustum,motion.corner,shelfCenter);
   visible=Math.abs(motion.target.y)<h*upp*.72;
  }else{
   const stage=libraryMotion.stages[index];
   if(!stage){g.visible=false;return;}
   const rect=stage.getBoundingClientRect();
   const expanded=state.expanded&&selected;
   const reading=expanded&&state.readMode,single=reading&&w<700;
   const area=reading?{left:w*.04,top:92,width:w*.92,height:Math.max(160,h-214)}:expanded?{left:w*.03,top:h*.06,width:w*.94,height:h*.84}:rect;
   const spread=view.open||mechanics.hinge.angle<-.08||!mechanics.paper.atRest;
   // Camera clearance leads the opening cover and stays until the leaf is seated.
   easing.damp(motion,'spread',spread?1:0,spread?.10:.25,dt);
   const openWidth=1.12+1.12*motion.spread,openHeight=1.05+.54*motion.spread;
   const ribbon=spec.binding==='Paperback'?0:.29,clearance=0;
   targetScale=Math.min((area.height-clearance)/(spec.height*openHeight+ribbon),area.width/(spec.width*openWidth))*upp*gesture.zoom;
   motion.target.set((area.left+area.width/2-w/2)*upp+spec.width*.46*motion.spread*targetScale,(h/2-area.top-(area.height-clearance)/2)*upp+ribbon*.5*targetScale,0);
   if(view.spin&&!gesture.dragging&&!reduce&&active)gesture.yaw+=dt*.13;
   const pose=spread?[.22,-.10,-.025]:view.pose==='cover'?[0,0,0]:view.pose==='back'?[0,Math.PI,0]:view.pose==='spine'?[.03,1.42,0]:[w<700?-.32:-.40,.38,w<700?.10:.12];
   motion.rotation.set(pose[0]+gesture.pitch,pose[1]+gesture.yaw,pose[2]);motion.q.setFromEuler(motion.rotation);
   if(reading){
    // Frame the printed surface, preserving the same book, binding and live leaf.
    const left=state.readSide==='left';
    const leafTilt=Math.PI+mechanics.paper.turnAngle;
    motion.rotation.set(0,single?(left?-leafTilt:0):-leafTilt/2,0);motion.q.setFromEuler(motion.rotation);
    targetScale=Math.min(area.height/(spec.height*(single?.96:1.06)),area.width/(spec.width*(single?.94:1.9)))*upp*state.readZoom;
    const leaf=mechanics.leaf;
    motion.readCenter.set(0,0,0);
    if(leaf){
     const center=mechanics.paper.turnedCenter;
     if(single&&left)motion.readCenter.fromArray(center).multiplyScalar(10);else if(single)motion.readCenter.x=mechanics.paper.width*.5*10;else motion.readCenter.set((center[0]+mechanics.paper.width*.5)*5,0,center[2]*5);
     // The leaf lives relative to the spine, inside the Blender book group.
     leaf.localToWorld(motion.readCenter);model.worldToLocal(motion.readCenter);motion.readCenter.applyMatrix4(model.matrix);
    }
    motion.readCenter.applyQuaternion(motion.q).multiplyScalar(targetScale);
    motion.target.set(-motion.readCenter.x+libraryMotion.readPan.x*w*upp,(h/2-area.top-area.height/2)*upp-motion.readCenter.y+libraryMotion.readPan.y*h*upp,-motion.readCenter.z);
   }
   visible=rect.bottom>-h*.15&&rect.top<h*1.15&&(!state.expanded||selected);
  }
  if(motion.revision!==state.revision||motion.phase!==phase){
   motion.fromVisible=motion.visible;
   motion.from.copy(motion.visible?g.position:motion.target);motion.fromQ.copy(motion.visible?g.quaternion:motion.q);
   motion.fromScale=motion.visible?g.scale.x:targetScale;motion.revision=state.revision;motion.phase=phase;
   if(phase==='entering'&&row){
    // A keyboard/browser scroll can reach a row before the next canvas frame.
    motion.from.set(shelfX,(h/2-(row.top+row.height/2-state.shelfScroll))*upp,0);
    motion.fromQ.setFromAxisAngle(axis,useShelf.getState().hovered===index?.18:.08).multiply(shelfRotation);
    motion.fromScale=Math.min(w*(w<700?.86:.49),1100)*upp/2.35;
    motion.fromScale=fitBookWidth(motion.fromScale,motion.from,motion.fromQ,spec,camera.position.z,shelfFrustum,motion.corner,shelfCenter);
    motion.fromVisible=selected||Math.abs(motion.from.y)<h*upp*.72;
   }
  }
  if(transitioning){
   const duration=phase==='entering'?BOOK_ARRIVAL_SECONDS:BOOK_RETURN_SECONDS;
   const t=reduce?1:Math.min(1,libraryMotion.travel.elapsed/duration);
   const side=index<state.active?1:-1;
   const neighbour=libraryMotion.shelfRows[state.active-side];
   const neighbourY=neighbour?(h/2-(neighbour.top+neighbour.height/2-state.shelfScroll))*upp:0;
   // Park each half just beyond the viewport, preserving spacing within the half.
   const clearDistance=Math.max(h*upp*.16,h*upp*.66-side*neighbourY);
   if(phase==='entering'){
    if(selected){
     // Pull straight out before turning. Neighbours clear during extraction.
     motion.dock.copy(motion.from);motion.dock.z+=(spec.width+spec.depth)*motion.fromScale+.25;
     const turn=bookEase((t-.36)/.64);
     if(!motion.fromVisible)g.position.copy(motion.target);
     else if(t<.36)g.position.lerpVectors(motion.from,motion.dock,bookEase(t/.36));
     else g.position.lerpVectors(motion.dock,motion.target,turn);
     g.quaternion.slerpQuaternions(motion.fromQ,motion.q,turn);
     g.scale.setScalar(THREE.MathUtils.lerp(motion.fromScale,targetScale,turn));
    }else{
     g.position.copy(motion.from);g.position.y+=side*clearDistance*bookEase(t/.32);
     g.quaternion.copy(motion.fromQ);g.scale.setScalar(motion.fromScale);
    }
    g.visible=selected||(motion.fromVisible&&t<1);
   }else{
    if(selected){
     // Align in front of an empty slot, insert, then let the stack settle.
     motion.dock.copy(motion.target);motion.dock.z+=(spec.width+spec.depth)*targetScale+.25;
     const align=bookEase((t-.12)/.32),insert=bookEase((t-.44)/.20);
     if(t<.44)g.position.lerpVectors(motion.from,motion.dock,align);
     else g.position.lerpVectors(motion.dock,motion.target,insert);
     g.quaternion.slerpQuaternions(motion.fromQ,motion.q,align);
     g.scale.setScalar(THREE.MathUtils.lerp(motion.fromScale,targetScale,align));
    }else if(t<.12&&motion.fromVisible){
     g.position.copy(motion.from);g.position.y+=side*h*upp*2*bookEase(t/.12);
     g.quaternion.copy(motion.fromQ);g.scale.setScalar(motion.fromScale);
    }else{
     g.position.copy(motion.target);g.position.y+=side*clearDistance*(1-bookEase((t-.64)/.36));
     g.quaternion.copy(motion.q);g.scale.setScalar(targetScale);
    }
    g.visible=selected||motion.fromVisible||visible;
   }
   if(selected)g.scale.setScalar(fitBookWidth(g.scale.x,g.position,g.quaternion,spec,camera.position.z,frustum,motion.corner));
   if(t===1&&selected){const revision=state.revision;queueMicrotask(()=>{const s=useLibrary.getState();if(s.phase===phase&&s.revision===revision)s.set({phase:phase==='entering'?'reading':'shelf'});});}
  }else{
   if(state.expanded&&state.readMode&&!reduce&&motion.visible)easing.damp3(g.position,motion.target,.24,dt);else g.position.copy(motion.target);
   if(reduce||!motion.visible)g.quaternion.copy(motion.q);else easing.dampQ(g.quaternion,motion.q,gesture.dragging?.06:.22,dt);
   if(reduce||!motion.visible)g.scale.setScalar(targetScale);else {easing.damp(motion,'scale',targetScale,.12,dt);g.scale.setScalar(motion.scale);}
   g.visible=visible;
  }
  motion.scale=g.scale.x;motion.visible=g.visible;
  model.userData.libraryPhase=phase;model.userData.spread=motion.spread;
  if(phase==='closing'&&selected&&Math.abs(mechanics.hinge.angle)<.012&&mechanics.paper.atRest){
   const revision=state.revision;queueMicrotask(()=>{const s=useLibrary.getState();if(s.phase==='closing'&&s.revision===revision)s.set({phase:'leaving',revision:revision+1});});
  }
  if(!reported.current){reported.current=true;queueMicrotask(()=>useLibrary.getState().prepared(index));}
 });
 useRibbonMechanics(model,slug);
 return <group ref={group} visible={false} name={`Library book ${slug}`}><primitive object={model}/>{active&&entered&&<BookBoundary index={index}><Suspense fallback={null}><FinePrint model={model} slug={slug}/></Suspense></BookBoundary>}</group>;
}

function Books(){
 const reduce=useReducedMotion();
 const requested=useLibrary(s=>s.requested),ready=useLibrary(s=>s.ready),failed=useLibrary(s=>s.failed),retries=useLibrary(s=>s.retries),active=useLibrary(s=>s.active);
 const shelfMode=useLibrary(s=>s.phase==='shelf'||s.phase==='preparing'||s.phase==='leaving');
 const pending=[active,...requested.filter(i=>i!==active)].filter(i=>requested.includes(i)&&!ready.includes(i)&&!failed.includes(i));
 const next=pending.slice(0,2),ahead=pending.slice(2,4).join(',');
 useEffect(()=>{if(ahead)for(const i of ahead.split(',').map(Number))useGLTF.preload(bookModelUrl(BOOKS[i].slug,'library'),true,true,configureBookLoader);},[ahead]);
 // One clock keeps all loaded volumes in the same stage of the choreography.
 useFrame(({scene},delta)=>{
  const state=useLibrary.getState(),travel=libraryMotion.travel;
  if(travel.phase!==state.phase||travel.revision!==state.revision){travel.phase=state.phase;travel.revision=state.revision;travel.elapsed=0;}
  travel.elapsed+=delta;
  // Settle the reflected studio during straight extraction, before the case turns.
  // Rotating both together sweeps the overhead softbox across a corner as a flash.
  let picker=state.phase==='shelf'||state.phase==='preparing'?1:0;
  if(state.phase==='entering')picker=reduce?0:1-bookEase(travel.elapsed/BOOK_ARRIVAL_SECONDS/.30);
  if(state.phase==='leaving')picker=reduce?1:bookEase((travel.elapsed/BOOK_RETURN_SECONDS-.46)/.18);
  scene.environmentRotation.set(-.65*picker,.75*picker,.25*picker);
  scene.environmentIntensity=1+.1*picker;
 },-1);
 // The picker has reflected studio light without shadows between neighbouring books.
 return <><BookLighting castShadows={!shelfMode}/>{BOOKS.map((b,i)=>(ready.includes(i)||next.includes(i))&&<BookBoundary key={b.slug+'-'+(retries[i]||0)} index={i}><Suspense fallback={null}><LibraryBook index={i}/></Suspense></BookBoundary>)}</>;
}

export default function LibraryScene(){
 // A tight depth range resolves the two faces of a 0.1 mm title sheet.
 return <Canvas className="library-canvas" shadows dpr={[1,2]} camera={{position:[0,0,18],fov:20,near:1,far:60}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} onCreated={({scene,gl,camera})=>{
  if(process.env.NODE_ENV==='development')Object.assign(window,{__libraryReview:{scene,gl,camera,store:useLibrary,motion:libraryMotion}});
 }}><Books/></Canvas>;
}
