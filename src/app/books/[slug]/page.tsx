import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BOOKS } from "@/lib/books";
import {LIBRARY} from '@/lib/library-config';
export function generateStaticParams(){return BOOKS.map(book=>({slug:book.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;const book=BOOKS.find(b=>b.slug===slug);
 return book?{title:`${book.title} | ${LIBRARY.name}`,description:book.description}:{};
}
export default async function BookPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const book=BOOKS.find(b=>b.slug===slug);if(!book)notFound();
 return null;
}
