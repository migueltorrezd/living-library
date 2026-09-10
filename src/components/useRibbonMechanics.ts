"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RibbonDynamics } from "@/lib/ribbon-physics";
import { getModelSpec } from "./BlenderBook";
import {useReducedMotion} from './useReducedMotion';

export function useRibbonMechanics(model: THREE.Group, slug: string) {
  const reduced=useReducedMotion();
  const state = useMemo(() => {
    let mesh: THREE.Mesh | undefined, cover: THREE.Object3D | undefined;
    model.traverse(o => { if (o instanceof THREE.Mesh && o.name.startsWith("Ribbon")) mesh=o; if(o.name.startsWith("FrontHinge"))cover=o; });
    if(!mesh)return null;
    const spec=getModelSpec(slug);
    const simulation=new RibbonDynamics(spec.width*.1,spec.height*.1,spec.depth*.1,spec.boardMm/1000,((spec as {paperGapMm?:number}).paperGapMm??1.1)/1000);
    const source=Float32Array.from(mesh.geometry.attributes.position.array);
    const uv=mesh.geometry.attributes.uv;
    const params=new Float32Array(source.length);
    for(let i=0;i<source.length/3;i++) {
      const z=source[i*3+2];
      const u=uv.getX(i),v=1-uv.getY(i);
      params[i*3]=(u-.5)*simulation.width;
      params[i*3+1]=v;
      params[i*3+2]=(z-(.006+.015*v*v))*.1;
    }
    mesh.frustumCulled=false;
    return {mesh,cover,simulation,params,revision:-1,q:new THREE.Quaternion(),cameraQ:new THREE.Quaternion(),point:[0,0,0],normal:[0,0,0]};
  },[model,slug]);
  useEffect(()=>{if(state)state.mesh.userData.ribbonSimulation=state.simulation;},[state]);

  // Run after the model's pose/hover transform without taking over rendering.
  useFrame(({camera},delta)=>{
    if(!state)return;
    const {mesh,cover,simulation,params,q,cameraQ,point,normal}=state;
    for(let parent:THREE.Object3D|null=mesh;parent;parent=parent.parent)if(!parent.visible)return;
    mesh.parent!.updateWorldMatrix(true,false);
    mesh.parent!.getWorldQuaternion(q);camera.getWorldQuaternion(cameraQ);
    q.premultiply(cameraQ.invert());
    simulation.step(delta,q.toArray(),cover?.rotation.y??0,reduced);
    if(state.revision===simulation.revision)return;
    state.revision=simulation.revision;
    const position=mesh.geometry.attributes.position;
    for(let i=0;i<position.count;i++) {
      const v=params[i*3+1],width=params[i*3],thickness=params[i*3+2];
      const notch=.0027*(1-Math.abs(width/(simulation.width/2)))*Math.max(0,(v-.94)/.06);
      simulation.sample(width/simulation.width+.5,v-notch/simulation.length,point,normal);
      position.setXYZ(i,(point[0]+normal[0]*thickness)*10,(point[1]+normal[1]*thickness)*10,(point[2]+normal[2]*thickness)*10);
    }
    position.needsUpdate=true;mesh.geometry.computeVertexNormals();
    if(mesh.geometry.attributes.tangent&&mesh.geometry.attributes.uv)mesh.geometry.computeTangents();
  });
  return state;
}
