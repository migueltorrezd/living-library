"use client";
import {useLibraryText} from "./LibraryLocale";

import {useEffect,useState} from 'react';
import {BOOKS} from '@/lib/books';
import {libraryMotion,restingView,useLibrary} from '@/store/useLibrary';
import {emptyPrint,useBookPrint} from '@/store/useBookPrint';
import {DirectionIcon} from './DirectionIcon';

export function enterReadMode(index:number){
 const state=useLibrary.getState(),view=state.views[index]||restingView;
 libraryMotion.readPan.x=0;libraryMotion.readPan.y=0;
 state.view(index,{open:true,turned:false,spin:false,reset:view.reset+1});
 state.set({active:index,expanded:true,readMode:true,readSide:'left',readZoom:1});
}

export function leaveBookView(){
 libraryMotion.readPan.x=0;libraryMotion.readPan.y=0;
 useLibrary.getState().set({expanded:false,readMode:false,readZoom:1});
}

export function ReadMode({index}:{index:number}){
 const t=useLibraryText();
 const book=BOOKS[index];
 const print=useBookPrint(s=>s.books[book.slug]||emptyPrint),side=useLibrary(s=>s.readSide),zoom=useLibrary(s=>s.readZoom);
 const [single,setSingle]=useState(false);
 useEffect(()=>{const query=matchMedia('(max-width:699px)');const update=()=>setSingle(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 const busy=print.status!=='ready'||print.turning;
 const current=single?Math.min(print.total,print.page+(side==='right'?1:0)):Math.min(print.page+1,print.total);
 const previous=print.page>1||single&&side==='right';
 const next=single&&side==='left'?print.page<print.total:print.page+1<print.total;
 const turn=(direction:1|-1)=>{
  if(busy||direction<0&&!previous||direction>0&&!next)return;
  libraryMotion.readPan.x=0;libraryMotion.readPan.y=0;
  if(single&&((direction>0&&side==='left')||(direction<0&&side==='right'))){useLibrary.getState().set({readSide:direction>0?'right':'left'});return;}
  useBookPrint.getState().turn(book.slug,direction);
  useLibrary.getState().set({readSide:direction>0?'left':'right'});
 };
 useEffect(()=>{
  const keys=(e:KeyboardEvent)=>{
   if(e.target instanceof HTMLInputElement||e.metaKey||e.ctrlKey||e.altKey)return;
   if(e.shiftKey&&zoom>1&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
    e.preventDefault();const pan=libraryMotion.readPan,limit=(zoom-1)*.6;
    const axis=e.key==='ArrowLeft'||e.key==='ArrowRight'?'x':'y';
    pan[axis]=Math.max(-limit,Math.min(limit,pan[axis]+(e.key==='ArrowLeft'||e.key==='ArrowUp'?.1:-.1)));return;
   }
   if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();turn(1);}
   if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();turn(-1);}
   if((e.key==='ArrowUp'||e.key==='ArrowDown')&&zoom>1){e.preventDefault();const pan=libraryMotion.readPan,limit=(zoom-1)*.6;pan.y=Math.max(-limit,Math.min(limit,pan.y+(e.key==='ArrowUp'?.1:-.1)));}
   if(e.key==='Home'){e.preventDefault();libraryMotion.readPan.x=0;libraryMotion.readPan.y=0;useLibrary.getState().set({readZoom:1});}
  };
  document.addEventListener('keydown',keys);return()=>document.removeEventListener('keydown',keys);
 });
 const resize=(amount:number)=>{const value=Math.max(1,Math.min(2.5,Math.round((zoom+amount)*100)/100));if(value===1){libraryMotion.readPan.x=0;libraryMotion.readPan.y=0;}useLibrary.getState().set({readZoom:value});};
 return <>
  <div className="read-mode-heading"><p>{book.title}</p><span>{book.author}</span></div>
  <div className="read-mode-toolbar" aria-label={t("Reading controls")} aria-describedby="read-mode-hint">
   <div className="read-mode-pages">
    <button aria-label={single?t('Previous page'):t('Previous pages')} disabled={busy||!previous} onClick={()=>turn(-1)}><DirectionIcon kind="back"/></button>
    <span aria-live="polite" aria-atomic="true">{print.status==='error'?t('Pages unavailable'):print.total?`${current} / ${print.total}`:t('Preparing pages…')}</span>
    <button aria-label={single?t('Next page'):t('Next pages')} disabled={busy||!next} onClick={()=>turn(1)}><DirectionIcon/></button>
   </div>
   <div className="read-mode-zoom" aria-label={t("Page magnification")}>
    <button aria-label={t("Zoom out")} disabled={zoom<=1} onClick={()=>resize(-.25)}>−</button>
    <button className="read-mode-fit" aria-label={t("Fit page")} onClick={()=>resize(1-zoom)}>{Math.round(zoom*100)}%</button>
    <button aria-label={t("Zoom in")} disabled={zoom>=2.5} onClick={()=>resize(.25)}>+</button>
   </div>
   {print.status==='error'&&<button onClick={()=>useBookPrint.getState().update(book.slug,{retry:print.retry+1})}>{t("Retry")}</button>}
  </div>
  <p id="read-mode-hint" className="read-mode-hint">{print.turning?'':zoom>1?t('Drag or Shift + arrow keys to move around the page.'):single?t('One page at a time. Your place is saved.'):t('Use the arrows to turn the pages. Your place is saved.')}</p>
  <article className="sr-only" aria-label={t("Text on the open pages")}>{print.text?.map((text,i)=><p key={i}>{text}</p>)}</article>
 </>;
}
