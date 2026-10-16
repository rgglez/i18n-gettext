import sprintfJs from "sprintf-js";
import { createBackend } from "./backend.js";

/** Re-exported so consumers format messages without a second dependency. */
export const { sprintf, vsprintf } = sprintfJs;

/** A catalog in gettext-parser's JSON shape (e.g. from po2json.pl). */
export interface Catalog {
  charset?: string;
  headers?: Record<string, string>;
  translations: Record<
    string,
    Record<
      string,
      { msgid: string; msgctxt?: string; msgid_plural?: string; msgstr: string[] }
    >
  >;
}
/** Catalogs keyed by locale, such as `es`, `es-MX`, or `fr-FR`. */
export type Catalogs = Record<string, Catalog>;

export interface Translator {
  /** The requested locale, not necessarily the catalog key that served it. */
  lang: string;
  _(msgid: string, msgctxt?: string): string;
  _n(
    msgid: string,
    msgidPlural?: string,
    count?: number,
    msgctxt?: string
  ): string;
  /** Whether any catalog serves this locale. */
  hasTranslations(): boolean;
}

const primary = (locale: string) => locale.split(/[-_]/)[0].toLowerCase();

/**
 * Pick the catalog key for a locale: exact match first, then the first key
 * sharing its primary language (`es-MX` ↔ `es`). Undefined when none match.
 */
export function resolveLocale(lang: string, catalogs: Catalogs) {
  if (Object.hasOwn(catalogs, lang)) return lang;
  return Object.keys(catalogs).find(key => primary(key) === primary(lang));
}

/**
 * Build an immutable translator. Untranslated strings fall back to the msgid.
 * Signatures match svelte-i18n-gettext: the default context is `app`.
 */
export function createTranslator(
  lang: string,
  catalogs: Catalogs = {}
): Translator {
  const key = resolveLocale(lang, catalogs);
  const backend = createBackend(key ?? lang, key ? catalogs[key] : undefined);
  return {
    lang,
    _: (msgid, msgctxt = "app") => backend.pgettext(msgctxt, msgid),
    _n: (msgid, msgidPlural = "", count = 0, msgctxt = "app") =>
      backend.npgettext(msgctxt, msgid, msgidPlural, count),
    hasTranslations: () => key !== undefined,
  };
}

export interface GettextStore {
  /** Svelte store contract: runs immediately, returns an unsubscriber. */
  subscribe(run: (translator: Translator) => void): () => void;
  get(): Translator;
  setLang(lang: string): void;
  addCatalog(lang: string, catalog: Catalog): void;
}

/**
 * Observable translator for live language switching. Works as a Svelte store,
 * with React's useSyncExternalStore, or from plain scripts. Keep one per
 * client; on a server, create translators per request instead.
 */
export function createGettextStore({
  lang,
  catalogs = {},
}: {
  lang: string;
  catalogs?: Catalogs;
}): GettextStore {
  let current = createTranslator(lang, catalogs);
  const subscribers = new Set<(translator: Translator) => void>();
  function update(nextLang: string) {
    current = createTranslator(nextLang, catalogs);
    subscribers.forEach(run => run(current));
  }
  return {
    subscribe(run) {
      subscribers.add(run);
      run(current);
      return () => {
        subscribers.delete(run);
      };
    },
    get: () => current,
    setLang: update,
    addCatalog(locale, catalog) {
      catalogs = { ...catalogs, [locale]: catalog };
      update(current.lang);
    },
  };
}
