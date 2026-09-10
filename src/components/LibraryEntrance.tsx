"use client";
import {useLibraryText} from "./LibraryLocale";

import {useEffect,useState,type CSSProperties} from 'react';
import {BOOKS} from '@/lib/books';
import {LIBRARY} from '@/lib/library-config';
import {useLibrary} from '@/store/useLibrary';
import {retryLibraryBook} from './BlenderBook';
import {useReducedMotion} from './useReducedMotion';

export function LibraryEntrance({webgl,onReadWithoutModels}:{webgl:boolean;onReadWithoutModels:()=>void}){
 const t=useLibraryText();
 const {entrance,ready,failed,phase}=useLibrary();
 const reduce=useReducedMotion();
 const [slow,setSlow]=useState(false),[hidden,setHidden]=useState(false);
 const complete=!webgl||(ready.length===BOOKS.length&&!failed.length&&(phase==='shelf'||phase==='reading'));
 useEffect(()=>{
  if(entrance!=='loading')return;
  const timer=setTimeout(()=>setSlow(true),12000);
  return()=>clearTimeout(timer);
 },[entrance]);
 useEffect(()=>{
  const change=()=>setHidden(document.hidden);change();
  document.addEventListener('visibilitychange',change);
  return()=>document.removeEventListener('visibilitychange',change);
 },[]);
 useEffect(()=>{
  if(!complete||entrance!=='loading')return;
  let frame=0;
  // Readiness is reported by the scene; allow the completed canvas to paint.
  frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>useLibrary.getState().set({entrance:'revealing'}));});
  return()=>cancelAnimationFrame(frame);
 },[complete,entrance]);
 useEffect(()=>{
  if(entrance!=='revealing')return;
  const timer=setTimeout(()=>useLibrary.getState().set({entrance:'ready'}),reduce?0:650);
  return()=>clearTimeout(timer);
 },[entrance,reduce]);
 const retry=()=>{for(const index of failed){retryLibraryBook(BOOKS[index].slug);useLibrary.getState().retry(index);}};
 if(entrance==='ready')return null;
 return <section className="library-entrance" data-state={entrance} data-paused={hidden} data-theme={LIBRARY.loadingTheme} aria-label={t("Opening the library")}>
  <div className="library-entrance__center">
   <div className="entrance-books" aria-hidden="true">
    {['parchment','sage','rose'].map((color,index)=><div className={`entrance-book entrance-book--${color}`} style={{'--book-index':index} as CSSProperties} key={color}>
     <div className="entrance-book__turn"><i className="entrance-book__front"/><i className="entrance-book__back"/><i className="entrance-book__spine"/><i className="entrance-book__pages"/><i className="entrance-book__head"/><i className="entrance-book__tail"/></div>
    </div>)}
   </div>
   <p className="library-entrance__name">{t(LIBRARY.name)}</p>
   <p className="library-entrance__status" role="status">{failed.length?t('A book needs another try.'):complete?t('The library is ready.'):slow?t('A few more pages to gather.'):t('Opening a world of ideas.')}</p>
   <div className="entrance-progress" role="progressbar" aria-label={t("Books prepared")} aria-valuemin={0} aria-valuemax={BOOKS.length} aria-valuenow={ready.length} aria-valuetext={t('{ready} of {total} books prepared',{ready:ready.length,total:BOOKS.length})}>
    {BOOKS.map((book,index)=><span key={book.slug} data-ready={ready.includes(index)}/>)}
   </div>
   {(slow||failed.length>0)&&<div className="library-entrance__recovery">
    {failed.length>0&&<button onClick={retry}>{t("Try again")}</button>}
    <button onClick={onReadWithoutModels}>{t("Read without 3D")}</button>
   </div>}
  </div>
  {!reduce&&!LIBRARY.websiteLocales&&<label className="library-entrance__pause"><input type="checkbox"/><span>{t("Pause motion")}</span></label>}
 </section>;
}
