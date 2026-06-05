// @ts-nocheck

import { Link } from '@tanstack/react-router'
import { IconDotsVertical, IconFileInvoice } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/reui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { PurchaseOrderWithVendor } from '@/lib/data/erp/purchase-orders/types'

const STATUS_BADGE_VARIANT = {
  draft: 'outline',
  submitted: 'info-light',
  closed: 'success-light',
} as const

function destinationChannels(po: PurchaseOrderWithVendor): string {
  const channels = new Set<string>()
  if (po.lines) {
    for (const line of po.lines) {
      if (line.allocations) {
        for (const a of line.allocations) {
          const ch = a.sales_channel as Record<string, unknown> | null
          if (ch?.name) channels.add(ch.name as string)
        }
      }
    }
  }
  return channels.size > 0 ? Array.from(channels).join(', ') : '—'
}

function totalUnits(po: PurchaseOrderWithVendor): number {
  return (
    po.lines?.reduce(
      (s, l) => s + ((l.total_quantity as number) ?? 0),
      0,
    ) ?? 0
  )
}

export function PurchaseOrdersTable({
  orders,
  companySlug,
}: {
  orders: PurchaseOrderWithVendor[]
  companySlug: string
}) {
  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[24%]">Order</TableHead>
          <TableHead className="w-[14%]">Supplier</TableHead>
          <TableHead className="w-[8%] text-right">Units</TableHead>
          <TableHead className="w-[14%]">Destinations</TableHead>
          <TableHead className="w-[10%]">Delivery</TableHead>
          <TableHead className="w-[10%]">Created</TableHead>
          <TableHead className="w-[10%] text-right">Total cost</TableHead>
          <TableHead className="w-[8%]">Status</TableHead>
          <TableHead className="w-[2%] sr-only">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((po) => {
          const statusValue = (po.status ?? 'draft') as keyof typeof STATUS_BADGE_VARIANT
          const vendor = po.vendor as Record<string, unknown> | null

          return (
            <TableRow key={po.id} className="group h-16">
              <TableCell>
                <Link
                  to={`/${companySlug}/erp/purchase-orders/${po.id}`}
                  className="flex items-center gap-3"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-md border bg-gradient-to-br from-muted to-muted/40 text-muted-foreground">
                    <IconFileInvoice className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium leading-tight group-hover:underline">
                      {po.purchase_order_number}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                      {po.internal_code}
                    </div>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <span className="truncate text-sm">
                  {(vendor?.name as string) ?? '—'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-sm tabular-nums">
                  {totalUnits(po).toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <span className="block truncate text-xs text-muted-foreground">
                  {destinationChannels(po)}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {new Date(po.purchase_order_date).toLocaleDateString()}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {new Date(po.created_at).toLocaleDateString()}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-sm font-semibold tabular-nums">
                  ${Number(po.total_amount).toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <Badge
                  variant={STATUS_BADGE_VARIANT[statusValue] ?? 'outline'}
                  size="sm"
                >
                  {statusValue}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Actions for ${po.purchase_order_number}`}
                  className="size-7 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                >
                  <IconDotsVertical className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
