// The only module that knows the gettext implementation. Replacing
// @postalsys/gettext means rewriting this file and nothing else.
import Gettext from "@postalsys/gettext";
import type { Catalog } from "./index.js";

export interface Backend {
  pgettext(msgctxt: string, msgid: string): string;
  npgettext(
    msgctxt: string,
    msgid: string,
    msgidPlural: string,
    count: number
  ): string;
}

/** Build a lookup bound to one locale; `catalog` may be absent. */
export function createBackend(locale: string, catalog?: Catalog): Backend {
  const gt = new Gettext();
  if (catalog) gt.addTranslations(locale, "messages", catalog);
  gt.setLocale(locale);
  return {
    pgettext: (msgctxt, msgid) => gt.pgettext(msgctxt, msgid),
    npgettext: (msgctxt, msgid, msgidPlural, count) =>
      gt.npgettext(msgctxt, msgid, msgidPlural, count),
  };
}
