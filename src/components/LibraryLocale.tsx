"use client";
import {createContext,useCallback,useContext,type ReactNode,type AnchorHTMLAttributes} from 'react';
import NextLink from 'next/link';
import {LIBRARY,libraryPath} from '@/lib/library-config';
import {libraryText,type LibraryLocale} from '@/lib/library-i18n';
const Locale = createContext<LibraryLocale>('en');
export function LibraryLocaleProvider({locale,children}:{locale:LibraryLocale;children:ReactNode}) {
  return <Locale.Provider value={locale}>{children}</Locale.Provider>;
}
export const useLibraryLocale = () => useContext(Locale);
export function useLibraryText() {
  const locale = useLibraryLocale();
  return useCallback((text:string,values?:Record<string,string|number>) => libraryText(locale,text,values),[locale]);
}
export function LibraryLink({href = '/',prefetch,...props}:AnchorHTMLAttributes<HTMLAnchorElement>&{prefetch?:boolean}) {
  const locale = useLibraryLocale();
  if (!LIBRARY.websiteLocales) return <NextLink href={href} prefetch={prefetch} {...props}/>;
  const book = /^\/books\/([^/]+)$/.exec(href);
  const destination = href === '/' ? libraryPath(undefined,locale) : book ? libraryPath(book[1],locale) : href;
  return <a href={destination} {...props}/>;
}
