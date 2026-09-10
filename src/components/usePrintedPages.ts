"use client";

import {useEffect,useMemo,useRef,useState} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {READING_EDITIONS,readMark,readingKey} from '@/lib/reading';
import {PaperDynamics} from '@/lib/book-physics';
import {emptyPrint,useBookPrint} from '@/store/useBookPrint';
import type {PrintedSource} from '@/lib/printed-pages';
import type {useBookMechanics} from './useBookMechanics';
import {useReducedMotion} from './useReducedMotion';

type Paper={mesh:THREE.Mesh;front:THREE.MeshStandardMaterial;back:THREE.MeshStandardMaterial;base:THREE.MeshStandardMaterial;width:number;height:number};
const preparedPapers=new WeakMap<THREE.Group,Paper>();
/** Give the existing flexible Blender leaf separate ink on each real face. */
export function usePrintedPaper(model:THREE.Group,slug:string):Paper|null{
 return useMemo(()=>{
  if(!READING_EDITIONS[slug])return null;
  const existing=preparedPapers.get(model);if(existing)return existing;
  let mesh:THREE.Mesh|undefined;model.traverse(o=>{if(o instanceof THREE.Mesh&&/^Curved[_ ]title[_ ]leaf/.test(o.name))mesh=o;});
  if(!mesh)return null;
  const base=(Array.isArray(mesh.material)?mesh.material[0]:mesh.material) as THREE.MeshStandardMaterial;
  const front=base.clone(),back=base.clone();front.name='Printed leaf front';back.name='Printed leaf reverse';
  front.side=THREE.FrontSide;back.side=THREE.FrontSide;
  front.userData.interiorPrint=true;back.userData.interiorPrint=true;
  const original=mesh.geometry,geometry=original.index?original.toNonIndexed():original.clone();original.dispose();
  geometry.computeBoundingBox();const bounds=geometry.boundingBox!,width=bounds.max.x,height=bounds.max.y-bounds.min.y;
  const position=geometry.attributes.position,normal=geometry.attributes.normal,uv=new Float32Array(position.count*2);geometry.clearGroups();
  let start=0,last=-1;
  for(let i=0;i<position.count;i+=3){
   const z=(normal.getZ(i)+normal.getZ(i+1)+normal.getZ(i+2))/3,side=z>.3?0:z<-.3?1:2;
   if(side!==last){if(i>start)geometry.addGroup(start,i-start,last);start=i;last=side;}
   for(let j=i;j<i+3;j++){const u=position.getX(j)/width;uv[j*2]=side===1?1-u:u;uv[j*2+1]=(position.getY(j)-bounds.min.y)/height;}
  }
  geometry.addGroup(start,position.count-start,last);geometry.setAttribute('uv2',new THREE.BufferAttribute(uv,2));
  mesh.geometry=geometry;mesh.material=[front,back,base];mesh.userData.ownedGeometry=true;
  const paper={mesh,front,back,base,width,height};preparedPapers.set(model,paper);return paper;
 },[model,slug]);
}

type Mechanism=ReturnType<typeof useBookMechanics>;
function restingSheet(paper:Paper,dynamics:PaperDynamics,left:boolean){
 const geometry=new THREE.PlaneGeometry(paper.width,paper.height,40,12),positions=geometry.attributes.position;
 // A turned sheet exposes its reverse. Give that printed surface its own
 // outward winding so the shadow bias points away from the inside cover.
 if(left){const indices=geometry.index!;for(let i=0;i<indices.count;i+=3){const b=indices.getX(i+1);indices.setX(i+1,indices.getX(i+2));indices.setX(i+2,b);}}
 const uv=new Float32Array(positions.count*2),stock=new Float32Array(positions.count*2),point=[0,0,0],normal=[0,0,1];
 dynamics.snap(left);
 for(let i=0;i<positions.count;i++){
  const u=positions.getX(i)/paper.width+.5,v=positions.getY(i)/paper.height+.5;
  uv[i*2]=left?1-u:u;uv[i*2+1]=v;stock[i*2]=(u*paper.width)/3+.43;stock[i*2+1]=((v-.5)*paper.height)/3+.37;
  dynamics.sample(u,v,point,normal);
  const offset=left?.00012:-.000025;
  positions.setXYZ(i,(point[0]+normal[0]*offset)*10,point[1]*10,(point[2]+normal[2]*offset)*10);
 }
 geometry.setAttribute('uv',new THREE.BufferAttribute(stock,2));geometry.setAttribute('uv2',new THREE.BufferAttribute(uv,2));geometry.computeVertexNormals();
 const material=paper.base.clone();material.name=left?'Printed seated left page':'Printed underlying right page';material.userData.interiorPrint=true;material.side=THREE.FrontSide;
 const mesh=new THREE.Mesh(geometry,material);mesh.name=left?'Printed_left_page':'Printed_right_page';mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=false;
 return mesh;
}

export function usePrintedPages(model:THREE.Group,slug:string,paper:ReturnType<typeof usePrintedPaper>,mechanics:Mechanism,open:boolean,active:boolean){
 const {gl}=useThree(),reduce=useReducedMotion(),[activated,setActivated]=useState(false);
 const retry=useBookPrint(s=>s.books[slug]?.retry||0);
 const control=useRef<{source:PrintedSource;left:THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>;right:THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>;dynamics:PaperDynamics;leftAngle:number;point:number[];normal:number[];textures:THREE.CanvasTexture[];page:number;request:number;running:1|-1|0;elapsed:number;pending:boolean;disposed:boolean;setPages:(page:number,turn?:1|-1)=>Promise<void>}|null>(null);
 useEffect(()=>{
  if(!activated||!paper||!mechanics.leaf)return;
  let cancelled=false;const abort=new AbortController(),edition=READING_EDITIONS[slug];
  useBookPrint.getState().update(slug,{status:'loading',turning:false});
  const dynamics=new PaperDynamics(mechanics.paper.width,mechanics.paper.height,mechanics.paper.coverClearance,mechanics.paper.binding),left=restingSheet(paper,dynamics,true),right=restingSheet(paper,dynamics,false);
  left.visible=false;right.visible=false;mechanics.leaf.add(left,right);
  const text:THREE.Object3D[]=[];mechanics.leaf.traverse(o=>{if(o.name.startsWith('Interior'))text.push(o);});
  let source:PrintedSource|undefined;
  const persist=(page:number,total:number)=>{try{localStorage.setItem(readingKey(slug,edition.version),JSON.stringify({page,total,fraction:Math.min(total,page+1)/total,updatedAt:Date.now()}));}catch{/* Printing and turning remain available without storage. */}};
  async function load(){
   try{
    const {loadPrintedSource}=await import('@/lib/printed-pages');if(cancelled)return;
    source=await loadPrintedSource(slug,paper!.height/paper!.width,abort.signal);if(cancelled){source.dispose();return;}
    const sourceReady=source;
    const current=Math.min(source.total+source.total%2-1,Math.max(1,Math.floor(((readMark(slug,edition.version)?.page||1)-1)/2)*2+1));
    const state={source,left,right,dynamics,leftAngle:Infinity,point:[0,0,0],normal:[0,0,1],textures:[] as THREE.CanvasTexture[],page:current,request:useBookPrint.getState().books[slug]?.request||0,running:0 as 1|-1|0,elapsed:0,pending:false,disposed:false,setPages:async(page:number,turn?:1|-1)=>{
     const frontPage=turn===-1?page-2:page,backPage=frontPage+1,rightPage=turn===1?page+2:page,leftPage=turn===-1?page-3:page-1;
     const canvases=await Promise.all([frontPage,backPage,rightPage,leftPage].map(index=>sourceReady.page(index)));if(cancelled)return;
     const textures=canvases.map(canvas=>{const texture=new THREE.CanvasTexture(canvas);texture.channel=2;texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,gl.capabilities.getMaxAnisotropy());gl.initTexture(texture);return texture;});
     [paper!.front,paper!.back,right.material,left.material].forEach((material,i)=>{material.map=textures[i];material.needsUpdate=true;});
     const previous=state.textures;state.textures=textures;previous.forEach(texture=>texture.dispose());
     text.forEach(o=>{o.visible=false;});right.visible=true;left.visible=leftPage>=0;
     if(!turn)useBookPrint.getState().update(slug,{text:[canvases[3].dataset.printText||'',canvases[0].dataset.printText||'']});
    }};
    control.current=state;await state.setPages(current);if(cancelled)return;
    if(process.env.NODE_ENV==='development')Object.assign(window,{__printedBookReview:{slug,source:sourceReady,state,mechanics}});
    model.userData.printedPages={page:current,total:source.total,turning:false};
    useBookPrint.getState().update(slug,{status:'ready',page:current,total:source.total,turning:false});persist(current,source.total);
   }catch{if(!cancelled)useBookPrint.getState().update(slug,{status:'error',turning:false});}
  }
  void load();
  return()=>{cancelled=true;abort.abort();source?.dispose();mechanics.turnOverride=null;const state=control.current;if(state){state.disposed=true;state.textures.forEach(texture=>texture.dispose());}control.current=null;mechanics.leaf?.remove(left,right);left.geometry.dispose();right.geometry.dispose();left.material.dispose();right.material.dispose();paper.front.map=paper.base.map;paper.back.map=paper.base.map;paper.front.needsUpdate=true;paper.back.needsUpdate=true;text.forEach(o=>{o.visible=true;});};
 },[activated,retry,paper,mechanics,model,slug,gl]);

 useFrame((_,delta)=>{
  if((active||open)&&paper&&!activated){setActivated(true);return;}
  const state=control.current;if(!state||state.disposed)return;
  const leftAngle=Math.max(state.dynamics.turnAngle,mechanics.hinge.angle);
  if(Math.abs(leftAngle-state.leftAngle)>1e-5){
   state.leftAngle=leftAngle;state.dynamics.snapAngle(leftAngle);
   const positions=state.left.geometry.attributes.position,uv=state.left.geometry.attributes.uv2;
   for(let i=0;i<positions.count;i++){state.dynamics.sample(1-uv.getX(i),uv.getY(i),state.point,state.normal);positions.setXYZ(i,(state.point[0]+state.normal[0]*.00012)*10,state.point[1]*10,(state.point[2]+state.normal[2]*.00012)*10);}
   positions.needsUpdate=true;state.left.geometry.computeVertexNormals();
  }
  const status=useBookPrint.getState().books[slug]||emptyPrint;
  if(!open){
   mechanics.turnOverride=false;
   if(state.running&&mechanics.paper.atRest&&!state.pending){state.running=0;state.pending=true;void state.setPages(state.page).catch(()=>{if(!state.disposed)useBookPrint.getState().update(slug,{status:'error'});}).finally(()=>{state.pending=false;if(!state.disposed)useBookPrint.getState().update(slug,{turning:false});});}
   return;
  }
  if(!state.running&&!state.pending&&status.request!==state.request){
   state.request=status.request;state.pending=true;
   void state.setPages(state.page,status.direction).then(()=>{
    if(state.disposed)return;
    state.running=status.direction;state.elapsed=0;mechanics.paper.snap(status.direction===-1);mechanics.previous.fill(Infinity);mechanics.turnOverride=status.direction===1;model.userData.printedPages={page:state.page,total:state.source.total,turning:true};
   }).catch(()=>{if(!state.disposed)useBookPrint.getState().update(slug,{status:'error',turning:false});}).finally(()=>{state.pending=false;});
  }
  if(!state.running)return;
  state.elapsed+=Math.min(delta,.05);
  const landed=state.running===1?mechanics.paper.atTurnedRest:mechanics.paper.atRest;
  if(!state.pending&&landed&&(reduce||state.elapsed>.65)){
   const next=Math.max(1,Math.min(state.source.total+state.source.total%2-1,state.page+state.running*2));state.pending=true;
   void state.setPages(next).then(()=>{
    if(state.disposed)return;
    state.page=next;state.running=0;mechanics.paper.snap(false);mechanics.previous.fill(Infinity);mechanics.turnOverride=false;
    const edition=READING_EDITIONS[slug];try{localStorage.setItem(readingKey(slug,edition.version),JSON.stringify({page:next,total:state.source.total,fraction:Math.min(state.source.total,next+1)/state.source.total,updatedAt:Date.now()}));}catch{/* Device storage is optional. */}
    model.userData.printedPages={page:next,total:state.source.total,turning:false};useBookPrint.getState().update(slug,{page:next,turning:false});
   }).catch(()=>{if(!state.disposed)useBookPrint.getState().update(slug,{status:'error',turning:false});}).finally(()=>{state.pending=false;});
  }
 },-1);
}
