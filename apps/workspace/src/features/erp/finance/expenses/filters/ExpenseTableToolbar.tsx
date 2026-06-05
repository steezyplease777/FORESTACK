// @ts-nocheck

import { useQueries, useQuery } from '@tanstack/react-query'

import { Badge } from '@/components/reui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { erpExpensesListQuery } from '@/lib/data/erp/expenses/queries'
import type { ExpenseStatus } from '@/lib/data/erp/expenses/types'

import { buildExpenseQueryParams } from '../data/query-builder'
import type { ActiveFilters } from '../ExpenseAdminTable.types'
import { ExpenseStructuredFilters } from './ExpenseStructuredFilters'

type ExpenseTableToolbarProps = {
  companyId: string
  filters: ActiveFilters
  statuses: ExpenseStatus[]
  sortColumn: 'created_at' | 'title' | 'amount'
  sortDirection: 'asc' | 'desc'
  onStatusChange: (statusId: string | undefined) => void
  onFiltersChange: (filters: ActiveFilters) => void
  onClearStructuredFilters: () => void
}

function useExpenseStatusCounts(
  companyId: string,
  statuses: ExpenseStatus[],
  filters: ActiveFilters,
  sortColumn: ExpenseTableToolbarProps['sortColumn'],
  sortDirection: ExpenseTableToolbarProps['sortDirection'],
) {
  const baseParams = buildExpenseQueryParams(filters, sortColumn, sortDirection)

  const allQuery = useQuery({
    ...erpExpensesListQuery(companyId, { page: 1, pageSize: 1, ...baseParams, statusId: undefined }),
    enabled: !!companyId,
    select: (data) => data.total,
    staleTime: 30_000,
  })

  const statusQueries = useQueries({
    queries: statuses.map((status) => ({
      ...erpExpensesListQuery(companyId, {
        page: 1,
        pageSize: 1,
        ...baseParams,
        statusId: status.id,
      }),
      enabled: !!companyId,
      select: (data: { total: number }) => data.total,
      staleTime: 30_000,
    })),
  })

  const byStatus: Record<string, number> = {}
  statuses.forEach((status, index) => {
    byStatus[status.id] = statusQueries[index]?.data ?? 0
  })

  return {
    all: allQuery.data ?? 0,
    byStatus,
  }
}

export function ExpenseTableToolbar({
  companyId,
  filters,
  statuses,
  sortColumn,
  sortDirection,
  onStatusChange,
  onFiltersChange,
  onClearStructuredFilters,
}: ExpenseTableToolbarProps) {
  const counts = useExpenseStatusCounts(
    companyId,
    statuses,
    filters,
    sortColumn,
    sortDirection,
  )
  const activeTab = filters.statusId ?? 'all'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          onStatusChange(value === 'all' ? undefined : value)
        }
        className="min-w-0 flex-1"
      >
        <TabsList className="h-auto max-w-full flex-wrap">
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" size="xs" className="ml-1.5">
              {counts.all}
            </Badge>
          </TabsTrigger>
          {statuses.map((status) => (
            <TabsTrigger key={status.id} value={status.id}>
              {status.name}
              <Badge variant="outline" size="xs" className="ml-1.5">
                {counts.byStatus[status.id] ?? 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <ExpenseStructuredFilters
        companyId={companyId}
        filters={filters}
        onChange={onFiltersChange}
        onClear={onClearStructuredFilters}
      />
    </div>
  )
}
