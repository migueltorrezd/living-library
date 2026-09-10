import {copyFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const target=resolve(import.meta.dirname,'../public/reading');mkdirSync(target,{recursive:true});
copyFileSync(resolve(import.meta.dirname,'../node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),resolve(target,'pdf.worker.min.mjs'));
