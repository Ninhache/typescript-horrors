type NotScanned = "";
type Scanned = "__SCANNED__";
type MaybeScanned = NotScanned | Scanned;

export type TypedLeafsVocabData<T extends MaybeScanned> = {
  [key: string]: T extends "NotScanned"
    ? NotScanned | TypedLeafsVocabData<T>
    : string | TypedLeafsVocabData<T>;
};

export const DEFAULT_I18N_KEY = "fr" as LanguageKeys;

export type LanguageKeys = "fr" | "en";

export type TranslationObject<T> = {
  [K in keyof T]: T[K] extends string ? T[K] : TranslationObject<T[K]>;
};
