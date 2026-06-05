import type { DataDomainModule } from "../../shared/types.ts";
import { getTableEditorSchema } from "../table/schema.ts";

export function getGroupedEditorSchema(domain: DataDomainModule) {
  const tableSchema = getTableEditorSchema(domain);
  return {
    ...tableSchema,
    renderer: "grouped",
    properties: {
      ...tableSchema.properties,
      defaultGroupBy: {
        type: "string",
        description: "Primary field to group rows by (must be groupable)",
      },
      groupHeaderColors: {
        type: "array",
        description:
          "Header band colors keyed by group field value (value, textColor, backgroundColor)",
        items: {
          type: "object",
          properties: {
            value: { type: "string" },
            textColor: { type: "string" },
            backgroundColor: { type: "string" },
          },
        },
      },
      enableGrouping: {
        type: "boolean",
        default: true,
        description: "Grouped views always group; kept for editor parity",
      },
    },
  };
}
