import {create} from 'zustand';
import {BOOKS} from '@/lib/books';

export type LibraryPhase='shelf'|'preparing'|'entering'|'reading'|'closing'|'leaving';
export type BookPose='book'|'cover'|'spine'|'back';
export type BookView={open:boolean;turned:boolean;pose:BookPose;spin:boolean;reset:number};
export const restingView:BookView={open:false,turned:false,pose:'book',spin:false,reset:0};
type State={
 entrance:'loading'|'revealing'|'ready';
 phase:LibraryPhase;active:number;requested:number[];ready:number[];failed:number[];retries:Record<number,number>;
 expanded:boolean;readMode:boolean;readSide:'left'|'right';readZoom:number;views:Record<number,BookView>;revision:number;shelfScroll:number;
 set:(patch:Partial<State>)=>void;
 request:(index:number)=>void;prepared:(index:number)=>void;fail:(index:number)=>void;retry:(index:number)=>void;
 view:(index:number,patch:Partial<BookView>)=>void;
};
export const useLibrary=create<State>((set)=>({
 entrance:'loading',
 phase:'shelf',active:0,requested:[],ready:[],failed:[],retries:{},expanded:false,readMode:false,readSide:'left',readZoom:1,views:{},revision:0,shelfScroll:0,
 set:patch=>set(patch),
 request:index=>set(s=>s.requested.includes(index)?s:{requested:[...s.requested,index]}),
 prepared:index=>set(s=>s.ready.includes(index)?s:{ready:[...s.ready,index]}),
 fail:index=>set(s=>({failed:[...new Set([...s.failed,index])]})),
 retry:index=>set(s=>({failed:s.failed.filter(i=>i!==index),retries:{...s.retries,[index]:(s.retries[index]||0)+1}})),
 view:(index,patch)=>set(s=>({views:{...s.views,[index]:{...restingView,...s.views[index],...patch}}})),
}));

// Pointer samples and measured layout do not cause React renders at scroll rate.
export const libraryMotion={
 travel:{phase:'',revision:-1,elapsed:0},
 shelfRows:[] as {top:number;height:number;left:number;width:number}[],
 stages:[] as (HTMLElement|null)[],
 readPan:{x:0,y:0},
 gestures:Array.from({length:BOOKS.length},()=>({pitch:0,yaw:0,zoom:1,dragging:false})),
};
