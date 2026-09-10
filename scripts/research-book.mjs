/** Fetch an ISBN record into a new research file. Nothing is added to the app. */
import {parseArgs} from 'node:util';
import {mkdir, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';

const {values} = parseArgs({options: {isbn: {type:'string'}, out: {type:'string'}, help: {type:'boolean'}}});
if(values.help || !values.isbn || !values.out){
 console.log('node scripts/research-book.mjs --isbn 9780141395869 --out .tmp/meditations/research.json');
 process.exit(values.help ? 0 : 1);
}
const isbn=values.isbn.replace(/[-\s]/g,'');
if(!/^(\d{13}|\d{9}[\dXx])$/.test(isbn))throw Error('Expected an ISBN-10 or ISBN-13.');
const source=`https://openlibrary.org/isbn/${isbn}.json`;
let response;
try{response=await fetch(source,{signal:AbortSignal.timeout(30000),headers:{'User-Agent':'LivingLibrary/0.1 (edition research)'}});}
catch(error){throw Error(`Could not reach Open Library (${error.name}). Retry later or research the exact publisher edition directly; no catalogue changes were made.`);}
if(!response.ok)throw Error(`Open Library returned ${response.status}. Research the publisher directly; do not substitute another edition.`);
const edition=await response.json();
if(!edition.title || !edition.key?.startsWith('/books/'))throw Error('Unexpected edition response.');
const path=resolve(values.out);
await mkdir(dirname(path),{recursive:true});
await writeFile(path,JSON.stringify({isbn,sourceUrl:source,retrievedAt:new Date().toISOString(),
 status:'research-only: verify publisher, language, binding and photographs before building',
 edition,dimensionsMm:null,
 dimensionsNote:'Transcribe width, height and depth from the exact edition source; identify estimates.',
 assets:[],rights:null},null,2)+'\n',{flag:'wx'});
console.log(`Saved ISBN research to ${values.out}. The live catalogue was not changed.`);
