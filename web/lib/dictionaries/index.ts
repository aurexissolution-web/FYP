import type { Dictionary } from "./types";

const dictionaries = {
  en: () => import("./en").then((m) => m.default),
  ms: () => import("./ms").then((m) => m.default),
};

export type Locale = keyof typeof dictionaries;
export const LOCALES: Locale[] = ["en", "ms"];
export const DEFAULT_LOCALE: Locale = "en";

export const hasLocale = (locale: string): locale is Locale =>
  (LOCALES as string[]).includes(locale);

export const getDictionary = async (locale: Locale): Promise<Dictionary> =>
  dictionaries[locale]();

export type { Dictionary };
