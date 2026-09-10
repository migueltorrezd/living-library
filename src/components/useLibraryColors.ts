"use client";

import {useLayoutEffect,type RefObject} from 'react';
import {BOOKS} from '@/lib/books';
import {BOOK_PALETTES,SHELF_PALETTE,paletteStyle} from '@/lib/book-palettes';

/** Fixed navigation takes its ink from the article physically behind it. */
export function useLibraryColors(root:RefObject<HTMLDivElement|null>,shelfMode:boolean,active:number,expanded:boolean){
 useLayoutEffect(()=>{
  const element=root.current;if(!element)return;
  const chrome=[...element.querySelectorAll<HTMLElement>('[data-library-chrome]')];
  const sections=[...element.querySelectorAll<HTMLElement>('[data-story]')];
  const applied=new WeakMap<HTMLElement,string>();
  let frame=0;
  const paint=()=>{
   const bounds=sections.map(section=>section.getBoundingClientRect());
   const samples=chrome.map(control=>({control,y:control.getBoundingClientRect().top+control.offsetHeight/2}));
   for(const {control,y} of samples){
    const index=shelfMode?-1:bounds.findIndex(rect=>rect.top<=y&&rect.bottom>y);
    const palette=shelfMode?SHELF_PALETTE:BOOK_PALETTES[BOOKS[index<0?active:index].slug];
    if(applied.get(control)===palette.ground)continue;
    for(const [key,value] of Object.entries(paletteStyle(palette)))control.style.setProperty(key,String(value));
    applied.set(control,palette.ground);
   }
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(paint);};
  const resize=new ResizeObserver(schedule);for(const section of sections)resize.observe(section);
  paint();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  return()=>{cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
 },[root,shelfMode,active,expanded]);
}
