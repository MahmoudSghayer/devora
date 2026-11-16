import type {Tx} from './i18n';

// The engine returns its assumptions as English sentences. Known sentences are
// mapped to translation keys so Arabic visitors read Arabic; an unknown
// sentence is shown as-is in English only.

const KEYS: Record<string, string> = {
  'Indicative starting range for a custom web app, not a quotation; scope is confirmed in a discovery call.': 'base',
  'Existing spreadsheets are imported once into the new system.': 'spreadsheets',
  'Current tools stay in place and are connected where they have an API.': 'disconnected',
  'Data is migrated from your current off-the-shelf tool where an export exists.': 'offtheshelf',
  'Mobile-friendly responsive interface is included; native mobile apps are quoted separately.': 'mobile',
  'Notifications are priced as email automation; SMS/WhatsApp are extra.': 'notifications',
  'Integrations are not yet defined; one third-party integration is assumed.': 'int_unsure',
  'Several integrations are assumed; each additional system may add cost.': 'int_many',
  'The requested timeline is shorter than the typical delivery time; scope may need to be phased.': 'time_short',
  'The typical delivery time is longer than three months; scope may need to be phased.': 'time_long',
};

export function localizeAssumptions(list: readonly string[], t: Tx, locale: string): string[] {
  const out: string[] = [];
  for (const s of list) {
    const key = KEYS[s];
    if (key === 'base') continue; // covered by the standing disclaimer
    if (key) out.push(t(`assume.${key}`));
    else if (locale === 'en') out.push(s);
  }
  return out;
}
