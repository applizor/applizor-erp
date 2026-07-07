import { parseISO } from 'date-fns/parseISO';

export interface LocaleConfig {
  code: string;
  label: string;
  dateFormat: string;
  timeFormat: string;
  dateTimeFormat: string;
  numberGroupSeparator: string;
  numberDecimalSeparator: string;
  currencyCode: string;
  currencySymbol: string;
  currencyFormat: 'prefix' | 'suffix';
  firstDayOfWeek: 0 | 1;
  timezone: string;
}

const LOCALE_CACHE = new Map<string, LocaleConfig>();

const FALLBACK_LOCALE: LocaleConfig = {
  code: 'en-IN',
  label: 'English (India)',
  dateFormat: 'dd/MM/yyyy',
  timeFormat: 'hh:mm a',
  dateTimeFormat: 'dd/MM/yyyy hh:mm a',
  numberGroupSeparator: ',',
  numberDecimalSeparator: '.',
  currencyCode: 'INR',
  currencySymbol: '\u20B9',
  currencyFormat: 'prefix',
  firstDayOfWeek: 1,
  timezone: 'Asia/Kolkata',
};

let _currentLocale: LocaleConfig = FALLBACK_LOCALE;

export async function fetchLocales(): Promise<{ code: string; label: string }[]> {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/platform/locales', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchLocaleConfig(code: string): Promise<LocaleConfig> {
  if (LOCALE_CACHE.has(code)) return LOCALE_CACHE.get(code)!;
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/platform/locale/${code}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return FALLBACK_LOCALE;
  const config = await res.json();
  LOCALE_CACHE.set(code, config);
  return config;
}

export function setLocale(code: string): Promise<LocaleConfig> {
  return fetchLocaleConfig(code).then((config) => {
    _currentLocale = config;
    localStorage.setItem('locale', code);
    return config;
  });
}

export function getLocale(): LocaleConfig {
  return _currentLocale;
}

export function initLocale(): Promise<LocaleConfig> {
  const saved = localStorage.getItem('locale');
  if (saved && LOCALE_CACHE.has(saved)) {
    _currentLocale = LOCALE_CACHE.get(saved)!;
    return Promise.resolve(_currentLocale);
  }
  return fetchLocaleConfig(saved || 'en-IN').then((config) => {
    _currentLocale = config;
    LOCALE_CACHE.set(config.code, config);
    return config;
  });
}

export function formatDate(date: string | Date, fmt?: string): string {
  const config = _currentLocale;
  const formatStr = fmt || config.dateFormat;
  const d = typeof date === 'string' ? parseISO(date) : date;
  const map: Record<string, string> = {
    dd: String(d.getDate()).padStart(2, '0'),
    MM: String(d.getMonth() + 1).padStart(2, '0'),
    yyyy: String(d.getFullYear()),
    HH: String(d.getHours()).padStart(2, '0'),
    hh: String(d.getHours() % 12 || 12).padStart(2, '0'),
    mm: String(d.getMinutes()).padStart(2, '0'),
    a: d.getHours() >= 12 ? 'PM' : 'AM',
  };
  let result = formatStr;
  for (const [key, val] of Object.entries(map)) {
    result = result.replace(key, val);
  }
  return result;
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, _currentLocale.dateTimeFormat);
}

export function formatCurrency(amount: number): string {
  const config = _currentLocale;
  try {
    const fmt = new Intl.NumberFormat(
      config.code.replace('-', '_'),
      { style: 'currency', currency: config.currencyCode, minimumFractionDigits: 2 }
    );
    return fmt.format(amount);
  } catch {
    return `${config.currencySymbol}${amount.toFixed(2)}`;
  }
}

export function formatNumber(amount: number): string {
  try {
    return new Intl.NumberFormat(_currentLocale.code.replace('-', '_')).format(amount);
  } catch {
    return amount.toLocaleString();
  }
}
