import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
const root=resolve(import.meta.dirname,'..'),json=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
function dataModule(path){
 const exports={},module={exports};
 const source=ts.transpileModule(readFileSync(resolve(root,path),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(source,{module,exports},{filename:path,timeout:1000});
 return JSON.parse(JSON.stringify(module.exports));
}
const models=json('src/lib/model-manifest.json');
const collection=json('COLLECTION.json');
const books=dataModule('src/lib/books.ts').BOOKS;
assert.deepEqual(books.map(b=>b.slug),collection.map(b=>b.slug),'Visible catalogue/order mismatch');
for(const [file,key] of [['book-editorial','BOOK_EDITORIAL'],['book-palettes','BOOK_PALETTES'],['book-buy-links','BOOK_BUY_LINKS']]){
 const entries=dataModule('src/lib/'+file+'.ts')[key];
 for(const book of books)assert(entries[book.slug],`${book.slug}: missing ${key}`);
 assert.deepEqual(Object.keys(entries).sort(),books.map(b=>b.slug).sort(),`${key}: unselected catalogue entries`);
}
assert.equal(new Set(collection.map(b=>b.slug)).size,collection.length,'Duplicate catalogue slug');
assert.deepEqual(models.map(b=>b.slug),collection.map(b=>b.slug),'Model/catalogue order mismatch');
let previousArea=0;
for(const book of collection){
 const area=book.dimensionsMm[0]*book.dimensionsMm[1];
 assert(area>=previousArea,`${book.slug}: shelf order must follow cover area`);previousArea=area;
 assert(existsSync(resolve(root,'blender/books',book.slug+'.blend')),`${book.slug}: missing editable source`);
 assert.deepEqual(json('blender/specs/'+book.slug+'.json').dimensionsMm,book.dimensionsMm,`${book.slug}: source dimensions`);
}
for(const model of models){
 assert(model.dimensionsMm.every(n=>n>0),`${model.slug}: dimensions`);
 for(const [url,hash] of [['libraryModelUrl','librarySha256'],['runtimeModelUrl','runtimeSha256'],['shelfModelUrl','shelfSha256']]){
  const path=resolve(root,'public'+model[url]),bytes=readFileSync(path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),model[hash],`${model.slug}: stale ${url}`);
  const gltf=JSON.parse(bytes);
  for(const a of [...(gltf.images||[]),...(gltf.buffers||[])])if(a.uri&&!a.uri.startsWith('data:'))assert(existsSync(resolve(dirname(path),a.uri)),`${model.slug}: missing ${a.uri}`);
 }
}
assert(existsSync(resolve(root,'public/reading/pdf.worker.min.mjs')));
const manifest=json('package-manifest.json');
assert.deepEqual(manifest.slugs,collection.map(b=>b.slug),'Package catalogue mismatch');
for(const file of manifest.files){
 const bytes=readFileSync(resolve(root,file.path));
 assert.equal(bytes.length,file.bytes,`${file.path}: stale package size; run npm run refresh:manifest after intentional edits`);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,`${file.path}: stale package hash`);
}
console.log(`${models.length} books, ${models.length*3} runtime variants and all dependencies verified.`);
