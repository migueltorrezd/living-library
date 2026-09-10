import routes from './library-routes.json';
import {libraryLocale,type LibraryLocale} from './library-i18n';
import settings from './library-settings.json';

export const LIBRARY = settings;
export const BASE_PATH = (process.env.NEXT_PUBLIC_LIBRARY_BASE_PATH || '').replace(/\/$/, '');
export const assetUrl = (path: string) => path.startsWith('/') ? `${BASE_PATH}${path}` : path;
export const libraryPath = (slug?: string, locale: LibraryLocale = 'en') => {
  if (!LIBRARY.websiteLocales) return `${BASE_PATH}${slug ? `/books/${slug}` : '/'}`;
  const route = routes[locale];
  return `/${locale}/${route.projects}/${route.library}${slug ? `/${route.books}/${slug}` : ''}`;
};
export const libraryReturnPath = (locale: LibraryLocale) => LIBRARY.websiteLocales ? `/${locale}/${routes[locale].projects}` : LIBRARY.returnUrl;
export const internalPath = (path: string) => {
  if (LIBRARY.websiteLocales) {
    const parts = path.replace(/\/$/,'').split('/').filter(Boolean);
    const locale = libraryLocale(parts[0]);
    const route = routes[locale];
    if (parts[0] === locale && parts[1] === route.projects && parts[2] === route.library)
      return parts.length === 3 ? '/' : parts.length === 5 && parts[3] === route.books ? `/books/${parts[4]}` : path;
    const exported = path.replace(/^\/library/,'').split('/').filter(Boolean);
    if (Object.hasOwn(routes,exported[0])) return exported.length === 1 ? '/' : '/' + exported.slice(1).join('/');
  }
  const local = BASE_PATH && (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) ? path.slice(BASE_PATH.length) : path;
  return local.replace(/\/$/, '') || '/';
};
