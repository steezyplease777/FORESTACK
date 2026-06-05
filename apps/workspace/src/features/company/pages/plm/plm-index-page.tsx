// @ts-nocheck
import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  IconBoxMultiple,
  IconChevronRight,
  IconCube,
  IconLayoutGrid,
  IconPlus,
  IconTag,
  IconTrendingUp,
  IconTruckDelivery,
} from "@tabler/icons-react";

import { useCompany } from "@/features/company/tenant-provider";
import { usePlmProducts } from "@/lib/data/plm/products/hooks";
import { usePlmVariants } from "@/lib/data/plm/variants/hooks";
import { usePlmSourcing } from "@/lib/data/plm/sourcing/hooks";
import { usePlmStyles } from "@/lib/data/plm/styles/hooks";
import { PageHeader } from "@/components/composites/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { ProductListRow } from "@/lib/data/plm/products/client";

/**
 * PLM module overview.
 *
 * Lands on `/plm` and mirrors the shape of the PM/WMS dashboards:
 * a header, a stat grid driven by the paginated list endpoints
 * (first page is enough for count + a "recent items" feed), and
 * a deep-link column. We deliberately pull counts off the
 * `usePlm*` paginated hooks (`{ rows, total }`) instead of
 * introducing a new RPC — the list endpoints are already warm
 * from loader prefetches so the overview gets totals for free.
 */
export function PlmOverviewPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const basePath = `/${companySlug}`;

  const productsQuery = usePlmProducts(companyId, { page: 1, pageSize: 10 });
  const variantsQuery = usePlmVariants(companyId, { page: 1, pageSize: 1 });
  const sourcingQuery = usePlmSourcing(companyId, { page: 1, pageSize: 1 });
  const stylesQuery = usePlmStyles(companyId);

  const metrics = React.useMemo(
    () => ({
      productCount: productsQuery.data?.total ?? 0,
      variantCount: variantsQuery.data?.total ?? 0,
      sourcingCount: sourcingQuery.data?.total ?? 0,
      styleCount: stylesQuery.data?.length ?? 0,
    }),
    [
      productsQuery.data?.total,
      variantsQuery.data?.total,
      sourcingQuery.data?.total,
      stylesQuery.data?.length,
    ],
  );

  const recentProducts = React.useMemo(() => {
    const rows = productsQuery.data?.rows ?? [];
    return [...rows]
      .sort((a, b) => {
        const at = a.created_at ? Date.parse(a.created_at) : 0;
        const bt = b.created_at ? Date.parse(b.created_at) : 0;
        if (at !== bt) return bt - at;
        return String(b.id).localeCompare(String(a.id));
      })
      .slice(0, 6);
  }, [productsQuery.data?.rows]);

  const isLoading =
    productsQuery.isLoading ||
    variantsQuery.isLoading ||
    sourcingQuery.isLoading ||
    stylesQuery.isLoading;

  const newProductHref = `${basePath}/plm/products/new`;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <PageHeader
        title="Product Lifecycle"
        description="Styles, products, variants, and sourcing — your catalog at a glance."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to={`${basePath}/plm/products`}>
                <IconCube className="size-4" />
                View Products
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to={newProductHref}>
                <IconPlus className="size-4" />
                New Product
              </Link>
            </Button>
          </>
        }
      />

      <StatGrid metrics={metrics} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <RecentProductsSection
          products={recentProducts}
          totalCount={metrics.productCount}
          isLoading={productsQuery.isLoading}
          error={productsQuery.error}
          basePath={basePath}
          newProductHref={newProductHref}
        />
        <QuickLinksColumn basePath={basePath} />
      </div>
    </div>
  );
}

type StatCardDef = {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
};

function StatGrid({
  metrics,
  isLoading,
}: {
  metrics: {
    productCount: number;
    variantCount: number;
    sourcingCount: number;
    styleCount: number;
  };
  isLoading: boolean;
}) {
  const cards: StatCardDef[] = [
    {
      label: "Products",
      value: metrics.productCount.toLocaleString(),
      hint: "Finished goods tracked in the catalog",
      icon: <IconCube className="size-4" />,
    },
    {
      label: "Variants",
      value: metrics.variantCount.toLocaleString(),
      hint: "SKU-level size / color variants",
      icon: <IconBoxMultiple className="size-4" />,
    },
    {
      label: "Sourcing",
      value: metrics.sourcingCount.toLocaleString(),
      hint: "Vendor cost records across styles",
      icon: <IconTruckDelivery className="size-4" />,
    },
    {
      label: "Styles",
      value: metrics.styleCount.toLocaleString(),
      hint: "Design records shared across products",
      icon: <IconTag className="size-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-md border bg-card p-4 transition-colors hover:border-primary/20"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {card.label}
            </p>
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary ring-1 ring-primary/10">
              {card.icon}
            </div>
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
            {isLoading ? (
              <span className="inline-block h-8 w-16 animate-pulse rounded-md bg-muted" />
            ) : (
              card.value
            )}
          </div>
          <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">
            {card.hint}
          </p>
        </div>
      ))}
    </div>
  );
}

function RecentProductsSection({
  products,
  totalCount,
  isLoading,
  error,
  basePath,
  newProductHref,
}: {
  products: ProductListRow[];
  totalCount: number;
  isLoading: boolean;
  error: unknown;
  basePath: string;
  newProductHref: string;
}) {
  return (
    <section className="lg:col-span-2">
      <header className="mb-3 flex items-start justify-between gap-3 border-b pb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Recent products</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            The latest finished goods added to this company.
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <Link to={`${basePath}/plm/products`}>
            View all
            <IconChevronRight className="size-4" />
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <RecentSkeleton />
      ) : error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">
            Couldn't load products
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-8 text-center">
          <IconCube className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">No products yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your first product to build out the catalog.
          </p>
          <Button size="sm" variant="outline" className="mt-4" asChild>
            <Link to={newProductHref}>
              <IconPlus className="size-4" />
              New product
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Style</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead className="text-right">MSRP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const variantCount = Array.isArray(p.variants)
                  ? p.variants.length
                  : 0;
                const msrp = p.msrp != null ? Number(p.msrp) : null;
                return (
                  <TableRow key={p.id} className="h-14">
                    <TableCell>
                      <Link
                        to={`${basePath}/plm/products/${p.id}`}
                        className="flex items-center gap-3"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-muted to-muted/60 text-muted-foreground">
                          <IconCube className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium hover:underline">
                            {p.name}
                          </div>
                          {p.internal_product_code ? (
                            <div className="font-mono text-xs text-muted-foreground">
                              {p.internal_product_code}
                            </div>
                          ) : null}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {p.style?.style_number ? (
                        <Badge variant="secondary" className="font-mono">
                          {p.style.style_number}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {variantCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5">
                          <IconBoxMultiple className="size-3.5" />
                          {variantCount}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {msrp != null ? (
                        <span className="font-medium">
                          ${msrp.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && products.length > 0 && totalCount > products.length ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing {products.length} of {totalCount}
        </p>
      ) : null}
    </section>
  );
}

function RecentSkeleton() {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-md border bg-muted/40 p-3"
        >
          <div className="size-9 animate-pulse rounded bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

type QuickLink = {
  title: string;
  description: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

function QuickLinksColumn({ basePath }: { basePath: string }) {
  const quickLinks: QuickLink[] = [
    {
      title: "Products",
      description: "Finished goods catalog",
      url: `${basePath}/plm/products`,
      icon: IconCube,
    },
    {
      title: "Variants",
      description: "SKU-level size / color records",
      url: `${basePath}/plm/variants`,
      icon: IconBoxMultiple,
    },
    {
      title: "Sourcing",
      description: "Vendor costs per style",
      url: `${basePath}/plm/sourcing`,
      icon: IconTruckDelivery,
    },
  ];

  return (
    <section>
      <header className="mb-3 border-b pb-2">
        <h3 className="text-sm font-semibold">Jump to</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Deep views inside the PLM module.
        </p>
      </header>
      <div className="flex flex-col gap-2">
        {quickLinks.map((link, idx) => {
          const Icon = link.icon;
          return (
            <React.Fragment key={link.url}>
              {idx > 0 ? <Separator /> : null}
              <Link
                to={link.url}
                className="group -mx-3 flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-accent"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/5 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{link.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {link.description}
                  </div>
                </div>
                <IconChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </React.Fragment>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
        <IconTrendingUp className="size-4" />
        Categories and style tools coming online next.
      </div>
    </section>
  );
}
