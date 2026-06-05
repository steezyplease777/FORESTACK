// @ts-nocheck

import { Badge } from '@/components/reui/badge'

import type { PaymentTypeColorConfig } from '../ExpenseAdminTable.types'

type PaymentTypeCellProps = {
  label: string
  colors: PaymentTypeColorConfig[]
}

export function PaymentTypeCell({ label, colors }: PaymentTypeCellProps) {
  if (!label) return <span className="text-xs text-muted-foreground">—</span>

  const match = colors.find((c) => c.paymentTypeName === label)
  const style = match
    ? { color: match.textColor, backgroundColor: match.backgroundColor, borderColor: match.backgroundColor }
    : undefined

  return (
    <Badge variant="outline" size="sm" style={style}>
      {label}
    </Badge>
  )
}
