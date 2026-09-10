/** Record the distributable package, excluding generated/private working files. */
import {readdir,readFile,writeFile,lstat} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
const directories=['src','public','blender','scripts','docs','examples','.github','.agents'];
const files=['README.md','AGENTS.md','CLAUDE.md','LICENSE','CONTRIBUTING.md','SECURITY.md','COLLECTION.json','.gitignore','.gitattributes','.nvmrc','.env.example','package.json','package-lock.json','next.config.ts','eslint.config.mjs','tsconfig.json'];
async function walk(path){for(const entry of await readdir(path,{withFileTypes:true})){
 if(entry.name==='.DS_Store' || entry.name==='__pycache__' || /\.(pyc|blend\d+|log)$/.test(entry.name))continue;
 const full=resolve(path,entry.name);if(entry.isSymbolicLink())throw Error('Distributable symlinks are not supported: '+full);
 if(entry.isDirectory())await walk(full);else files.push(relative(root,full).split('\\').join('/'));
}}
for(const dir of directories){try{await walk(resolve(root,dir));}catch(error){if(error.code!=='ENOENT')throw error;}}
const records=[];
for(const path of files.sort()){
 const full=resolve(root,path);if((await lstat(full)).isSymbolicLink())throw Error('Unexpected symlink: '+path);
 const bytes=await readFile(full);if(bytes.length>=100*1024*1024)throw Error('File exceeds GitHub file limit: '+path);
 records.push({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
const collection=JSON.parse(await readFile(resolve(root,'COLLECTION.json'),'utf8'));
await writeFile(resolve(root,'package-manifest.json'),JSON.stringify({format:1,edition:'public',slugs:collection.map(b=>b.slug),files:records},null,2)+'\n');
console.log(`Recorded ${records.length} files (${records.reduce((n,f)=>n+f.bytes,0)} bytes). Review changes before publishing.`);
