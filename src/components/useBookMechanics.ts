"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BookHinge, PaperDynamics } from "@/lib/book-physics";
import { getModelSpec } from "./BlenderBook";
import {useReducedMotion} from './useReducedMotion';

type Surface = { mesh: THREE.Mesh; source: Float32Array; offsets: Float32Array };
export function useBookMechanics(model: THREE.Group, slug: string, open: boolean, turned: boolean) {
  const reduced=useReducedMotion();
  const mechanism = useMemo(() => {
    const spec = getModelSpec(slug);
    const paperGap = (spec.paperGapMm ?? 1.1) / 1000;
    const hinge = new BookHinge(spec.width * .1, spec.height * .1, spec.boardMm / 1000);
    let cover: THREE.Object3D | undefined;
    let leaf: THREE.Object3D | undefined;
    model.traverse(object => {
      if (object.name.startsWith("FrontHinge")) cover = object;
      if (object.name.startsWith("TurningLeaf")) leaf = object;
    });
    const binding=cover&&leaf?{dx:(leaf.position.x-cover.position.x)*.1,dz:(leaf.position.z-cover.position.z)*.1,board:spec.boardMm/1000}:undefined;
    const paper = new PaperDynamics((spec.width - .075) * .1, (spec.height - .064) * .1, paperGap - (spec.binding === 'Paperback' ? .00005 : .00025),binding);
    const surfaces: Surface[] = [];
    leaf?.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const source = Float32Array.from(object.geometry.attributes.position.array);
      const offsets = new Float32Array(source.length / 3);
      const isText = object.name.startsWith("Interior");
      for (let i = 0; i < offsets.length; i++) {
        const x = source[i * 3], pw = paper.width * 10;
        const originalBow = Math.min(.025 * pw / 12 * (1 - Math.exp(-12 * Math.max(0, x / pw))), spec.binding === 'Paperback' ? paperGap * 10 * .35 : Infinity);
        offsets[i] = isText ? .000105 : (source[i * 3 + 2] - originalBow) * .1;
      }
      object.frustumCulled = false;
      surfaces.push({ mesh: object, source, offsets });
    });
    return { paper, hinge, cover, leaf, surfaces, turnOverride:null as boolean|null, previous: new Float64Array(paper.positions.length).fill(Infinity), point: [0, 0, 0], normal: [0, 0, 1] };
  }, [model, slug]);
  useEffect(() => {
    if (process.env.NODE_ENV === "development") Object.assign(window, { __bookReview: { model, mechanism } });
  }, [model, mechanism]);

  useFrame((_, delta) => {
    const { paper, hinge, cover, surfaces, point, normal } = mechanism;
    const target=mechanism.turnOverride??turned;
    if (reduced) { hinge.snap(open ? -2.75 : 0); paper.snap(open && target); }
    else {
      // A returning page must settle before the cover is allowed to close.
      hinge.step(open || !paper.atRest ? -2.75 : 0, delta);
      paper.step(delta, open && target, hinge.angle);
    }
    if (cover) cover.rotation.y = hinge.angle;
    if(mechanism.leaf)mechanism.leaf.visible=hinge.angle<-.008||!paper.atRest;
    let changed = false;
    for (let i = 0; i < paper.positions.length; i++) if (Math.abs(paper.positions[i] - mechanism.previous[i]) > 1e-7) { changed = true; break; }
    if (!changed) return;
    mechanism.previous.set(paper.positions);
    for (const { mesh, source, offsets } of surfaces) {
      const positions = mesh.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        paper.sample(source[i * 3] * .1 / paper.width, source[i * 3 + 1] * .1 / paper.height + .5, point, normal);
        positions.setXYZ(i, (point[0] + normal[0] * offsets[i]) * 10, point[1] * 10, (point[2] + normal[2] * offsets[i]) * 10);
      }
      positions.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      if (mesh.geometry.attributes.tangent && mesh.geometry.attributes.uv) mesh.geometry.computeTangents();
    }
  });
  return mechanism;
}
