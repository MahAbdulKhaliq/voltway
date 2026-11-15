import en from './en.json';

// All on-screen text lives in per-language dictionaries (en.json now, fr.json later).
// Components never hard-code user-facing strings: they call t('some.key').

export type Locale = 'en';
export type MessageKey = keyof typeof en;

const dictionaries: Record<Locale, Record<MessageKey, string>> = { en };

/**
 * Look up a message and fill `{name}` placeholders from `params`.
 * Throws on an unknown key so a missing translation fails the build instead of shipping.
 */
export function t(
  key: MessageKey,
  params: Record<string, string | number> = {},
  locale: Locale = 'en',
): string {
  const message = dictionaries[locale][key];
  if (message === undefined) {
    throw new Error(`Missing i18n key "${key}" for locale "${locale}"`);
  }
  return message.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
