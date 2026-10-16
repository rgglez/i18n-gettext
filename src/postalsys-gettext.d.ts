// @postalsys/gettext ships no types; declare only what backend.ts uses.
declare module "@postalsys/gettext" {
  export default class Gettext {
    addTranslations(locale: string, domain: string, translations: unknown): void;
    setLocale(locale: string): void;
    pgettext(msgctxt: string, msgid: string): string;
    npgettext(
      msgctxt: string,
      msgid: string,
      msgidPlural: string,
      count: number
    ): string;
  }
}
