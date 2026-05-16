import es from '../locales/es';
import en from '../locales/en';
import { useSettingsStore, type LocaleSetting } from '../stores/settingsStore';

const dictionaries = { es, en };

export type AppLocale = keyof typeof dictionaries;
export type TranslationKey = keyof typeof es;

function detectSystemLocale(): AppLocale {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    return locale.startsWith('en') ? 'en' : 'es';
  } catch {
    return 'es';
  }
}

export function resolveLocale(setting: LocaleSetting): AppLocale {
  if (setting === 'es' || setting === 'en') return setting;
  return detectSystemLocale();
}

export function translate(
  locale: AppLocale,
  key: TranslationKey,
  values?: Record<string, string | number>
): string {
  const template = dictionaries[locale][key] ?? dictionaries.es[key] ?? key;
  if (!values) return template;
  let text: string = template;
  Object.entries(values).forEach(([name, value]) => {
    text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
  });
  return text;
}

export function useI18n() {
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const locale = resolveLocale(language);

  return {
    locale,
    language,
    setLanguage,
    t: (key: TranslationKey, values?: Record<string, string | number>) => translate(locale, key, values),
  };
}
