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

const LOCALE_MAP: Record<string, LocaleConfig> = {
  'en-IN': {
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
  },
  'en-US': {
    code: 'en-US',
    label: 'English (US)',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'hh:mm a',
    dateTimeFormat: 'MM/dd/yyyy hh:mm a',
    numberGroupSeparator: ',',
    numberDecimalSeparator: '.',
    currencyCode: 'USD',
    currencySymbol: '$',
    currencyFormat: 'prefix',
    firstDayOfWeek: 0,
    timezone: 'America/New_York',
  },
  'en-GB': {
    code: 'en-GB',
    label: 'English (UK)',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'dd/MM/yyyy HH:mm',
    numberGroupSeparator: ',',
    numberDecimalSeparator: '.',
    currencyCode: 'GBP',
    currencySymbol: '\u00A3',
    currencyFormat: 'prefix',
    firstDayOfWeek: 1,
    timezone: 'Europe/London',
  },
  'en-AE': {
    code: 'en-AE',
    label: 'English (UAE)',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'hh:mm a',
    dateTimeFormat: 'dd/MM/yyyy hh:mm a',
    numberGroupSeparator: ',',
    numberDecimalSeparator: '.',
    currencyCode: 'AED',
    currencySymbol: '\u062F.\u0625',
    currencyFormat: 'prefix',
    firstDayOfWeek: 1,
    timezone: 'Asia/Dubai',
  },
  'en-SG': {
    code: 'en-SG',
    label: 'English (Singapore)',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'hh:mm a',
    dateTimeFormat: 'dd/MM/yyyy hh:mm a',
    numberGroupSeparator: ',',
    numberDecimalSeparator: '.',
    currencyCode: 'SGD',
    currencySymbol: 'S$',
    currencyFormat: 'prefix',
    firstDayOfWeek: 1,
    timezone: 'Asia/Singapore',
  },
  'hi-IN': {
    code: 'hi-IN',
    label: 'हिन्दी (India)',
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
  },
};

export const SUPPORTED_LOCALES = Object.keys(LOCALE_MAP);

export function getLocaleConfig(locale: string): LocaleConfig {
  return LOCALE_MAP[locale] || LOCALE_MAP['en-IN'];
}

export function formatDate(date: Date | string, locale: string): string {
  const config = getLocaleConfig(locale);
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;

  return config.dateFormat
    .replace('dd', day)
    .replace('MM', month)
    .replace('yyyy', String(year))
    .replace('HH', String(hours).padStart(2, '0'))
    .replace('hh', String(h12).padStart(2, '0'))
    .replace('mm', minutes)
    .replace('a', ampm);
}

export function formatCurrency(amount: number, locale: string): string {
  const config = getLocaleConfig(locale);
  const formatted = new Intl.NumberFormat(locale.replace('-', '_'), {
    style: 'currency',
    currency: config.currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return formatted;
}

export function formatNumber(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale.replace('-', '_')).format(amount);
}

export function getCompanyTimezone(companyId: string): string {
  // Default to Asia/Kolkata, actual value from DB is fetched by controller
  return 'Asia/Kolkata';
}

export const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Kuala_Lumpur',
  'Asia/Riyadh', 'Asia/Doha', 'Asia/Shanghai', 'Asia/Tokyo',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Australia/Sydney', 'Pacific/Auckland', 'Africa/Cairo', 'Africa/Lagos',
];
