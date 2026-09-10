/** Download a referenced raster image or PDF with provenance, without overwrites. */
import {parseArgs} from 'node:util';
import {createHash} from 'node:crypto';
import {mkdir, writeFile, lstat} from 'node:fs/promises';
import {dirname, resolve, extname} from 'node:path';
const {values}=parseArgs({options:{url:{type:'string'},out:{type:'string'},source:{type:'string'},rights:{type:'string'},help:{type:'boolean'}}});
if(values.help || !values.url || !values.out || !values.source || !values.rights){
 console.log('node scripts/fetch-asset.mjs --url HTTPS_IMAGE --out .tmp/book/front.jpg --source HTTPS_EDITION_PAGE --rights "Publisher artwork; reuse not granted"');
 process.exit(values.help?0:1);
}
function https(value){const url=new URL(value);if(url.protocol!=='https:' || url.username || url.password)throw Error('Use a public HTTPS URL without credentials.');return url;}
let url=https(values.url);https(values.source);
const output=resolve(values.out),sidecar=output+'.json';
for(const path of [output,sidecar]){try{await lstat(path);throw Error(`Refusing to overwrite ${path}`);}catch(error){if(error.code!=='ENOENT')throw error;}}
let response;
for(let i=0;i<6;i++){
 response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(120000)});
 if([301,302,303,307,308].includes(response.status)){url=https(new URL(response.headers.get('location'),url));await response.body?.cancel();continue;}
 break;
}
if(!response.ok)throw Error(`Asset request returned ${response.status}`);
const chunks=[];let size=0;const limit=64*1024*1024;
try{for await(const chunk of response.body){size+=chunk.length;if(size>limit)throw Error('Asset exceeds the 64 MiB limit.');chunks.push(chunk);}}catch(error){throw Error(`Download failed: ${error.message}`);}
const bytes=Buffer.concat(chunks),head=bytes.subarray(0,16);
const kind=head[0]===0xff && head[1]===0xd8?'jpg':head.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'png':head.toString('ascii',0,4)==='RIFF' && head.toString('ascii',8,12)==='WEBP'?'webp':head.toString('ascii',0,5)==='%PDF-'?'pdf':null;
if(!kind)throw Error('Expected JPEG, PNG, WebP or PDF bytes, not an HTML page or executable.');
const extension=extname(output).slice(1).toLowerCase();
if(!(extension===kind || kind==='jpg' && extension==='jpeg'))throw Error(`File content is ${kind}; use that extension.`);
await mkdir(dirname(output),{recursive:true});
await writeFile(output,bytes,{flag:'wx'});
await writeFile(sidecar,JSON.stringify({sourceUrl:values.source,downloadUrl:values.url,finalUrl:url.href,retrievedAt:new Date().toISOString(),rights:values.rights,bytes:size,sha256:createHash('sha256').update(bytes).digest('hex')},null,2)+'\n',{flag:'wx'});
console.log(`Saved ${size} bytes and provenance. Verify the edition and reuse rights before publishing.`);
