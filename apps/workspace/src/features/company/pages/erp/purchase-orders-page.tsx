// @ts-nocheck

import * as React from 'react'
import { Link, getRouteApi } from '@tanstack/react-router'
import { useDebouncedCallback } from '@tanstack/react-pacer'
import { IconPlus, IconSearch } from '@tabler/icons-react'

import { useCompany } from '@/features/company/tenant-provider'
import { usePurchaseOrders } from '@/lib/data/erp/purchase-orders/hooks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/reui/badge'
import { Input } from '@/components/ui/input'
import { PurchaseOrdersTable } from '@/features/company/modules/erp/purchase-orders/purchase-orders-table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/composites/page-header'
import { EmptyState } from '@/components/composites/empty-state'
import { cn } from '@/lib/utils'

const routeApi = getRouteApi('/$companySlug/_authed/erp/purchase-orders/')

export function PurchaseOrdersPage() {
  const { company, companySlug } = useCompany()
  const companyId = company?.companyId ?? ''
  const { data: orders, isLoading, error } = usePurchaseOrders(companyId)
  const { q: qFromUrl, status: statusFilter } = routeApi.useSearch()
  const navigate = routeApi.useNavigate()

  const [searchInput, setSearchInput] = React.useState(qFromUrl)
  React.useEffect(() => {
    setSearchInput((prev) => (prev === qFromUrl ? prev : qFromUrl))
  }, [qFromUrl])

  const commitSearch = useDebouncedCallback(
    (next: string) => {
      navigate({
        search: (prev) => ({ ...prev, q: next }),
        replace: true,
      })
    },
    { wait: 250 },
  )

  const setStatusFilter = (status: 'all' | 'draft' | 'submitted' | 'closed') =>
    navigate({ search: (prev) => ({ ...prev, status }) })

  const filtered = React.useMemo(() => {
    if (!orders) return []
    let result = orders
    if (statusFilter !== 'all') {
      result = result.filter((po) => (po.status ?? 'draft') === statusFilter)
    }
    if (qFromUrl) {
      const q = qFromUrl.toLowerCase()
      result = result.filter(
        (po) =>
          po.purchase_order_number.toLowerCase().includes(q) ||
          po.internal_code.toLowerCase().includes(q) ||
          ((po.vendor as Record<string, unknown>)?.name as string ?? '')
            .toLowerCase()
            .includes(q),
      )
    }
    return result
  }, [orders, qFromUrl, statusFilter])

  const counts = React.useMemo(() => {
    if (!orders) return { all: 0, draft: 0, submitted: 0, closed: 0 }
    return {
      all: orders.length,
      draft: orders.filter((o) => (o.status ?? 'draft') === 'draft').length,
      submitted: orders.filter((o) => o.status === 'submitted').length,
      closed: orders.filter((o) => o.status === 'closed').length,
    }
  }, [orders])

  const total = orders?.length ?? 0

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <PageHeader
        title="Purchase Orders"
        description={
          total > 0
            ? `${total.toLocaleString()} total — manage and track your purchase orders.`
            : 'Manage and track your purchase orders.'
        }
        actions={
          <Button size="sm" asChild>
            <Link to={`/${companySlug}/erp/purchase-orders/new`}>
              <IconPlus className="size-4" />
              Create draft order
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3">
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <TabsList>
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" size="xs" className="ml-1.5">
                {counts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="draft">
              Draft
              <Badge variant="outline" size="xs" className="ml-1.5">
                {counts.draft}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="submitted">
              Submitted
              <Badge variant="info-light" size="xs" className="ml-1.5">
                {counts.submitted}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="closed">
              Closed
              <Badge variant="success-light" size="xs" className="ml-1.5">
                {counts.closed}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {filtered.length > 0 ? (
              <>
                Showing{' '}
                <span className="tabular-nums">
                  {filtered.length.toLocaleString()}
                </span>{' '}
                {filtered.length === 1 ? 'order' : 'orders'}
                {qFromUrl ? ` · filtered by "${qFromUrl}"` : ''}
                {statusFilter !== 'all' ? ` · ${statusFilter}` : ''}
              </>
            ) : (
              'No results'
            )}
          </p>
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 w-64 pl-8"
              placeholder="Search orders…"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                commitSearch(e.target.value)
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              Couldn't load purchase orders
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No purchase orders"
            description={
              orders?.length
                ? 'No orders match your filters.'
                : 'No purchase orders yet.'
            }
            actionLabel={!orders?.length ? 'Create draft order' : undefined}
            onAction={
              !orders?.length
                ? () =>
                    navigate({ to: `/${companySlug}/erp/purchase-orders/new` })
                : undefined
            }
          />
        ) : (
          <div className="overflow-hidden rounded-md border">
            <PurchaseOrdersTable orders={filtered} companySlug={companySlug} />
          </div>
        )}
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-4 rounded-md border bg-muted/40 p-3',
          )}
        >
          <div className="size-10 animate-pulse rounded bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
