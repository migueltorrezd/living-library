import messages from './library-messages.json';
export type LibraryLocale = keyof typeof messages;
export const LIBRARY_LOCALES = Object.keys(messages) as LibraryLocale[];
export const libraryLocale = (value: string): LibraryLocale => LIBRARY_LOCALES.includes(value as LibraryLocale) ? value as LibraryLocale : 'en';
export function libraryText(locale: LibraryLocale, text: string, values: Record<string,string|number> = {}) {
  const purchase = /^Buy (?:from|at|on|via) (.+)$/.exec(text);
  if (purchase && text !== 'Buy from {publisher}') return libraryText(locale, 'Buy from {publisher}', {publisher: purchase[1]});
  const translated = (messages[locale] as Record<string,string>)[text] ?? text;
  return translated.replace(/\{(\w+)\}/g, (match, key) => String(values[key] ?? match));
}
