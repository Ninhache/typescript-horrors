import en from "./locales/en";
import fr from "./locales/fr";
import { DEFAULT_I18N_KEY, LanguageKeys } from "./types";

export const translations = {
  fr,
  en,
} as const;

export function useTranslation<L extends LanguageKeys>(
  lang: L = DEFAULT_I18N_KEY as L,
  random = true
): (typeof translations)[LanguageKeys] {
  if (random) {
    const languages = Object.keys(translations) as LanguageKeys[];
    const randomLang = languages[Math.floor(Math.random() * languages.length)];
    return translations[randomLang];
  }

  return translations[lang];
}
