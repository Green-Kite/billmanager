export const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function normalizeLanguage(language?: string | null): SupportedLanguage {
  const normalized = language?.split(/[-_]/)[0].toLowerCase();
  return normalized === 'de' ? 'de' : 'en';
}
