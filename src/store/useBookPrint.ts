import {create} from 'zustand';

export type PrintState={status:'idle'|'loading'|'ready'|'error';page:number;total:number;turning:boolean;direction:1|-1;request:number;retry:number;text?:string[]};
export const emptyPrint:PrintState={status:'idle',page:1,total:0,turning:false,direction:1,request:0,retry:0};
export const useBookPrint=create<{books:Record<string,PrintState>;update:(slug:string,patch:Partial<PrintState>)=>void;turn:(slug:string,direction:1|-1)=>void}>((set)=>({
 books:{},
 update:(slug,patch)=>set(s=>({books:{...s.books,[slug]:{...emptyPrint,...s.books[slug],...patch}}})),
 turn:(slug,direction)=>set(s=>{const book=s.books[slug]||emptyPrint;if(book.status!=='ready'||book.turning||direction<0&&book.page<=1||direction>0&&book.page+1>=book.total)return s;return {books:{...s.books,[slug]:{...book,direction,request:book.request+1,turning:true}}};}),
}));
