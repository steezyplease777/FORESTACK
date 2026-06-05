import type { DataDomainModule } from "../shared/types.ts";

/** Placeholder domain — implement when product tables are wired. */
export const productsDomain: DataDomainModule = {
  key: "products",
  slug: "products",
  label: "Products",
  dbDomainValue: "products",
  primaryTable: "erp_products",
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

export default productsDomain;
