"use client";
import {useLibraryText} from "./LibraryLocale";
import type {ReactNode} from 'react';
import type {BookEditorial as Editorial} from '@/lib/book-editorial';
import {DirectionIcon} from './DirectionIcon';
import {BOOK_BUY_LINKS,BOOK_FREE_LINKS} from '@/lib/book-buy-links';
import {READING_EDITIONS} from '@/lib/reading';

export function EditorialHeading({id,children}:{id?:string;children:ReactNode}){
 return <h3 className="editorial-heading" id={id}>{children}</h3>;
}

export function ReadingLinks({entry,slug}:{entry:Editorial;slug:string}){
 const t=useLibraryText();
 const edition=READING_EDITIONS[slug];
 return <div className="reading-links">
  <div className="format-links" aria-label={t("Ways to read this book")}>
   {BOOK_BUY_LINKS[slug].map(link=><a key={link.url} href={link.url} target="_blank" rel="noreferrer"><span>{t(link.label)}<small>{link.format}</small></span><span className="format-arrow"><DirectionIcon kind="external"/></span></a>)}
   {edition&&<a href={edition.sourceUrl} target="_blank" rel="noreferrer"><span>{t("Free edition")}<small>{edition.sourceName}</small></span><span className="format-arrow"><DirectionIcon kind="external"/></span></a>}
   {BOOK_FREE_LINKS[slug]?.map(link=><a key={link.url} href={link.url} target="_blank" rel="noreferrer"><span>{t(link.label)}<small>{link.format}</small></span><span className="format-arrow"><DirectionIcon kind="external"/></span></a>)}
   {entry.reading&&<><a href={`https://www.gutenberg.org/cache/epub/${entry.reading.id}/pg${entry.reading.id}-images.html`} target="_blank" rel="noreferrer"><span>{t("Read online")}<small>{t("Historical text")}</small></span><span className="format-arrow"><DirectionIcon kind="external"/></span></a>
   <a href={`https://www.gutenberg.org/ebooks/${entry.reading.id}.epub3.images`}><span>{t("Download EPUB")}<small>Project Gutenberg</small></span><span className="format-arrow"><DirectionIcon kind="external"/></span></a></>}
  </div>
  {entry.reading&&<p className="reading-note">{entry.reading.note}</p>}
 </div>;
}

export function AuthorSection({entry,slug}:{entry:Editorial;slug:string}){
 const t=useLibraryText();
 return <section className="story-biography" aria-labelledby={`author-${slug}`}>
  <EditorialHeading id={`author-${slug}`}>{t("Author")}</EditorialHeading>
  <p>{entry.biography}</p>
  <a className="editorial-link" href={entry.authorLink.url} target="_blank" rel="noreferrer">{entry.authorLink.label}<DirectionIcon kind="external"/></a>
 </section>;
}

export function ReadingPreview({entry,slug}:{entry:Editorial;slug:string}){
 const t=useLibraryText();
 if(!entry.reading)return entry.resources?.length?<section className="story-reading" aria-labelledby={`resources-${slug}`}><EditorialHeading id={`resources-${slug}`}>{t("Explore further")}</EditorialHeading>{entry.resources.map(resource=><div className="story-resource" key={resource.link.url}><h4>{resource.title}</h4><p>{resource.description}</p><a className="editorial-link" href={resource.link.url} target="_blank" rel="noreferrer">{resource.link.label}<DirectionIcon kind="external"/></a></div>)}</section>:null;
 const url=`https://www.gutenberg.org/cache/epub/${entry.reading.id}/pg${entry.reading.id}-images.html`;
 return <section className="story-reading" aria-labelledby={`excerpt-${slug}`}>
  <EditorialHeading id={`excerpt-${slug}`}>{t("From the book")}</EditorialHeading>
  <figure className="reading-preview">
   <figcaption>{entry.reading.chapter}</figcaption>
   <blockquote cite={url}><p>{entry.reading.excerpt}</p></blockquote>
   <a href={url} target="_blank" rel="noreferrer">{t("Continue reading")}<DirectionIcon kind="external"/></a>
  </figure>
  <p className="reading-note">{entry.reading.note}</p>
  {entry.resources?.map(resource=><div className="story-resource" key={resource.link.url}>
   <h4>{resource.title}</h4><p>{resource.description}</p>
   <a className="editorial-link" href={resource.link.url} target="_blank" rel="noreferrer">{resource.link.label}<DirectionIcon kind="external"/></a>
  </div>)}
 </section>;
}

export function PraiseSection({entry,slug,revealed,inert}:{entry:Editorial;slug:string;revealed:boolean;inert:boolean}){
 const t=useLibraryText();
 if(!entry.praise.length)return null;
 return <section className="story-praise story-container" data-revealed={revealed} inert={inert} aria-labelledby={`praise-${slug}`}>
  <EditorialHeading id={`praise-${slug}`}>{t("Praise")}</EditorialHeading>
  <div className="praise-grid">{entry.praise.map(quote=><figure key={quote.name}>
   <span className="praise-mark" aria-hidden="true">“</span>
   <blockquote cite={quote.url}><p>{quote.text}</p></blockquote>
   <figcaption><a href={quote.url} target="_blank" rel="noreferrer">{quote.name}</a><span>{quote.attribution}</span></figcaption>
  </figure>)}</div>
 </section>;
}
