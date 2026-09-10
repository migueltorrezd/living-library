"use client";

import { Environment, Lightformer } from "@react-three/drei";
import {memo} from 'react';

const StudioEnvironment=memo(function StudioEnvironment(){
 return <Environment resolution={512} frames={2} background={false}>
   <color attach="background" args={["#141417"]}/>
   <Lightformer form="rect" intensity={4.5} color="#fffaf0" position={[-4,3,5]} scale={[2.6,8,1]} target={[0,0,0]}/>
   <Lightformer form="rect" intensity={1.4} color="#e6edf7" position={[5,1,3]} scale={[5,7,1]} target={[0,0,0]}/>
   <Lightformer form="rect" intensity={2.5} color="#ffffff" position={[0,6,-2]} scale={[7,2,1]} target={[0,0,0]}/>
  </Environment>;
});

/** Rectangular studio sources give stamped ink a coherent reflected highlight. */
export function BookLighting({shelf=false,castShadows=!shelf}:{shelf?:boolean;castShadows?:boolean}) {
 return <>
  <StudioEnvironment/>
  <ambientLight intensity={.12}/>
  <directionalLight position={shelf?[-6,10,14]:[-3,5,4]} intensity={2.1} color="#fff7ec" castShadow={castShadows}
   shadow-mapSize={[4096,4096]} shadow-camera-left={-3} shadow-camera-right={3} shadow-camera-top={3} shadow-camera-bottom={-3}
   shadow-camera-near={.1} shadow-camera-far={20} shadow-bias={-.00002} shadow-normalBias={.002}/>
  <directionalLight position={[5,2,-3]} intensity={.65} color="#e0e8f6"/>
 </>;
}
