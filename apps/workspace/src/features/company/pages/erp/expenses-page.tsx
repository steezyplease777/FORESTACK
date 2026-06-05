// @ts-nocheck

import * as React from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { useDebouncedCallback } from '@tanstack/react-pacer'

import { useCompany } from '@/features/company/tenant-provider'
import { PageHeader } from '@/components/composites/page-header'
import { Card } from '@/components/ui/card'

import { ExpenseAdminTable } from '@/features/erp/finance/expenses/ExpenseAdminTable'
import { DEFAULT_EXPENSE_TABLE_CONFIG } from '@/features/erp/finance/expenses/config/default-expense-table.config'

const routeApi = getRouteApi('/$companySlug/_authed/erp/finance/expenses/')

export function ExpensesPage() {
  const { company } = useCompany()
  const companyId = company?.companyId ?? ''

  const {
    q: qFromUrl,
    page,
    pageSize,
    statusId,
    sort,
    dir,
  } = routeApi.useSearch()
  const navigate = routeApi.useNavigate()

  const [searchInput, setSearchInput] = React.useState(qFromUrl)
  React.useEffect(() => {
    setSearchInput((prev) => (prev === qFromUrl ? prev : qFromUrl))
  }, [qFromUrl])

  const commitSearch = useDebouncedCallback(
    (next: string) => {
      navigate({
        search: (prev) => ({ ...prev, q: next, page: 1 }),
        replace: true,
      })
    },
    { wait: 250 },
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Review and manage company expenses."
      />

      <Card className="gap-0 overflow-hidden p-0">
        <ExpenseAdminTable
          companyId={companyId}
          config={DEFAULT_EXPENSE_TABLE_CONFIG}
          filters={{ q: searchInput, statusId }}
          page={page}
          pageSize={pageSize}
          sortColumn={sort}
          sortDirection={dir}
          onFiltersChange={(next) => {
            if (next.q !== undefined) {
              setSearchInput(next.q)
              commitSearch(next.q)
            }
            if (next.statusId !== undefined || 'statusId' in next) {
              navigate({
                search: (prev) => ({
                  ...prev,
                  statusId: next.statusId,
                  page: 1,
                }),
              })
            }
          }}
          onPageChange={(nextPage) =>
            navigate({ search: (prev) => ({ ...prev, page: nextPage }) })
          }
          onSortChange={(sortColumn, sortDirection) =>
            navigate({
              search: (prev) => ({
                ...prev,
                sort: sortColumn,
                dir: sortDirection,
                page: 1,
              }),
            })
          }
        />
      </Card>
    </div>
  )
}
