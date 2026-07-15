import { normalizeLanguage, type SupportedLanguage } from './language';

export interface FormattingConfig {
  locale: string;
  currency: string;
  language: SupportedLanguage;
}

const FALLBACK_CONFIG: FormattingConfig = {
  locale: 'en-US',
  currency: 'USD',
  language: 'en',
};

let formattingConfig = FALLBACK_CONFIG;

function resolveLocale(locale: string, language: SupportedLanguage): string {
  try {
    const base = new Intl.Locale(locale);
    return new Intl.Locale(language, {
      region: base.region,
      script: base.script,
      calendar: base.calendar,
      hourCycle: base.hourCycle,
      numberingSystem: base.numberingSystem,
    }).toString();
  } catch {
    return language === 'de' ? 'de-DE' : 'en-US';
  }
}

export function configureFormatting(
  locale = FALLBACK_CONFIG.locale,
  currency = FALLBACK_CONFIG.currency,
  language: string = FALLBACK_CONFIG.language,
): FormattingConfig {
  const normalizedLanguage = normalizeLanguage(language);
  const resolvedLocale = resolveLocale(locale, normalizedLanguage);

  try {
    // Constructing the formatter validates both values before they become global state.
    new Intl.NumberFormat(resolvedLocale, { style: 'currency', currency }).format(0);
    formattingConfig = {
      locale: resolvedLocale,
      currency: currency.toUpperCase(),
      language: normalizedLanguage,
    };
  } catch {
    formattingConfig = FALLBACK_CONFIG;
  }

  return formattingConfig;
}

export function getFormattingConfig(): FormattingConfig {
  return { ...formattingConfig };
}

export function formatCurrency(value: number | null | undefined): string {
  return new Intl.NumberFormat(formattingConfig.locale, {
    style: 'currency',
    currency: formattingConfig.currency,
  }).format(value ?? 0);
}

export function formatCurrencyCompact(value: number | null | undefined): string {
  return new Intl.NumberFormat(formattingConfig.locale, {
    style: 'currency',
    currency: formattingConfig.currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}

export function formatDate(
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
): string {
  const localDateMatch = typeof value === 'string'
    ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    : null;
  const date = value instanceof Date
    ? value
    : localDateMatch
      ? new Date(
          Number(localDateMatch[1]),
          Number(localDateMatch[2]) - 1,
          Number(localDateMatch[3]),
        )
      : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(formattingConfig.locale, options).format(date);
}
