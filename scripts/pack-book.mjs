/** Produce the three web variants in a NEW staging directory. No live writes. */
import {parseArgs} from 'node:util';
import {readFile,writeFile,mkdir,lstat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS,EXTMeshoptCompression,EXTTextureWebP} from '@gltf-transform/extensions';
import {prune} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import sharp from 'sharp';

const {values}=parseArgs({options:{input:{type:'string'},spec:{type:'string'},out:{type:'string'},help:{type:'boolean'}}});
if(values.help || !values.input || !values.spec || !values.out){
 console.log('node scripts/pack-book.mjs --input .tmp/naval.glb --spec blender/specs/naval.json --out .tmp/naval-web');
 process.exit(values.help?0:1);
}
const spec=JSON.parse(await readFile(resolve(values.spec),'utf8'));
assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(spec.slug),'Use a kebab-case slug.');
assert(spec.dimensionsMm?.length===3 && spec.dimensionsMm.every(n=>Number.isFinite(n)&&n>0),'dimensionsMm must be [width, height, depth].');
for(const field of ['width','height','depth','boardMm','modeledPages'])assert(Number.isFinite(spec[field]) && spec[field]>0,`Missing numeric ${field}`);
assert(spec.sourceUrl && spec.dimensionNote && spec.binding,'Record source, dimension qualification and binding.');
const output=resolve(values.out),models=resolve(output,'public/models/optimized');
try{await lstat(output);throw Error('Output directory already exists. Choose a fresh staging directory.');}catch(error){if(error.code!=='ENOENT')throw error;}
await mkdir(resolve(models,'shared'),{recursive:true});
await MeshoptEncoder.ready;await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const input=await readFile(resolve(values.input));
const converted=new Map(),report=[];
for(const variant of ['detail','library','shelf']){
 const doc=await io.readBinary(input),removed=[];
 if(variant==='shelf'){
  for(const node of [...doc.getRoot().listNodes()])if(/^(TurningLeaf|Interior |Front pastedown|Back pastedown)/.test(node.getName())){
   const tree=[];node.traverse(n=>tree.push(n));for(const child of tree.reverse()){removed.push(child.getName());child.dispose();}
  }
  await doc.transform(prune({keepExtras:true}));
 }
 let hasWebP=false;
 for(const texture of doc.getRoot().listTextures()){
  const source=texture.getImage();assert(source,'Missing embedded texture');
  // Keep cover printing at 2K during travel. Material maps can use smaller mips.
  const size=/edition|cover|spine|back|print|artwork/i.test(texture.getName())?2048:1024;
  const key=hash(source)+(variant==='detail'?'original':size);
  if(!converted.has(key)){
   const metadata=await sharp(source).metadata();
   const raster=variant!=='detail' && (metadata.width>size || metadata.height>size)?await sharp(source).resize({width:size,height:size,fit:'inside',withoutEnlargement:true}).png().toBuffer():source;
   const webp=await sharp(raster).webp({lossless:true,effort:5}).toBuffer();
   const bytes=webp.length<raster.length?webp:raster;
   const mime=bytes===webp?'image/webp':raster===source?texture.getMimeType():'image/png';
   const a=await sharp(raster).ensureAlpha().raw().toBuffer(),b=await sharp(bytes).ensureAlpha().raw().toBuffer();
   assert(a.equals(b),'Lossless texture encoding changed pixels.');
   converted.set(key,{bytes,mime});
  }
  const {bytes,mime}=converted.get(key);hasWebP ||= mime==='image/webp';
  const ext={'image/webp':'webp','image/jpeg':'jpg','image/png':'png'}[mime];assert(ext,'Unsupported image type');
  texture.setImage(bytes).setMimeType(mime).setURI('shared/'+hash(bytes).slice(0,24)+'.'+ext);
 }
 if(hasWebP)doc.createExtension(EXTTextureWebP).setRequired(true);
 // No quantize, simplify or weld transform: original float arrays are retained.
 doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
 const result=await io.writeJSON(doc);
 for(const buffer of result.json.buffers||[])if(buffer.uri){
  const bytes=result.resources[buffer.uri];buffer.uri='shared/'+hash(bytes).slice(0,24)+'.bin';
  await writeFile(resolve(models,buffer.uri),bytes);
 }
 for(const image of result.json.images||[]){
  const bytes=result.resources[image.uri];await writeFile(resolve(models,image.uri),bytes);
  await writeFile(resolve(models,image.uri)+'.json',JSON.stringify({sourceUrl:spec.sourceUrl,artworkSourceUrl:spec.coverUrl||null,rights:'See edition research and asset notices. Encoding does not grant reuse rights.',sha256:hash(bytes)},null,2)+'\n');
 }
 const name=spec.slug+(variant==='detail'?'':'-'+variant)+'.gltf',data=JSON.stringify(result.json);
 assert(!/\/Users\/|\/home\/|[A-Z]:\\\\/.test(data),'Remove workstation paths from Blender custom properties before export.');
 await writeFile(resolve(models,name),data);
 const decoded=await io.read(resolve(models,name));
 const expected=doc.getRoot().listMeshes(),actual=decoded.getRoot().listMeshes();
 assert.equal(actual.length,expected.length,'Mesh count changed');
 for(let m=0;m<expected.length;m++){
  assert.equal(actual[m].listPrimitives().length,expected[m].listPrimitives().length);
  for(let p=0;p<expected[m].listPrimitives().length;p++){
   const a=expected[m].listPrimitives()[p],b=actual[m].listPrimitives()[p];
   for(const semantic of a.listSemantics()){
    const x=a.getAttribute(semantic).getArray(),y=b.getAttribute(semantic)?.getArray();
    assert(y && x.length===y.length && x.every((v,i)=>v===y[i]),`Geometry changed: ${semantic}`);
   }
   const x=a.getIndices()?.getArray(),y=b.getIndices()?.getArray();
   assert.equal(Boolean(x),Boolean(y));assert.equal(x?.length,y?.length);
   if(x)for(let i=0;i<x.length;i+=3)assert([0,1,2].some(offset=>[0,1,2].every(k=>x[i+k]===y[i+(k+offset)%3])),'Triangle winding changed');
  }
 }
 const prefix=variant==='detail'?'runtime':variant;
 spec[prefix+'ModelUrl']='/models/optimized/'+name;spec[prefix+'Sha256']=hash(data);
 report.push({variant,meshes:actual.length,removed,geometryLossless:true,textureEncodingLossless:true,textureResolution:variant==='detail'?'original':'2048px printing / 1024px materials',sha256:hash(data)});
 console.log(`${spec.slug}: ${variant} verified`);
}
spec.modelSha256=hash(input);
await writeFile(resolve(output,'model-record.json'),JSON.stringify(spec,null,2)+'\n');
await writeFile(resolve(output,'verification.json'),JSON.stringify(report,null,2)+'\n');
console.log('Staged successfully. Review the rendered result before installing files and model-record.json into your library.');
