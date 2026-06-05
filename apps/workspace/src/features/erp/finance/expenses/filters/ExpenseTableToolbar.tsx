// @ts-nocheck

import { useQueries, useQuery } from '@tanstack/react-query'

import { Badge } from '@/components/reui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { erpExpensesListQuery } from '@/lib/data/erp/expenses/queries'
import type { ExpenseStatus } from '@/lib/data/erp/expenses/types'

import type { ActiveFilters } from '../ExpenseAdminTable.types'

type ExpenseTableToolbarProps = {
  companyId: string
  filters: ActiveFilters
  statuses: ExpenseStatus[]
  onStatusChange: (statusId: string | undefined) => void
}

function useExpenseStatusCounts(
  companyId: string,
  statuses: ExpenseStatus[],
  q: string,
) {
  const allQuery = useQuery({
    ...erpExpensesListQuery(companyId, { page: 1, pageSize: 1, q }),
    enabled: !!companyId,
    select: (data) => data.total,
    staleTime: 30_000,
  })

  const statusQueries = useQueries({
    queries: statuses.map((status) => ({
      ...erpExpensesListQuery(companyId, {
        page: 1,
        pageSize: 1,
        q,
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
  onStatusChange,
}: ExpenseTableToolbarProps) {
  const counts = useExpenseStatusCounts(companyId, statuses, filters.q)
  const activeTab = filters.statusId ?? 'all'

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) =>
        onStatusChange(value === 'all' ? undefined : value)
      }
    >
      <TabsList>
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
  )
}
