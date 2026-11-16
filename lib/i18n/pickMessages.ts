import type {AbstractIntlMessages} from 'next-intl';

/**
 * Narrow the catalogue to the namespaces a client island actually reads, so a
 * `NextIntlClientProvider` only serialises those strings into the RSC payload.
 */
export function pickMessages(messages: AbstractIntlMessages, namespaces: readonly string[]): AbstractIntlMessages {
  const out: AbstractIntlMessages = {};
  for (const ns of namespaces) {
    if (ns in messages) out[ns] = messages[ns];
  }
  return out;
}
