// @ts-nocheck

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useVendors } from '@/lib/data/erp/vendors/hooks'

import { useExpenseUpdate } from '../data/use-expense-update'
import type { ExpenseRow } from '../ExpenseAdminTable.types'

type VendorCellProps = {
  row: ExpenseRow
  companyId: string
  readOnly?: boolean
}

export function VendorCell({ row, companyId, readOnly }: VendorCellProps) {
  const update = useExpenseUpdate(companyId)
  const vendorsQuery = useVendors(companyId)
  const vendors = vendorsQuery.data ?? []

  const label = row.vendor || '—'

  if (readOnly || vendors.length === 0) {
    return <span className="truncate text-sm">{label}</span>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={update.isPending}>
        <button
          type="button"
          className="max-w-full truncate text-left text-sm hover:underline"
        >
          {row.vendor || 'Set vendor'}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 overflow-auto">
        <DropdownMenuItem
          onClick={() => {
            if (!row.vendorId) return
            update.mutate({ id: row.id, patch: { vendor_id: null } })
          }}
        >
          <span className="text-muted-foreground">Clear</span>
        </DropdownMenuItem>
        {vendors.map((vendor) => (
          <DropdownMenuItem
            key={vendor.id}
            onClick={() => {
              if (vendor.id === row.vendorId) return
              update.mutate({ id: row.id, patch: { vendor_id: vendor.id } })
            }}
          >
            {vendor.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
