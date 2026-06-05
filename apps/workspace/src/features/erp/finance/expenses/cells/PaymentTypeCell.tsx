// @ts-nocheck

import { cn } from '@/lib/utils'

import type { PaymentTypeColorConfig } from '../ExpenseAdminTable.types'

type PaymentTypeCellProps = {
  label: string
  colors: PaymentTypeColorConfig[]
}

export function PaymentTypeCell({ label, colors }: PaymentTypeCellProps) {
  if (!label) return <span className="text-xs text-muted-foreground">—</span>

  const match = colors.find((c) => c.paymentTypeName === label)
  const style = match
    ? { color: match.textColor, backgroundColor: match.backgroundColor }
    : undefined

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5',
        'text-[11px] font-semibold leading-tight',
        !style && 'bg-muted text-muted-foreground',
      )}
      style={style}
    >
      {label}
    </span>
  )
}
