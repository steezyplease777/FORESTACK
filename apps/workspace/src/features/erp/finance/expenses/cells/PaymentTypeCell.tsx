// @ts-nocheck

import { IconSelector } from '@tabler/icons-react'

import { cn } from '@/lib/utils'

import type { PaymentTypeColorConfig } from '../ExpenseAdminTable.types'

type PaymentTypeCellProps = {
  label: string
  colors: PaymentTypeColorConfig[]
}

const toTitleCase = (input: string): string =>
  String(input)
    .toLowerCase()
    .replace(/([^\s\-/&(.]+)/g, (w) => w.charAt(0).toUpperCase() + w.slice(1))

export function PaymentTypeCell({ label, colors }: PaymentTypeCellProps) {
  if (!label) return <span className="text-xs text-muted-foreground">—</span>

  const display = toTitleCase(label)
  const match = colors.find(
    (c) => c.paymentTypeName.toUpperCase() === label.toUpperCase(),
  )
  const style = match
    ? { color: match.textColor, backgroundColor: match.backgroundColor }
    : undefined

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 truncate rounded px-2 py-1',
        'text-[11px] font-semibold leading-tight',
        !style && 'bg-muted text-muted-foreground',
      )}
      style={style}
    >
      <span className="truncate">{display}</span>
      <IconSelector className="size-3 shrink-0 opacity-60" />
    </span>
  )
}
