import * as React from 'react'
import { IconCreditCard, IconDots } from '@tabler/icons-react'

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  maskCardLast4,
  type CreditCardCatalogEntry,
} from '@/lib/data/erp/expenses/credit-card-catalog'

const ATTRIBUTES_CELL_VISIBLE = 4

const ATTRIBUTE_KEYS_ON_OTHER_COLUMNS = new Set([
  'payment_type',
  'department',
  'invoice_date',
  'invoice_paid_date',
  'softr_submitted_by_name',
])

type CreditCardAttributeRef = { id?: string; label?: string }

type UncategorizedAttributeRow = {
  key: string
  label: string
  value: string
}

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

const parseCreditCardAttributeRefs = (
  attributes: Record<string, unknown>,
): CreditCardAttributeRef[] => {
  const raw = attributes?.credit_cards
  if (!Array.isArray(raw)) return []
  const out: CreditCardAttributeRef[] = []
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) {
      out.push({ label: item.trim() })
      continue
    }
    if (!item || typeof item !== 'object') continue
    const id =
      'id' in item && (item as { id?: string }).id
        ? String((item as { id: string }).id)
        : ''
    const label =
      'label' in item && (item as { label?: string }).label
        ? String((item as { label: string }).label).trim()
        : ''
    if (id || label) out.push({ id: id || undefined, label: label || undefined })
  }
  return out
}

const collectUncategorizedAttributes = (
  attributes: Record<string, unknown>,
): UncategorizedAttributeRow[] => {
  const rows: UncategorizedAttributeRow[] = []
  for (const key of Object.keys(attributes).sort()) {
    if (key === 'credit_cards') continue
    if (ATTRIBUTE_KEYS_ON_OTHER_COLUMNS.has(key)) continue
    const value = attributes[key]
    if (isEmptyAttributeValue(value)) continue
    rows.push({
      key,
      label: humanizeAttributeKey(key),
      value: formatAttributeValue(value),
    })
  }
  return rows
}

function AttributeIconTile({
  icon,
  ariaLabel,
  className,
}: {
  icon: React.ReactNode
  ariaLabel: string
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className={[
        'inline-flex size-7 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded border border-border bg-muted/40 text-muted-foreground',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon}
    </button>
  )
}

function CreditCardAttributeHoverContent({
  catalogEntry,
  fallbackLabel,
}: {
  catalogEntry?: CreditCardCatalogEntry
  fallbackLabel?: string
}) {
  const holder =
    catalogEntry?.holderName ||
    (fallbackLabel ? toTitleCase(fallbackLabel) : '') ||
    '—'
  const bank = catalogEntry?.bankLabel || ''
  const masked = catalogEntry?.last4
    ? maskCardLast4(catalogEntry.last4)
    : fallbackLabel
      ? maskCardLast4(fallbackLabel) || '*******'
      : '*******'
  const summary = bank && bank !== '—' ? `${holder} · ${bank}` : holder

  return (
    <div className="min-w-[160px] space-y-0.5 text-left">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Credit card
      </p>
      <p className="text-sm font-medium leading-snug text-foreground">{summary}</p>
      <p className="font-mono text-xs tracking-wide text-foreground">{masked}</p>
    </div>
  )
}

function UncategorizedAttributesHoverContent({
  rows,
}: {
  rows: UncategorizedAttributeRow[]
}) {
  if (rows.length === 0) return null

  return (
    <div className="w-[260px] max-w-[min(300px,calc(100vw-2rem))] text-left">
      <div className="max-h-[min(180px,32vh)] overflow-auto">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className="h-7 whitespace-nowrap px-2.5 py-0 text-[11px] font-bold uppercase tracking-wide">
                Field
              </TableHead>
              <TableHead className="h-7 whitespace-nowrap px-2.5 py-0 text-[11px] font-bold uppercase tracking-wide">
                Value
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.key}
                className="border-b border-border/40 last:border-0 hover:bg-transparent"
              >
                <TableCell className="whitespace-nowrap px-2.5 py-1 text-[11px] font-medium text-foreground">
                  {row.label}
                </TableCell>
                <TableCell className="whitespace-nowrap px-2.5 py-1 text-[11px] text-muted-foreground">
                  {row.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

type AttributesCellProps = {
  attributes: Record<string, unknown>
  creditCardsById?: Map<string, CreditCardCatalogEntry>
}

export function AttributesCell({
  attributes,
  creditCardsById,
}: AttributesCellProps) {
  const catalog = creditCardsById ?? new Map<string, CreditCardCatalogEntry>()
  const cardRefs = parseCreditCardAttributeRefs(attributes)
  const uncategorized = collectUncategorizedAttributes(attributes)

  if (cardRefs.length === 0 && uncategorized.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const visible = cardRefs.slice(0, ATTRIBUTES_CELL_VISIBLE)
  const overflow = cardRefs.length - ATTRIBUTES_CELL_VISIBLE

  return (
    <div className="flex min-h-8 flex-wrap items-center gap-1">
      {visible.map((ref, idx) => {
        const catalogEntry = ref.id ? catalog.get(ref.id) : undefined
        const tileTitle =
          catalogEntry?.title || ref.label || (ref.id ? 'Credit card' : 'Card')

        return (
          <HoverCard key={ref.id || ref.label || idx} openDelay={50} closeDelay={50}>
            <HoverCardTrigger asChild>
              <AttributeIconTile
                ariaLabel={tileTitle}
                icon={<IconCreditCard className="size-3.5 pointer-events-none" stroke={2} />}
              />
            </HoverCardTrigger>
            <HoverCardContent
              side="top"
              align="start"
              sideOffset={4}
              className="z-[200] w-auto border p-2 shadow-md"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <CreditCardAttributeHoverContent
                catalogEntry={catalogEntry}
                fallbackLabel={ref.label}
              />
            </HoverCardContent>
          </HoverCard>
        )
      })}

      {overflow > 0 ? (
        <span
          className="text-[11px] font-medium text-foreground"
          title={`${overflow} more card${overflow === 1 ? '' : 's'}`}
        >
          +{overflow}
        </span>
      ) : null}

      {uncategorized.length > 0 ? (
        <HoverCard openDelay={50} closeDelay={50}>
          <HoverCardTrigger asChild>
            <AttributeIconTile
              ariaLabel={`${uncategorized.length} other attribute${uncategorized.length === 1 ? '' : 's'}`}
              icon={<IconDots className="size-3.5 pointer-events-none" stroke={2} />}
            />
          </HoverCardTrigger>
          <HoverCardContent
            side="top"
            align="start"
            sideOffset={4}
            className="z-[200] w-auto border p-2 shadow-md"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <UncategorizedAttributesHoverContent rows={uncategorized} />
          </HoverCardContent>
        </HoverCard>
      ) : null}
    </div>
  )
}
