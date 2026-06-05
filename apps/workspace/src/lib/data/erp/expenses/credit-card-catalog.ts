export const CREDIT_CARD_BANK_LABEL_BY_ID: Record<string, string> = {
  AMEX: 'American Express',
  CHASE: 'Chase',
  BANK_OF_AMERICA: 'Bank of America',
  WELLS_FARGO: 'Wells Fargo',
  CITI: 'Citi',
  CAPITAL_ONE: 'Capital One',
  US_BANK: 'U.S. Bank',
  PNC: 'PNC',
  TD_BANK: 'TD Bank',
  TRUIST: 'Truist',
  DISCOVER: 'Discover',
  BARCLAYS: 'Barclays',
  HSBC: 'HSBC',
  GOLDMAN_SACHS: 'Goldman Sachs',
  BREX: 'Brex',
  RAMP: 'Ramp',
  MERCURY: 'Mercury',
  SILICON_VALLEY_BANK: 'Silicon Valley Bank',
  OTHER: 'Other',
}

export type CreditCardCatalogEntry = {
  id: string
  title: string
  last4: string
  bankLabel: string
  holderName: string
}

export function orgUserDisplayName(ou: {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
} | null | undefined): string {
  if (!ou) return ''
  const fromParts = [ou.first_name, ou.last_name].filter(Boolean).join(' ').trim()
  return fromParts || (typeof ou.email === 'string' ? ou.email.trim() : '') || ''
}

export function formatCreditCardCatalogTitle(
  holderName: string,
  bank: string | null | undefined,
  last4: string,
): string {
  const bankLabel = bank ? CREDIT_CARD_BANK_LABEL_BY_ID[bank] || bank : ''
  const suffix = last4 ? `•• ${last4}` : ''
  if (holderName && bankLabel) return `${holderName} · ${bankLabel} ${suffix}`.trim()
  if (holderName) return `${holderName} ${suffix}`.trim()
  if (bankLabel) return `${bankLabel} ${suffix}`.trim()
  return suffix || 'Credit card'
}

export function maskCardLast4(last4: string): string {
  const digits = last4.replace(/\D/g, '').slice(-4)
  return digits.length === 4 ? `*******${digits}` : ''
}
