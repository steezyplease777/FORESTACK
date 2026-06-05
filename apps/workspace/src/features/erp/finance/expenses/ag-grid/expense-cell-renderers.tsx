// @ts-nocheck

import * as React from 'react'
import type { CustomCellRendererProps } from 'ag-grid-react'

import type { ExpenseStatus } from '@/lib/data/erp/expenses/types'
import type { CreditCardCatalogEntry } from '@/lib/data/erp/expenses/types'

import { AmountCell } from '../cells/AmountCell'
import { AttributesCell } from '../cells/AttributesCell'
import { CategoryCell } from '../cells/CategoryCell'
import { DateCell } from '../cells/DateCell'
import { DepartmentCell } from '../cells/DepartmentCell'
import { DirectionCell } from '../cells/DirectionCell'
import { DocumentsCell } from '../cells/DocumentsCell'
import { PaymentTypeCell } from '../cells/PaymentTypeCell'
import { RowActionsCell } from '../cells/RowActionsCell'
import { StatusCell } from '../cells/StatusCell'
import { SubmittedByCell } from '../cells/SubmittedByCell'
import { TagsCell } from '../cells/TagsCell'
import { TitleCell } from '../cells/TitleCell'
import { VendorCell } from '../cells/VendorCell'
import type {
  ExpenseRow,
  ExpenseTableColumnId,
  ExpenseTableConfig,
} from '../ExpenseAdminTable.types'

export type ExpenseAgGridContext = {
  companyId: string
  config: ExpenseTableConfig
  statuses: ExpenseStatus[]
  readOnly?: boolean
  uploadEnabled?: boolean
  signedUrlsByDocId?: Map<string, string>
  creditCardsById?: Map<string, CreditCardCatalogEntry>
  onDropFile?: (expenseId: string, file: File) => void
}

function useGridContext(
  props: CustomCellRendererProps<ExpenseRow>,
): ExpenseAgGridContext {
  return props.context as ExpenseAgGridContext
}

export function ActionsCellRenderer(props: CustomCellRendererProps<ExpenseRow>) {
  const row = props.data
  if (!row) return null
  return <RowActionsCell row={row} />
}

export function createExpenseCellRenderer(columnId: ExpenseTableColumnId) {
  return function ExpenseColumnCellRenderer(
    props: CustomCellRendererProps<ExpenseRow>,
  ) {
    const row = props.data
    if (!row) return null

    const ctx = useGridContext(props)

    switch (columnId) {
      case 'submittedBy':
        return <SubmittedByCell row={row} />
      case 'title':
        return (
          <TitleCell
            row={row}
            companyId={ctx.companyId}
            readOnly={ctx.readOnly}
          />
        )
      case 'status':
        return (
          <StatusCell
            row={row}
            companyId={ctx.companyId}
            statuses={ctx.statuses}
            statusColors={ctx.config.statusColors}
            readOnly={ctx.readOnly}
          />
        )
      case 'amount':
        return (
          <AmountCell
            row={row}
            companyId={ctx.companyId}
            readOnly={ctx.readOnly}
          />
        )
      case 'vendor':
        return (
          <VendorCell
            row={row}
            companyId={ctx.companyId}
            readOnly={ctx.readOnly}
          />
        )
      case 'expenseCategory':
        return (
          <CategoryCell
            row={row}
            companyId={ctx.companyId}
            readOnly={ctx.readOnly}
          />
        )
      case 'department':
        return (
          <DepartmentCell
            row={row}
            companyId={ctx.companyId}
            readOnly={ctx.readOnly}
          />
        )
      case 'relatedProject':
        return (
          <span className="block truncate text-sm text-foreground">
            {row.relatedProject || '—'}
          </span>
        )
      case 'invoiceTags':
        return (
          <TagsCell
            row={row}
            companyId={ctx.companyId}
            readOnly={ctx.readOnly}
          />
        )
      case 'documents':
        return (
          <DocumentsCell
            row={row}
            readOnly={ctx.readOnly}
            uploadEnabled={ctx.uploadEnabled}
            signedUrlsByDocId={ctx.signedUrlsByDocId}
            onDropFile={ctx.onDropFile}
          />
        )
      case 'paymentType':
        return (
          <PaymentTypeCell
            label={row.paymentType}
            colors={ctx.config.paymentTypeColors}
          />
        )
      case 'invoiceDate':
        return <DateCell value={row.invoiceDate} />
      case 'submittedAt':
        return <DateCell value={row.submittedAt} />
      case 'direction':
        return <DirectionCell direction={row.direction} />
      case 'attributes':
        return (
          <AttributesCell
            attributes={row.attributes}
            creditCardsById={ctx.creditCardsById}
          />
        )
      default:
        return <span>—</span>
    }
  }
}
