/* ==========================================================================
   Languages. The main one (first in LANGUAGES, src/settings.ts) is at /, any
   other at /<language>/.
   ========================================================================== */

import { site } from './content/site';
import { LANGUAGES } from './settings';

export const languages = LANGUAGES;
export type Lang = (typeof languages)[number];
export const mainLang: Lang = languages[0];

const copy: Record<string, Record<string, string>> = site;

/** Returns t('some.key') for one language. A missing key fails the build. */
export function useT(lang: Lang) {
  return (key: string): string => {
    const value = copy[lang]?.[key];
    if (value === undefined) throw new Error(`No ${lang} copy for "${key}"`);
    return value;
  };
}

/** The address of a page in a language: localePath('en', 'menu/') → '/en/menu/'. */
export function localePath(lang: Lang, page = ''): string {
  return (lang === mainLang ? '/' : `/${lang}/`) + page;
}
