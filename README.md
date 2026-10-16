# i18n-gettext

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Framework-agnostic [gettext](https://www.gnu.org/software/gettext/)
translations for JavaScript and TypeScript. It is the shared core of:

- [svelte-i18n-gettext](https://github.com/rgglez/svelte-i18n-gettext) (v3+)
- [react-i18n-gettext](https://github.com/rgglez/react-i18n-gettext)
- [astro-i18n-gettext](https://github.com/rgglez/astro-i18n-gettext)

Use it directly in vanilla code, Web Components, or any other framework.
The gettext implementation ([@postalsys/gettext](https://www.npmjs.com/package/@postalsys/gettext))
is isolated in `src/backend.ts`, so it can be replaced without touching the
public API.

## Install

```bash
npm install @rgglez/i18n-gettext
```

## Usage

### One-off translator

```ts
import { createTranslator, sprintf } from "@rgglez/i18n-gettext";
import es from "./i18n/es-MX/messages.json";
import fr from "./i18n/fr-FR/messages.json";

const { _, _n } = createTranslator("es-MX", { "es-MX": es, "fr-FR": fr });

_("Good bye.");
_("Open", "menu"); // explicit context
sprintf(_n("One file deleted", "%d files deleted", n), n);
sprintf(_("%1$s won %2$s"), name, prize); // translators may reorder
```

Translators are immutable and safe to create per request on a server.
Destructure `_` and `_n`: `xgettext` extracts `_("...")` but not member calls
such as `t._("...")`.

### Live language switching

```ts
import { createGettextStore } from "@rgglez/i18n-gettext";

const store = createGettextStore({ lang: "en", catalogs: { es, fr } });
const stop = store.subscribe(({ _ }) => {
  title.textContent = _("Welcome");
});
store.setLang("fr");
store.addCatalog("de", de);
stop();
```

`subscribe` follows the Svelte store contract (it runs immediately and returns
an unsubscriber), so the store also works with `$store` in Svelte and with
React's `useSyncExternalStore`. Keep one store per client; on a server, create
a translator per request instead of sharing a mutable language.

## API

| Export | Description |
| :----- | :---------- |
| `createTranslator(lang, catalogs?)` | `{ lang, _, _n, hasTranslations }` |
| `createGettextStore({ lang, catalogs? })` | `{ subscribe, get, setLang, addCatalog }` |
| `resolveLocale(lang, catalogs)` | Catalog key for a locale, or `undefined` |
| `sprintf`, `vsprintf` | Re-exported from [sprintf-js](https://www.npmjs.com/package/sprintf-js) |

```ts
_(msgid, msgctxt = "app")
_n(msgid, msgidPlural = "", count = 0, msgctxt = "app")
```

Locales resolve exactly first, then by primary language in both directions
(`es-MX` finds `es`, and `es` finds `es-MX`). A missing catalog or entry
returns the msgid (or `msgidPlural` when `count !== 1`).

## Catalogs

Catalogs use the JSON shape produced by
[gettext-parser](https://github.com/smhg/gettext-parser). Convert `.po` files
with [gettext-po2json](https://github.com/rgglez/gettext-po2json), using the
`app` default context:

```bash
xgettext -o messages.pot -L TypeScript --from-code=utf-8 --no-wrap \
  --keyword=_ --keyword=_n:1,2 src/*.ts
msgmerge -U es.po messages.pot
perl po2json.pl --po es.po --json es.json --context app
```

## Development

```bash
bun install
bun test src
bun run build
```

## License

Copyright (c) 2026 Rodolfo González González.

Licensed under the [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
license. Read the [LICENSE](LICENSE) file.
