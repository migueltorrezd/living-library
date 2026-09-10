import {Cache,ImageBitmapLoader} from 'three';
import type {GLTFLoader} from 'three-stdlib';

const configured=new WeakSet<GLTFLoader>();

/** Keep concurrent book parsers on the same decoded image, including on a cold cache. */
export function configureBookLoader(loader:GLTFLoader){
 if(configured.has(loader))return;
 configured.add(loader);
 loader.register(parser=>{
  let failure:Error|undefined;
  const images=parser.textureLoader;
  if(images instanceof ImageBitmapLoader){
   const load=images.load.bind(images);
   images.load=(url,onLoad,onProgress,onError)=>load(url,image=>{
    // Three r185's pending bitmap cache promise resolves without the image.
    // The completed bitmap is in Cache before its waiting consumers run.
    const bitmap=image??Cache.get(`image-bitmap:${images.manager.resolveURL(images.path+url)}`);
    if(bitmap?.width>0&&bitmap?.height>0)onLoad?.(bitmap);
    else{
     failure=new Error(`Book texture has no decoded image: ${url}`);
     onError?.(failure);
    }
   },onProgress,error=>{
    failure=error instanceof Error?error:new Error(`Book texture failed: ${url}`);
    onError?.(error);
   });
  }
  return {name:'BookBitmapCache',afterRoot:async()=>{
   // GLTFLoader otherwise tolerates a missing image and publishes a bare material.
   if(failure)throw failure;
  }};
 });
}
