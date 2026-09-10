import {LIBRARY,assetUrl} from './library-config';
export type ReadingEdition={kind:'text'|'pdf';url:string;sourceUrl:string;sourceName:string;edition:string;version:string};
export const READING_EDITIONS:Record<string,ReadingEdition>={
 naval:{kind:'pdf',url:LIBRARY.navalPdfUrl||assetUrl('/api/reading/naval'),sourceUrl:'https://www.navalmanack.com/',sourceName:'Official free edition',edition:'The complete 2020 free edition, including illustrations. The displayed hardcover is a later printing.',version:'naval-official-2020'},
};
export type ReadingBlock={kind:'heading'|'paragraph';text:string};
export type ReadingText={blocks:ReadingBlock[]};
export type ReadingMark={page:number;total:number;fraction:number;updatedAt:number};
export const readingKey=(slug:string,version:string)=>`library:reading:${slug}:${version}`;
export function readMark(slug:string,version:string):ReadingMark|null{
 try{const m=JSON.parse(localStorage.getItem(readingKey(slug,version))||'null');return m&&Number.isFinite(m.page)&&Number.isFinite(m.total)&&Number.isFinite(m.fraction)&&m.page>=0&&m.total>0&&m.fraction>=0&&m.fraction<=1?m:null;}catch{return null;}
}

/** Keep every word in order, with stable logical pages across screen sizes. */
export function textPages(blocks:ReadingBlock[],wordsPerPage=260):ReadingBlock[][]{
 const pages:ReadingBlock[][]=[];let current:ReadingBlock[]=[],remaining=wordsPerPage;
 const flush=()=>{if(current.length)pages.push(current);current=[];remaining=wordsPerPage;};
 for(const block of blocks){
  if(block.kind==='heading'){if(current.some(part=>part.kind==='paragraph')||/^(DEDICATION|[IVX]+)$/.test(block.text))flush();current.push(block);remaining-=14;continue;}
  const words=block.text.split(/\s+/);let offset=0;
  while(offset<words.length){if(remaining<8)flush();const count=Math.min(remaining,words.length-offset);current.push({kind:'paragraph',text:words.slice(offset,offset+count).join(' ')});offset+=count;remaining-=count+5;}
 }
 flush();return pages;
}
