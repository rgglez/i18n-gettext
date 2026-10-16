import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createGettextStore,
  createTranslator,
  sprintf,
  type Catalog,
} from "./index";

const es: Catalog = {
  charset: "utf-8",
  translations: {
    app: {
      Hello: { msgid: "Hello", msgstr: ["Hola"] },
      "One file": {
        msgid: "One file",
        msgid_plural: "%d files",
        msgstr: ["Un archivo", "%d archivos"],
      },
      "%1$s won %2$s": { msgid: "%1$s won %2$s", msgstr: ["%2$s ganó %1$s"] },
    },
    menu: { Open: { msgid: "Open", msgstr: ["Abrir"] } },
  },
};

test("translates in the default app context and in explicit contexts", () => {
  const t = createTranslator("es", { es });
  assert.equal(t._("Hello"), "Hola");
  assert.equal(t._("Open", "menu"), "Abrir");
  assert.equal(t._("Open"), "Open");
  assert.ok(t.hasTranslations());
});

test("matches regional and base locales in both directions", () => {
  assert.equal(createTranslator("es-MX", { es })._("Hello"), "Hola");
  assert.equal(createTranslator("es", { "es-MX": es })._("Hello"), "Hola");
});

test("unknown locales fall back to the msgid", () => {
  const t = createTranslator("de", { es });
  assert.equal(t._("Hello"), "Hello");
  assert.equal(t._n("One file", "%d files", 2), "%d files");
  assert.ok(!t.hasTranslations());
});

test("plurals and positional sprintf arguments", () => {
  const t = createTranslator("es", { es });
  assert.equal(sprintf(t._n("One file", "%d files", 1), 1), "Un archivo");
  assert.equal(sprintf(t._n("One file", "%d files", 3), 3), "3 archivos");
  assert.equal(sprintf(t._("%1$s won %2$s"), "Ana", "$5"), "$5 ganó Ana");
});

test("store notifies subscribers on language and catalog changes", () => {
  const store = createGettextStore({ lang: "en", catalogs: { es } });
  const seen: string[] = [];
  const stop = store.subscribe(t => seen.push(t._("Hello")));
  store.setLang("es");
  store.addCatalog("es", {
    translations: { app: { Hello: { msgid: "Hello", msgstr: ["¡Hola!"] } } },
  });
  stop();
  store.setLang("en");
  assert.deepEqual(seen, ["Hello", "Hola", "¡Hola!"]);
  assert.equal(store.get().lang, "en");
});
