import {READING_EDITIONS,textPages,type ReadingBlock,type ReadingText} from './reading';
import {assetUrl} from './library-config';

export type PrintedSource={total:number;page:(index:number)=>Promise<HTMLCanvasElement>;dispose:()=>void};
const WIDTH=1024;
function blank(height:number){const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=height;const context=canvas.getContext('2d')!;context.fillStyle='#fff';context.fillRect(0,0,WIDTH,height);return canvas;}
function textCanvas(blocks:ReadingBlock[],number:number,height:number){
 const canvas=blank(height),ctx=canvas.getContext('2d')!,margin=110,measure=WIDTH-margin*2;
 const title=blocks.every(block=>block.kind==='heading');
 ctx.fillStyle='#292620';ctx.textBaseline='top';
 const lines=(text:string)=>{const result:string[]=[];let row='';for(const word of text.split(/\s+/)){const next=row?row+' '+word:word;if(row&&ctx.measureText(next).width>measure){result.push(row);row=word;}else row=next;}if(row)result.push(row);return result;};
 let commands:{text:string;x:number;y:number;font:string;heading:boolean}[]=[],bottom=0;
 for(let size=28;size>=18;size--){
  commands=[];let y=title?height*.34:138;
  for(const block of blocks){
   const heading=block.kind==='heading',font=`${heading?(title?42:size+6):size}px Georgia`;ctx.font=font;
   for(const line of lines(block.text)){commands.push({text:line,x:heading?WIDTH/2:margin,y,font,heading});y+=heading?54:size*1.43;}
   y+=heading?42:size*.78;
  }
  bottom=y;if(y<height-125)break;
 }
 for(const line of commands){ctx.font=line.font;ctx.textAlign=line.heading?'center':'left';ctx.fillText(line.text,line.x,line.y);}
 canvas.dataset.printFits=String(bottom<height-100);
 canvas.dataset.printText=blocks.map(block=>block.text).join('\n\n');
 ctx.font='21px Georgia';ctx.textAlign='center';ctx.fillText(String(number+1),WIDTH/2,height-80);
 return canvas;
}

/** Decode only nearby pages; the complete source stays available without baking hundreds of textures. */
export async function loadPrintedSource(slug:string,ratio:number,signal:AbortSignal):Promise<PrintedSource>{
 const edition=READING_EDITIONS[slug],height=Math.round(WIDTH*ratio),cache=new Map<number,Promise<HTMLCanvasElement>>();
 let total=0,render:(index:number)=>Promise<HTMLCanvasElement>,dispose=()=>{};
 if(edition.kind==='text'){
  const response=await fetch(edition.url,{signal});if(!response.ok)throw new Error('Book text unavailable');
  const data:ReadingText=await response.json();if(!data.blocks?.length)throw new Error('Empty book text');
  const pages=textPages(data.blocks);total=pages.length;render=async index=>textCanvas(pages[index],index,height);
 }else{
  const pdfjs=await import('pdfjs-dist');if(signal.aborted)throw new DOMException('Aborted','AbortError');
  pdfjs.GlobalWorkerOptions.workerSrc=assetUrl('/reading/pdf.worker.min.mjs');
  const task=pdfjs.getDocument({url:edition.url});const abort=()=>{void task.destroy();};signal.addEventListener('abort',abort,{once:true});
  const pdf=await task.promise;total=pdf.numPages;
  dispose=()=>{signal.removeEventListener('abort',abort);void task.destroy();};
  render=async index=>{const page=await pdf.getPage(index+1),original=page.getViewport({scale:1}),viewport=page.getViewport({scale:WIDTH/original.width});const canvas=blank(Math.ceil(viewport.height));await page.render({canvas,viewport}).promise;const text=await page.getTextContent();canvas.dataset.printText=text.items.map(item=>'str' in item?item.str:'').join(' ');return canvas;};
 }
 return {total,dispose:()=>{cache.clear();dispose();},page:index=>{
  if(index<0||index>=total){const canvas=blank(height);canvas.dataset.printedPage=String(index);return Promise.resolve(canvas);}
  const existing=cache.get(index);if(existing){cache.delete(index);cache.set(index,existing);return existing;}
  const pending=render(index).then(canvas=>{canvas.dataset.printedPage=String(index);return canvas;});cache.set(index,pending);if(cache.size>8)cache.delete(cache.keys().next().value!);return pending;
 }};
}
