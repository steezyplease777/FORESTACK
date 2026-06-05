import type { DataDomainModule } from "../../shared/types.ts";
import {
  getTableEditorUiSchema,
  type EditorUiSchema,
} from "../table/editor-ui-schema.ts";

export function getGroupedEditorUiSchema(
  domain: DataDomainModule,
): EditorUiSchema {
  const tableUi = getTableEditorUiSchema(domain);
  const groupableFields = domain.fields.filter((f) => f.groupable);

  const styleTab = tableUi.tabs.find((t) => t.id === "style");
  const otherTabs = tableUi.tabs.filter((t) => t.id !== "style");

  const groupedStyleTab = styleTab
    ? {
        ...styleTab,
        sections: [
          ...(styleTab.sections ?? []).filter(
            (s) => s.id !== "grouping" && s.id !== "groupHeaderColors",
          ),
          {
            id: "grouping",
            title: "Grouping",
            description:
              "Grouped views always show sections by this field. End users cannot change grouping in the block.",
            fields: [
              {
                key: "defaultGroupBy",
                type: "fieldPicker" as const,
                label: "Group by field",
                bind: "display_config.defaultGroupBy",
                default: "status",
                description: "Which field defines each section header",
              },
            ],
          },
          {
            id: "groupHeaderColors",
            title: "Group header colors",
            description:
              "Match group field values to header band colors (case-sensitive)",
            component: "groupHeaderColorsEditor",
          },
        ],
      }
    : undefined;

  return {
    ...tableUi,
    renderer: "grouped" as EditorUiSchema["renderer"],
    tabs: [
      ...(groupedStyleTab ? [groupedStyleTab] : []),
      ...otherTabs,
    ],
    fieldCatalog: domain.fields.map((f) => ({
      id: f.id,
      label: f.label,
      kind: f.kind,
      filterable: f.filterable,
      sortable: f.sortable,
      groupable: f.groupable,
    })),
    groupableFieldIds: groupableFields.map((f) => f.id),
    openButtonFieldIds: tableUi.openButtonFieldIds,
  };
}
