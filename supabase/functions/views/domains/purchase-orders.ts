import type { DataDomainModule } from "../shared/types.ts";

/** Placeholder domain — implement when PO tables are wired. */
export const purchaseOrdersDomain: DataDomainModule = {
  key: "purchase_orders",
  slug: "purchase-orders",
  label: "Purchase Orders",
  dbDomainValue: "purchase_orders",
  primaryTable: "erp_purchase_orders",
  fields: [],
  fieldMap: {},
  filterFieldAliases: {},
  buildSelect: () => "id",
  buildWhereFromRules: () => undefined,
  async fetchRecords() {
    return { rows: [], totalCount: 0 };
  },
  mapRow: (raw) => raw,
  async loadCatalogs() {
    return { tagsById: new Map() };
  },
  async fetchDistinctFilterValues() {
    return [];
  },
  viewTypePresets: [],
};

export default purchaseOrdersDomain;
