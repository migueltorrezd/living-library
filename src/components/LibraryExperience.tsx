"use client";
import {useLibraryText} from "./LibraryLocale";

import dynamic from 'next/dynamic';
import {LibraryLink as Link,LibraryLocaleProvider,useLibraryLocale} from './LibraryLocale';
import {LIBRARY_LOCALES,libraryLocale,type LibraryLocale} from '@/lib/library-i18n';
import {usePathname} from 'next/navigation';
import {useCallback,useEffect,useLayoutEffect,useRef,useState,useSyncExternalStore,type MouseEvent,type PointerEvent,type ReactNode,type CSSProperties} from 'react';
import {BOOKS} from '@/lib/books';
import {BASE_PATH,LIBRARY,internalPath,libraryPath,libraryReturnPath} from '@/lib/library-config';
import {BOOK_EDITORIAL} from '@/lib/book-editorial';
import {BOOK_PALETTES,SHELF_PALETTE,paletteStyle} from '@/lib/book-palettes';
import {AuthorSection,EditorialHeading,PraiseSection,ReadingLinks,ReadingPreview} from './BookEditorial';
import {detectWebGL} from '@/lib/projection';
import {libraryMotion,restingView,useLibrary} from '@/store/useLibrary';
import {useShelf} from '@/store/useShelf';
import {getModelSpec,retryLibraryBook} from './BlenderBook';
import {DirectionIcon} from './DirectionIcon';
import {useReducedMotion} from './useReducedMotion';
import {useLibraryColors} from './useLibraryColors';
import {LibraryEntrance} from './LibraryEntrance';
import {READING_EDITIONS} from '@/lib/reading';
import {emptyPrint,useBookPrint} from '@/store/useBookPrint';
import {BOOK_BUY_LINKS} from '@/lib/book-buy-links';
import {ReadMode,enterReadMode,leaveBookView} from './ReadMode';

const LibraryScene=dynamic(()=>import('./LibraryScene'),{ssr:false});
const subscribeReturnPath=(changed:()=>void)=>{window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);};
function savedReturnPath(){
 if(!LIBRARY.returnUrl)return '';
 try{
  const saved=sessionStorage.getItem('library:return');
  if(saved?.startsWith('/')&&!saved.startsWith('//')&&!saved.includes('\\')){
   const url=new URL(saved,location.origin);
   if(url.origin===location.origin&&(!BASE_PATH||(url.pathname!==BASE_PATH&&!url.pathname.startsWith(`${BASE_PATH}/`))))return saved;
  }
 }catch{/* The configured return link also works without session storage. */}
 return LIBRARY.returnUrl;
}
const normalClick=(e:MouseEvent)=>e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!e.shiftKey;
const indexFromPath=(path:string)=>BOOKS.findIndex(b=>internalPath(path)===`/books/${b.slug}`);

function BindingActions({index}:{index:number}){
 const t=useLibraryText();
 const view=useLibrary(s=>s.views[index]||restingView),ready=useLibrary(s=>s.ready.includes(index)),update=useLibrary(s=>s.view);
 const expanded=useLibrary(s=>s.expanded);
 const edition=READING_EDITIONS[BOOKS[index].slug];
 const slug=BOOKS[index].slug,print=useBookPrint(s=>s.books[slug]||emptyPrint);
 return <div className="binding-actions">
  <button className="open-book" disabled={!ready||!!edition&&print.turning} aria-pressed={view.open} onClick={()=>update(index,{open:!view.open,turned:false,spin:false,reset:view.reset+1})}>{view.open?t('Close the book'):t('Open the cover')}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5c3-1 5-1 8 1 3-2 5-2 8-1v14c-3-1-5-1-8 1-3-2-5-2-8-1V5zm8 1v14"/></svg></button>
  {view.open&&!edition&&<button className="turn-page" aria-pressed={view.turned} onClick={()=>update(index,{turned:!view.turned})}>{view.turned?t('Return the title page'):t('Turn the title page')}<DirectionIcon kind="turn"/></button>}
  <span className="book-view-actions">{!expanded&&<button className="inspect-book" disabled={!ready} aria-haspopup="dialog" aria-controls={`view-${BOOKS[index].slug}`} onClick={()=>useLibrary.getState().set({active:index,expanded:true,readMode:false})}>{t("View larger")}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/></svg></button>}
  {edition&&<button className="inspect-book read-mode-trigger" disabled={!ready} aria-haspopup="dialog" aria-controls={`view-${slug}`} onClick={()=>enterReadMode(index)}>{t("Read mode")} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5c4-1 6 0 9 2 3-2 5-3 9-2v14c-4-1-6 0-9 2-3-2-5-3-9-2V5zm9 2v14"/></svg></button>}</span>
 </div>;
}

function BookStage({index}:{index:number}){
 const t=useLibraryText();
 const book=BOOKS[index],state=useLibrary(),view=state.views[index]||restingView;
 const expanded=state.expanded&&state.active===index,ready=state.ready.includes(index),failed=state.failed.includes(index);
 const reading=expanded&&state.readMode;
 const stage=useRef<HTMLDivElement>(null),points=useRef(new Map<number,{x:number;y:number}>()),pinch=useRef(0);
 const reveal=state.phase==='reading',interactive=reveal&&ready;
 useEffect(()=>{
  if(!expanded)return;
  const previous=document.activeElement as HTMLElement;stage.current?.focus();
  const keys=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){leaveBookView();return;}
   if(event.key!=='Tab')return;
   const buttons=[...stage.current!.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')].filter(b=>b.getClientRects().length);
   const first=buttons[0],last=buttons[buttons.length-1];
   if(event.shiftKey&&(document.activeElement===first||document.activeElement===stage.current)){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===stage.current)){event.preventDefault();first?.focus();}
  };
  document.addEventListener('keydown',keys);
  return()=>{
   document.removeEventListener('keydown',keys);
   const trigger=document.querySelector<HTMLButtonElement>(`#story-${book.slug} ${reading?'.read-mode-trigger':'.inspect-book'}`);
   (trigger||previous)?.focus({preventScroll:true});
  };
 },[expanded,book.slug,reading]);
 const down=(e:PointerEvent<HTMLDivElement>)=>{
  if(!interactive||e.target instanceof Element&&e.target.closest('button,a'))return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  e.currentTarget.setPointerCapture(e.pointerId);points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
  libraryMotion.gestures[index].dragging=true;state.view(index,{spin:false});
 };
 const move=(e:PointerEvent<HTMLDivElement>)=>{
  const previous=points.current.get(e.pointerId);if(!previous)return;
  const g=libraryMotion.gestures[index],dx=e.clientX-previous.x,dy=e.clientY-previous.y;
  points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(points.current.size===2&&expanded){const [a,b]=[...points.current.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(pinch.current){if(reading)state.set({readZoom:Math.max(1,Math.min(2.5,state.readZoom*distance/pinch.current))});else g.zoom=Math.max(.65,Math.min(1.8,g.zoom*distance/pinch.current));}pinch.current=distance;}
  else if(reading){const pan=libraryMotion.readPan,limit=(state.readZoom-1)*.6;pan.x=Math.max(-limit,Math.min(limit,pan.x+dx/innerWidth));pan.y=Math.max(-limit,Math.min(limit,pan.y+dy/innerHeight));}
  else{g.yaw+=dx*.006;g.pitch=Math.max(-1.15,Math.min(1.15,g.pitch+dy*.005));}
 };
 const end=(e:PointerEvent)=>{points.current.delete(e.pointerId);pinch.current=0;libraryMotion.gestures[index].dragging=points.current.size>0;};
 return <div className={`living-stage${expanded?' living-stage--expanded':''}${reading?' living-stage--reading':''}`} ref={e=>{stage.current=e;libraryMotion.stages[index]=e;}}
  id={`view-${book.slug}`} role={expanded?'dialog':'region'} aria-modal={expanded||undefined} aria-label={t('Interactive book: {title}',{title:book.title})} aria-describedby={`handling-${book.slug}`} tabIndex={interactive?0:-1}
  onKeyDown={e=>{
   if(e.target!==e.currentTarget||!interactive||reading)return;
   const g=libraryMotion.gestures[index];
   if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key)){
    e.preventDefault();state.view(index,{spin:false});
    if(e.key==='Home'){state.view(index,{reset:view.reset+1});return;}
    if(e.key==='ArrowLeft'||e.key==='ArrowRight')g.yaw+=e.key==='ArrowLeft'?-.12:.12;
    else g.pitch=Math.max(-1.15,Math.min(1.15,g.pitch+(e.key==='ArrowUp'?-.12:.12)));
   }
  }}
  onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
  onWheel={e=>{if(reading){const pan=libraryMotion.readPan,limit=(state.readZoom-1)*.6;pan.y=Math.max(-limit,Math.min(limit,pan.y-e.deltaY/innerHeight));}else if(expanded)libraryMotion.gestures[index].zoom=Math.max(.65,Math.min(1.8,libraryMotion.gestures[index].zoom*Math.exp(-e.deltaY*.001)));}} data-ready={ready}>
  {!ready&&!failed&&<p className="living-loading" role="status">{t("Preparing your book…")}</p>}
  {failed&&<p className="living-loading" role="alert">{t("The model couldn’t load.")}<button onClick={()=>{retryLibraryBook(book.slug);state.retry(index);}}>{t("Try again")}</button></p>}
  <div className="stage-ui" data-revealed={reveal} inert={!reveal}>
   <span className="sr-only" id={`handling-${book.slug}`}>{reading?t('Use left and right arrows to change pages. Zoom in to enlarge the text, then drag to move around. Escape returns to the library.'):t('Use the arrow keys to turn the book. Home restores its initial angle.')}</span>
   {expanded&&<button className="expand-book" aria-label={reading?t('Exit read mode'):t('Close enlarged view')} onClick={leaveBookView}>{reading?t('Exit read mode'):t('Close view')}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button>}
   {reading?<ReadMode index={index}/>:expanded&&<div className="expanded-binding-actions"><BindingActions index={index}/></div>}
  </div>
 </div>;
}

export default function LibraryExperience({children,locale='en'}:{children:ReactNode;locale?:LibraryLocale}){
 return <LibraryLocaleProvider locale={locale}><LibraryContent>{children}</LibraryContent></LibraryLocaleProvider>;
}
function LibraryContent({children}:{children:ReactNode}){
 const t=useLibraryText();
 const locale=useLibraryLocale();
 const pathname=internalPath(usePathname()),initial=useRef(indexFromPath(pathname));
 const libraryRoute=pathname==='/'||indexFromPath(pathname)>=0;
 const {phase,active,ready,failed,expanded,readMode,readZoom,entrance}=useLibrary();
 const [webgl,setWebgl]=useState(true);
 const [hydrated,setHydrated]=useState(false);
 const returnUrl=useSyncExternalStore(subscribeReturnPath,()=>{
  const saved=savedReturnPath();
  return LIBRARY.websiteLocales ? saved.startsWith(`/${locale}/`) ? saved : libraryReturnPath(locale) : saved;
 },()=>libraryReturnPath(locale));
 const loading=entrance!=='ready',blocked=loading&&hydrated;
 const root=useRef<HTMLDivElement>(null);
 const shelf=useRef<HTMLDivElement>(null),stories=useRef<HTMLDivElement>(null),booted=useRef(false);
 const reduce=useReducedMotion(),shelfMode=phase==='shelf'||phase==='preparing'||phase==='leaving',entering=phase==='entering'||phase==='closing'||phase==='leaving',reveal=phase==='reading';
 useLibraryColors(root,shelfMode,active,expanded);
 const updateURL=useCallback((index:number,replace=false)=>{
  const url=libraryPath(index<0?undefined:BOOKS[index].slug,locale);
  if(location.pathname!==url)window.history[replace?'replaceState':'pushState']({library:true},'',url);
  document.title=index<0?`${t(LIBRARY.name)} | ${t(LIBRARY.tagline)}`:`${BOOKS[index].title} | ${t(LIBRARY.name)}`;
 },[locale,t]);
 const pickUp=useCallback((index:number,history=true)=>{
  const s=useLibrary.getState();s.request(index);
  if(s.phase==='reading'){s.set({active:index});document.getElementById(`story-${BOOKS[index].slug}`)?.scrollIntoView({behavior:reduce?'instant':'smooth',block:'start'});if(history)updateURL(index,true);return;}
  if(s.phase==='entering'||s.phase==='closing'||s.phase==='leaving')return;
  s.set({active:index,shelfScroll:window.scrollY,phase:'preparing'});
 },[reduce,updateURL]);
 const returnToShelf=useCallback((history=true)=>{
  const s=useLibrary.getState();if(s.phase==='shelf'||s.phase==='closing'||s.phase==='leaving')return;if(s.phase==='preparing'){s.set({phase:'shelf'});return;}
  for(const key of Object.keys(s.views))s.view(Number(key),{open:false,turned:false,spin:false,reset:(s.views[Number(key)]?.reset||0)+1});
  s.set({expanded:false,readMode:false,phase:!webgl||s.failed.includes(s.active)?'shelf':'closing',revision:s.revision+1});if(history)updateURL(-1);
 },[updateURL,webgl]);
 useLayoutEffect(()=>{
  if(booted.current||!libraryRoute)return;booted.current=true;
  const supported=detectWebGL();setWebgl(supported);const s=useLibrary.getState();
  setHydrated(true);
  if(supported)for(let i=0;i<BOOKS.length;i++)s.request(i);
  if(initial.current>=0){s.request(initial.current);s.set({active:initial.current,phase:supported?'entering':'reading',revision:s.revision+1});}
 },[libraryRoute]);
 useEffect(()=>{
  if(phase!=='preparing')return;const s=useLibrary.getState();
  if(!webgl||s.failed.includes(active)){s.set({phase:'reading'});updateURL(active);}
  else if(s.ready.includes(active)){s.set({phase:'entering',revision:s.revision+1});updateURL(active);}
 },[phase,active,ready,failed,webgl,updateURL]);
 useEffect(()=>{if(phase==='entering'&&failed.includes(active))useLibrary.getState().set({phase:'reading'});},[phase,active,failed]);
 useLayoutEffect(()=>{
  if(phase==='entering')document.getElementById(`story-${BOOKS[active].slug}`)?.scrollIntoView({behavior:'instant',block:'start'});
  else if(phase==='leaving'||phase==='shelf'){
   const s=useLibrary.getState();let top=s.shelfScroll;
   if(phase==='leaving'){
    const row=shelf.current?.querySelector<HTMLElement>(`[data-library-row="${s.active}"]`);
    if(row){const r=row.getBoundingClientRect(),center=r.top+scrollY+r.height/2;if(center-top<innerHeight*.2||center-top>innerHeight*.8)top=Math.max(0,center-innerHeight*.5);}
    s.set({shelfScroll:top});
   }
   window.scrollTo({top,behavior:'instant'});
  }
  else if(phase==='reading'&&(!webgl||failed.includes(active)))document.getElementById(`story-${BOOKS[active].slug}`)?.scrollIntoView({behavior:'instant',block:'start'});
 },[phase,active,webgl,failed]);
 useLayoutEffect(()=>{if(!libraryRoute||(!entering&&!expanded&&!loading))return;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=overflow;};},[entering,expanded,loading,libraryRoute]);
 useEffect(()=>{
  if(loading)return;
  if(phase==='reading')document.getElementById(`title-${BOOKS[useLibrary.getState().active].slug}`)?.focus({preventScroll:true});
  if(phase==='shelf'&&document.activeElement?.closest('.living-stories'))shelf.current?.querySelector<HTMLAnchorElement>(`[data-library-row="${useLibrary.getState().active}"] a`)?.focus({preventScroll:true});
 },[phase,loading]);
 useEffect(()=>{
  let frame=0;
  const measure=()=>{const s=useLibrary.getState();if(shelf.current&&(s.phase==='shelf'||s.phase==='preparing'||s.phase==='leaving'))libraryMotion.shelfRows=[...shelf.current.querySelectorAll<HTMLElement>('[data-library-row]')].map(e=>{const r=e.getBoundingClientRect();return {top:r.top+scrollY,height:r.height,left:r.left,width:r.width};});};
  const scroll=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
   const s=useLibrary.getState();if(s.phase!=='reading'||s.expanded)return;
   const current=[...stories.current!.querySelectorAll<HTMLElement>('[data-story]')].findIndex(e=>{const r=e.getBoundingClientRect();return r.top<=innerHeight*.52&&r.bottom>innerHeight*.52;});
   if(current>=0&&current!==s.active){s.set({active:current});updateURL(current,true);}
  });};
  const visibility=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)useLibrary.getState().request(Number((entry.target as HTMLElement).dataset.libraryRow??(entry.target as HTMLElement).dataset.story));},{rootMargin:'550px 0px'});
  (shelfMode?shelf.current:stories.current)?.querySelectorAll('[data-library-row],[data-story]').forEach(e=>visibility.observe(e));
  const resize=new ResizeObserver(measure);if(shelf.current)resize.observe(shelf.current);measure();
  window.addEventListener('resize',measure);window.addEventListener('scroll',scroll,{passive:true});
  return()=>{visibility.disconnect();resize.disconnect();cancelAnimationFrame(frame);window.removeEventListener('resize',measure);window.removeEventListener('scroll',scroll);};
 },[shelfMode,updateURL]);
 useEffect(()=>{
  const pop=()=>{const i=indexFromPath(location.pathname);if(i<0)returnToShelf(false);else if(useLibrary.getState().phase==='reading')pickUp(i,false);else{const s=useLibrary.getState();s.request(i);s.set({active:i,phase:'entering',revision:s.revision+1});}};
  window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);
 },[pickUp,returnToShelf]);
 if(pathname!=='/'&&indexFromPath(pathname)<0)return children;
 return <div ref={root} className={`living-library${expanded?' living-library--expanded':''}${expanded&&readMode?' living-library--reading':''}${webgl?'':' living-library--text'}`} data-magnified={readZoom>1} data-phase={phase} data-entrance={entrance} style={paletteStyle(shelfMode?SHELF_PALETTE:BOOK_PALETTES[BOOKS[active].slug])}>
  <LibraryEntrance webgl={webgl} onReadWithoutModels={()=>{setWebgl(false);const s=useLibrary.getState();if(s.phase!=='shelf')s.set({phase:'reading'});}}/>
  <header className="living-header" data-library-chrome inert={expanded||blocked}>
   <Link prefetch={false} href="/" className="living-brand" aria-label={shelfMode?t(LIBRARY.name):t("Back to the shelf")} onClick={e=>{if(normalClick(e)){e.preventDefault();returnToShelf();}}}><svg viewBox="0 0 34 40" aria-hidden="true"><path d="M4 5h9v30H4zM17 5h6v30h-6zM25 7l5-1 5 29-5 1M4 10h9M4 29h9M17 11h6M17 29h6"/></svg><span>{t(LIBRARY.name)}<small>{t(LIBRARY.tagline)}</small></span></Link>
   {shelfMode&&returnUrl&&<a href={returnUrl} className="back-link"><DirectionIcon kind="back"/><span>{t(LIBRARY.returnLabel)}</span></a>}
   {!shelfMode&&<Link prefetch={false} href="/" className="back-link" onClick={e=>{if(normalClick(e)){e.preventDefault();returnToShelf();}}}><DirectionIcon kind="back"/><span>{t("Back to the shelf")}</span></Link>}
   {LIBRARY.websiteLocales&&<select className="library-language" aria-label={t('Language')} value={locale} onChange={event=>{
    const next=libraryLocale(event.target.value);
    document.cookie=`NEXT_LOCALE=${next};path=/;max-age=31536000;SameSite=Lax`;
    location.assign(libraryPath(shelfMode?undefined:BOOKS[active].slug,next));
   }}>{LIBRARY_LOCALES.map(code=><option key={code} value={code}>{({en:'English',fr:'Français',es:'Español',pt:'Português',it:'Italiano',de:'Deutsch'})[code]}</option>)}</select>}
  </header>
  <nav className="living-index" aria-label={t("Library index")} inert={expanded||blocked}>{BOOKS.map((b,i)=><Link prefetch={false} key={b.slug} data-library-chrome href={`/books/${b.slug}`} style={{'--index':i} as CSSProperties} aria-label={b.title} aria-current={!shelfMode&&active===i?'location':undefined} onClick={e=>{if(normalClick(e)){e.preventDefault();pickUp(i);}}}><span/><span className="index-title">{b.title}</span></Link>)}</nav>
  <main inert={blocked}>
   <div ref={shelf} className="living-shelf" hidden={!shelfMode} inert={expanded||phase==='leaving'}>
    <h1 className="sr-only">{t(LIBRARY.name)}</h1>
    <ul className="booklist">{BOOKS.map((b,i)=><li key={b.slug} data-library-row={i} data-ready={ready.includes(i)} className="booklist__row">
     <Link prefetch={false} className="book" href={`/books/${b.slug}`} aria-busy={phase==='preparing'&&active===i} onMouseEnter={()=>{useShelf.getState().setHovered(i);useLibrary.getState().request(i);}} onMouseLeave={()=>useShelf.getState().setHovered(null)} onFocus={()=>{useShelf.getState().setHovered(i);useLibrary.getState().request(i);}} onBlur={()=>useShelf.getState().setHovered(null)} onClick={e=>{if(normalClick(e)){e.preventDefault();pickUp(i);}}}>
      <span className="book__label"><span className="book__title">{b.title}</span><span className="book__author">{b.author}</span></span>
      {webgl&&!ready.includes(i)&&!failed.includes(i)&&<span className="book__loading">{t("Preparing book…")}</span>}
      <span className="book__inspect">{phase==='preparing'&&active===i?t('Preparing your book…'):t('Pick up this book')}<DirectionIcon/></span>
     </Link>
     {webgl&&failed.includes(i)&&<span className="book__error">{t("The model couldn’t load.")}<button onClick={()=>{retryLibraryBook(b.slug);useLibrary.getState().retry(i);}}>{t("Try again")}</button></span>}
    </li>)}</ul>
    <footer className="colophon"><p>{t(LIBRARY.footer)}</p><Link prefetch={false} href="https://press.stripe.com/" target="_blank" rel="noreferrer">{t("Inspired by Stripe Press")}</Link></footer>
   </div>
   <div ref={stories} className="living-stories" hidden={shelfMode}>{BOOKS.map((b,i)=>{
    const spec=getModelSpec(b.slug),editorial=BOOK_EDITORIAL[b.slug];
    return <article className="book-story" key={b.slug} id={`story-${b.slug}`} data-story={i} style={paletteStyle(BOOK_PALETTES[b.slug])} aria-labelledby={`title-${b.slug}`} inert={expanded&&active!==i}>
     <div className="book-story__content story-container">
     <div className="book-story__visual"><BookStage index={i}/></div>
     <div className="book-story__copy" data-revealed={reveal} inert={!reveal||expanded}>
      <h2 id={`title-${b.slug}`} tabIndex={-1}>{b.title}</h2><p className="story-author">{b.author}</p>
      <div className="living-desktop-actions"><BindingActions index={i}/></div>
      <div className="story-description">{editorial.summary.map(paragraph=><p key={paragraph}>{paragraph}</p>)}</div>
      <ReadingLinks entry={editorial} slug={b.slug}/>
      <AuthorSection entry={editorial} slug={b.slug}/>
      <ReadingPreview entry={editorial} slug={b.slug}/>
      <section className="story-edition" aria-labelledby={`edition-${b.slug}`}><EditorialHeading id={`edition-${b.slug}`}>{t("About this edition")}</EditorialHeading><dl className="binding-notes"><div><dt>{t("Binding")}</dt><dd>{spec.binding}</dd></div><div><dt>{t("W × H × D")}</dt><dd>{spec.dimensionsMm.join(' × ')} mm</dd></div><div><dt>{t("Publisher")}</dt><dd>{spec.publisher}</dd></div></dl>
       <p className="edition-note">ISBN {spec.isbn}<br/>{spec.dimensionNote}.<br/>{t("Binding, interior and print finishes reconstructed for this showcase.")}</p>
       <Link prefetch={false} className="source-link" href={BOOK_BUY_LINKS[b.slug][0].url} target="_blank" rel="noreferrer">{t("Explore this edition")}<DirectionIcon kind="external"/></Link>
      </section>
     </div>
      </div>
      <PraiseSection entry={editorial} slug={b.slug} revealed={reveal} inert={!reveal||expanded}/>
      <nav className="story-continuation story-container" aria-label={t('Continue after {title}',{title:b.title})} data-revealed={reveal} inert={!reveal||expanded}>
      {i<BOOKS.length-1?<Link prefetch={false} className="continue-library" href={`/books/${BOOKS[i+1].slug}`} onClick={e=>{if(normalClick(e)){e.preventDefault();pickUp(i+1);}}}><span>{t("Continue through the library")}</span>{BOOKS[i+1].title}<DirectionIcon/></Link>:<Link prefetch={false} className="continue-library" href="/" onClick={e=>{if(normalClick(e)){e.preventDefault();returnToShelf();}}}><DirectionIcon kind="back"/>{t("Return to the shelf")}</Link>}
      </nav>
    </article>;
   })}</div>
  </main>
  {webgl&&<LibraryScene/>}
 </div>;
}
