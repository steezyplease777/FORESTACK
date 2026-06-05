import type { DataDomainModule, UtilityRequestContext } from "../../shared/types.ts";
import { badRequest } from "../../shared/errors.ts";
import { getTableDefaultDisplayConfig } from "./defaults.ts";
import {
  getTableEditorSchema,
  TABLE_AGGREGATION_OPTIONS,
  TABLE_FILTER_OPERATORS,
} from "./schema.ts";
import { resolveTableViewQuery } from "./view-query.ts";
import { fetchExpenseChartAggregate } from "../../domains/expense/chart-aggregate.ts";
import {
  fetchExpenseDocumentTypes,
  fetchExpenseDocumentsMap,
} from "../../domains/expense/documents-api.ts";
import { requireViewDataId } from "../../shared/validation.ts";

export async function handleTableUtility(
  ctx: UtilityRequestContext,
  domain: DataDomainModule,
) {
  switch (ctx.utility) {
    case "columns":
      return domain.fields.map((f) => ({
        id: f.id,
        label: f.label,
        kind: f.kind,
      }));

    case "filterable-fields":
      return domain.fields.filter((f) => f.filterable);

    case "sortable-fields":
      return domain.fields.filter((f) => f.sortable);

    case "relationship-fields":
      return domain.fields.filter((f) => f.relationship);

    case "aggregation-options":
      return TABLE_AGGREGATION_OPTIONS.filter((opt) => {
        if (opt.id !== "sum") return true;
        return domain.fields.some((f) => f.aggregatable);
      });

    case "filter-values": {
      const fieldId = ctx.searchParams.get("field");
      if (!fieldId) badRequest("field query parameter is required for filter-values utility");
      return domain.fetchDistinctFilterValues(ctx, fieldId);
    }

    case "chart-aggregate": {
      const viewDataId = requireViewDataId(
        ctx.viewDataId ||
          ctx.searchParams.get("viewDataId") ||
          ctx.searchParams.get("viewId") ||
          ctx.searchParams.get("view_id"),
      );
      const groupBy = ctx.searchParams.get("groupBy")?.trim();
      if (!groupBy) badRequest("groupBy query parameter is required for chart-aggregate utility");

      const sumFieldsRaw = ctx.searchParams.get("sumFields")?.trim();
      const sumFields = sumFieldsRaw
        ? sumFieldsRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const viewCtx = { ...ctx, viewDataId, action: "view" as const };
      const { where } = await resolveTableViewQuery(viewCtx, domain);

      if (domain.key !== "expense") {
        badRequest(`chart-aggregate not implemented for domain: ${domain.key}`);
      }

      const rows = await fetchExpenseChartAggregate(viewCtx, {
        where,
        groupField: groupBy,
        sumFields,
      });
      return { rows };
    }

    case "document-types": {
      if (domain.key !== "expense") {
        badRequest(`document-types not implemented for domain: ${domain.key}`);
      }
      const types = await fetchExpenseDocumentTypes(ctx);
      return { types };
    }

    case "documents-map": {
      if (domain.key !== "expense") {
        badRequest(`documents-map not implemented for domain: ${domain.key}`);
      }
      const map = await fetchExpenseDocumentsMap(ctx);
      return { map };
    }

    case "renderer-options":
      return {
        filterOperators: TABLE_FILTER_OPERATORS,
        densityOptions: ["compact", "default", "comfortable"],
      };

    case "defaults":
      return getTableDefaultDisplayConfig(domain);

    default:
      badRequest(`Utility not supported by table module: ${ctx.utility}`);
  }
}
