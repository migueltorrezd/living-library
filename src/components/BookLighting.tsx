"use client";

import { Environment, Lightformer } from "@react-three/drei";
import {memo,useMemo} from 'react';
import * as THREE from 'three';
import studio from '@/lib/book-studio.json';

/**
 * A diffused softbox: full output in the middle, smoothstep falloff over the outer
 * band. Hard-edged rect sources reflected in glossy laminate as a straight dark
 * edge that swept across the cover while a book turned in or out of the shelf.
 */
function useSoftboxTexture(feather:number){
 return useMemo(()=>{
  const size=128,data=new Uint8Array(size*size*4);
  const ramp=(t:number)=>{const x=Math.min(1,Math.max(0,t/feather));return x*x*(3-2*x);};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const u=(x+.5)/size,v=(y+.5)/size,value=ramp(Math.min(u,1-u))*ramp(Math.min(v,1-v));
   const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=Math.round(value*255);data[i+3]=255;
  }
  const texture=new THREE.DataTexture(data,size,size);
  texture.colorSpace=THREE.NoColorSpace;texture.magFilter=texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;
  return texture;
 },[feather]);
}

const StudioEnvironment=memo(function StudioEnvironment(){
 const softbox=useSoftboxTexture(studio.feather);
 return <Environment resolution={512} frames={2} background={false}>
   <color attach="background" args={["#141417"]}/>
   {studio.softboxes.map((s,i)=><Lightformer key={i} form="rect" map={softbox} intensity={s.intensity} color={s.color}
    position={s.position as [number,number,number]} scale={s.scale as [number,number,number]} target={[0,0,0]}/>)}
  </Environment>;
});

/** Diffused rectangular studio sources give stamped ink a coherent, soft reflected highlight. */
export function BookLighting({shelf=false,castShadows=!shelf}:{shelf?:boolean;castShadows?:boolean}) {
 return <>
  <StudioEnvironment/>
  <ambientLight intensity={.12}/>
  <directionalLight position={shelf?[-6,10,14]:[-3,5,4]} intensity={2.1} color="#fff7ec" castShadow={castShadows}
   shadow-mapSize={[4096,4096]} shadow-camera-left={-3} shadow-camera-right={3} shadow-camera-top={3} shadow-camera-bottom={-3}
   shadow-camera-near={.1} shadow-camera-far={20} shadow-bias={-.00002} shadow-normalBias={.002}/>
  <directionalLight position={[5,2,-3]} intensity={.65} color="#e0e8f6"/>
  {/* Warm bounce from a pale surface below: page edges and board undersides read as paper, not shadow. */}
  <directionalLight position={[-1,-6,3]} intensity={.65} color="#fff4e6"/>
 </>;
}
