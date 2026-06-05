// @ts-nocheck

import * as React from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { useDebouncedCallback } from '@tanstack/react-pacer'

import { useCompany } from '@/features/company/tenant-provider'
import { PageHeader } from '@/components/composites/page-header'
import { Card } from '@/components/ui/card'

import { ExpenseAdminTable } from '@/features/erp/finance/expenses/ExpenseAdminTable'
import { DEFAULT_EXPENSE_TABLE_CONFIG } from '@/features/erp/finance/expenses/config/default-expense-table.config'
import { ExpenseTableToolbar } from '@/features/erp/finance/expenses/filters/ExpenseTableToolbar'
import { useExpenseStatuses } from '@/features/erp/finance/expenses/data/use-expenses-query'

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

  const statusesQuery = useExpenseStatuses(companyId)
  const statuses = statusesQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Review and manage company expenses."
      />

      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <ExpenseTableToolbar
            companyId={companyId}
            filters={{ q: searchInput, statusId }}
            statuses={statuses}
            onSearchChange={(q) => {
              setSearchInput(q)
              commitSearch(q)
            }}
            onStatusChange={(nextStatusId) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  statusId: nextStatusId,
                  page: 1,
                }),
              })
            }
          />
        </div>

        <ExpenseAdminTable
          companyId={companyId}
          config={DEFAULT_EXPENSE_TABLE_CONFIG}
          filters={{ q: searchInput, statusId }}
          page={page}
          pageSize={pageSize}
          sortColumn={sort}
          sortDirection={dir}
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
