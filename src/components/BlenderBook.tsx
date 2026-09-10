"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import manifests from "@/lib/model-manifest.json";
import {assetUrl} from '@/lib/library-config';
import {configureBookLoader} from '@/lib/book-loader';

// ImageBitmapLoader otherwise downloads and decodes shared images per book.
THREE.Cache.enabled = true;
// Share GPU image storage as well as network/decode work across glTF parsers.
// Three keeps separate sampler/color-space variants where they are required.
const imageSources=new WeakMap<object,THREE.Texture['source']>();
export function shareTextureSource(texture:THREE.Texture){
 const data=texture.source.data;
 if(!data||typeof data!=='object')return;
 const source=imageSources.get(data);
 if(source)texture.source=source;else imageSources.set(data,texture.source);
 texture.anisotropy=8;
}

export function bookModelUrl(slug:string,variant:'detail'|'shelf'|'library'='detail'){
  const spec=getModelSpec(slug);
  const url=variant==='library'?spec.libraryModelUrl:variant==='shelf'?spec.shelfModelUrl:spec.runtimeModelUrl;
  const version=variant==='library'?spec.librarySha256:variant==='shelf'?spec.shelfSha256:spec.runtimeSha256;
  return `${assetUrl(url)}?v=${version.slice(0,12)}`;
}
export function preloadBook(slug:string){useGLTF.preload(bookModelUrl(slug),true,true,configureBookLoader);}
export function retryShelfBook(slug:string){useGLTF.clear(bookModelUrl(slug,'shelf'));}
export function retryLibraryBook(slug:string){useGLTF.clear(bookModelUrl(slug,'library'));}
export function useBookModel(slug: string,variant:'detail'|'shelf'|'library'='detail') {
  const model = useGLTF(bookModelUrl(slug,variant),true,true,configureBookLoader);
  const scene = useMemo(() => {
    const copy = model.scene.clone(true);
    copy.userData.modelSlug = slug;
    copy.userData.modelSha256 = getModelSpec(slug).modelSha256;
    copy.userData.runtimeSha256 = variant==='library'?getModelSpec(slug).librarySha256:variant==='shelf'?getModelSpec(slug).shelfSha256:getModelSpec(slug).runtimeSha256;
    copy.userData.variant = variant;
    // glTF stores true metres; the display stage uses decimetres.
    copy.scale.setScalar(10);
    copy.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        if (o.name.startsWith("Interior") || o.name.startsWith("Curved_title") || o.name.startsWith("Curved title") || o.name.startsWith("Ribbon")) {
          o.geometry = o.geometry.clone();
          o.userData.ownedGeometry = true;
        }
        // Sub-millimetre leaf edges are below the shadow map's sampling scale.
        o.castShadow = !/^(Individually[_ ]cut[_ ]paper|Compressed[_ ]paper|Continuous[_ ]compressed[_ ]cut|Interior|Spine_(title|author)|Collection_mark|Back_(title|description|collection|edition|ISBN))/.test(o.name);
        o.receiveShadow = true;
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        o.material = materials.map((m) => {
          const material = m.clone() as THREE.MeshStandardMaterial;
          for(const value of Object.values(material))if(value instanceof THREE.Texture)shareTextureSource(value);
          material.envMapIntensity = 1;
          return material;
        });
        if (o.material.length === 1) o.material = o.material[0];
      }
    });
    return copy;
  }, [model.scene, slug, variant]);
  useEffect(() => () => {
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        if (o.userData.ownedGeometry) o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      }
    });
  }, [scene]);
  return scene;
}
export function getModelSpec(slug: string) {
  return manifests.find((b) => b.slug === slug)!;
}
