const ATTRIBUTE_KEYS_ON_OTHER_COLUMNS = new Set([
  'payment_type',
  'department',
  'invoice_date',
  'invoice_paid_date',
  'softr_submitted_by_name',
])

const toTitleCase = (input: string): string =>
  String(input)
    .toLowerCase()
    .replace(/([^\s\-/&(.]+)/g, (w) => w.charAt(0).toUpperCase() + w.slice(1))

const humanizeAttributeKey = (key: string): string =>
  toTitleCase(String(key).replace(/_/g, ' ').trim())

const isEmptyAttributeValue = (value: unknown): boolean => {
  if (value == null) return true
  if (typeof value === 'string') return !value.trim()
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value as object).length === 0
  return false
}

const formatAttributeValue = (value: unknown): string => {
  if (value == null) return '—'
  if (typeof value === 'string') return value.trim() || '—'
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    const parts = value.map((item) => {
      if (item == null) return ''
      if (
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean'
      ) {
        return String(item)
      }
      if (typeof item === 'object' && item && 'label' in item) {
        const label = (item as { label?: string }).label
        if (typeof label === 'string' && label.trim()) return label.trim()
      }
      try {
        return JSON.stringify(item)
      } catch {
        return String(item)
      }
    })
    const joined = parts.filter(Boolean).join(', ')
    return joined || '—'
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function collectDisplayParts(attributes: Record<string, unknown>): string[] {
  const parts: string[] = []

  const creditCards = attributes.credit_cards
  if (Array.isArray(creditCards)) {
    for (const item of creditCards) {
      if (typeof item === 'string' && item.trim()) {
        parts.push(item.trim())
        continue
      }
      if (item && typeof item === 'object' && 'label' in item) {
        const label = (item as { label?: string }).label
        if (typeof label === 'string' && label.trim()) parts.push(label.trim())
      }
    }
  }

  for (const key of Object.keys(attributes).sort()) {
    if (key === 'credit_cards') continue
    if (ATTRIBUTE_KEYS_ON_OTHER_COLUMNS.has(key)) continue
    const value = attributes[key]
    if (isEmptyAttributeValue(value)) continue
    parts.push(`${humanizeAttributeKey(key)}: ${formatAttributeValue(value)}`)
  }

  return parts
}

type AttributesCellProps = {
  attributes: Record<string, unknown>
}

export function AttributesCell({ attributes }: AttributesCellProps) {
  const parts = collectDisplayParts(attributes)
  if (parts.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return (
    <span
      className="block truncate text-sm text-foreground"
      title={parts.join('; ')}
    >
      {parts.join(', ')}
    </span>
  )
}
