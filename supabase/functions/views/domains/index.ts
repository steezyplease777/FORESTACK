import type { DataDomainModule } from "../shared/types.ts";
import { expenseDomain } from "./expense/index.ts";
import { productsDomain } from "./products.ts";
import { purchaseOrdersDomain } from "./purchase-orders.ts";

const SLUG_REGISTRY: Record<string, DataDomainModule> = {
  expense: expenseDomain,
  /** @deprecated use `expense` */
  expenses: expenseDomain,
  /** @deprecated use `expense` — invoice UI label, same data model */
  invoices: expenseDomain,
  products: productsDomain,
  "purchase-orders": purchaseOrdersDomain,
  purchase_orders: purchaseOrdersDomain,
};

export function getDomainBySlug(slug: string): DataDomainModule | null {
  const key = String(slug || "").trim().toLowerCase();
  return SLUG_REGISTRY[key] ?? null;
}

export function listDomains(): Array<{ slug: string; key: string; label: string }> {
  const seen = new Set<string>();
  const out: Array<{ slug: string; key: string; label: string }> = [];
  for (const domain of Object.values(SLUG_REGISTRY)) {
    if (seen.has(domain.key)) continue;
    seen.add(domain.key);
    out.push({ slug: domain.slug, key: domain.key, label: domain.label });
  }
  return out;
}

export const domains = SLUG_REGISTRY;

export default SLUG_REGISTRY;
