import {spawnSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const executable=process.env.BLENDER_PATH || (process.platform==='darwin' && existsSync('/Applications/Blender.app/Contents/MacOS/Blender')?'/Applications/Blender.app/Contents/MacOS/Blender':'blender');
for(const book of JSON.parse(readFileSync(resolve(root,'COLLECTION.json'),'utf8'))){
 const result=spawnSync(executable,['--background','--factory-startup','--python-exit-code','1','--python',resolve(root,'blender/tools/inspect_book.py'),'--',resolve(root,'blender/books',book.slug+'.blend')],{encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});
 const line=result.stdout?.split('\n').find(line=>line.startsWith('BOOK_INSPECTION '));
 if(result.status!==0 || !line)throw Error(`${book.slug}: ${result.error?.message || result.stderr || result.stdout}`);
 const report=JSON.parse(line.slice('BOOK_INSPECTION '.length));
 if(report.slug!==book.slug || report.scenes!==1)throw Error(`Wrong source scene: ${book.slug}`);
 for(let i=0;i<3;i++)if(Math.abs(report.caseDimensionsMm[i]-book.dimensionsMm[i])>0.6)throw Error(`${book.slug}: case dimensions disagree with the catalogue: ${report.caseDimensionsMm}`);
 console.log(`${book.slug}: portable, ${report.meshes} meshes, ${report.images} packed textures, ${report.caseDimensionsMm.map(n=>n.toFixed(2)).join(' × ')} mm`);
}
