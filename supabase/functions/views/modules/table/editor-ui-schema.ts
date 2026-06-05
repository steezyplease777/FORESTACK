import type { DataDomainModule } from "../../shared/types.ts";
import { TABLE_FILTER_OPERATORS } from "./schema.ts";

export type EditorUiFieldType =
  | "text"
  | "longText"
  | "boolean"
  | "enum"
  | "fieldPicker"
  | "component";

export type EditorUiFieldSchema = {
  key: string;
  type: EditorUiFieldType;
  label: string;
  description?: string;
  /** Dot-path binding target, e.g. view.name or display_config.showHeader */
  bind: string;
  default?: unknown;
  options?: Array<{ value: string; label: string }>;
  /** For type=component — registered editor widget id */
  component?: string;
  disabled?: boolean;
};

export type EditorUiSectionSchema = {
  id: string;
  title?: string;
  description?: string;
  fields?: EditorUiFieldSchema[];
  component?: string;
};

export type EditorUiTabSchema = {
  id: string;
  label: string;
  icon?: string;
  badgeKey?: "columns" | "filters";
  sections?: EditorUiSectionSchema[];
  /** Whole-tab custom component (columns, filters, access) */
  component?: string;
};

export type EditorUiSchema = {
  version: number;
  renderer: "table" | "grouped";
  tabs: EditorUiTabSchema[];
  fieldCatalog: Array<{
    id: string;
    label: string;
    kind: string;
    filterable: boolean;
    sortable: boolean;
    groupable?: boolean;
  }>;
  /** Groupable field ids for grouped renderer field pickers. */
  groupableFieldIds?: string[];
  filterOperators: string[];
  openButtonFieldIds: string[];
};

const VIEW_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PRIVATE", label: "Private" },
  { value: "PUBLIC", label: "Public" },
];

const BORDER_OPTIONS = [
  { value: "enabled", label: "Enabled" },
  { value: "disabled", label: "Disabled" },
];

export function getTableEditorUiSchema(
  domain: DataDomainModule,
): EditorUiSchema {
  const openButtonFieldIds = domain.fields
    .filter((f) => f.kind !== "documents")
    .map((f) => f.id);

  return {
    version: 1,
    renderer: "table",
    tabs: [
      {
        id: "style",
        label: "Style",
        icon: "palette",
        sections: [
          {
            id: "general",
            title: "General",
            fields: [
              {
                key: "name",
                type: "text",
                label: "Title",
                bind: "view.name",
              },
              {
                key: "description",
                type: "longText",
                label: "Description",
                bind: "view.description",
              },
              {
                key: "status",
                type: "enum",
                label: "Visibility",
                bind: "view.status",
                options: VIEW_STATUS_OPTIONS,
              },
            ],
          },
          {
            id: "display",
            title: "Display",
            fields: [
              {
                key: "showHeader",
                type: "boolean",
                label: "Show header",
                bind: "display_config.showHeader",
                default: true,
              },
              {
                key: "enableSearch",
                type: "boolean",
                label: "Enable search",
                bind: "display_config.enableSearch",
                default: true,
              },
              {
                key: "enableFilters",
                type: "boolean",
                label: "Enable filters",
                bind: "display_config.enableFilters",
                default: true,
              },
              {
                key: "enableCsvExport",
                type: "boolean",
                label: "Enable CSV export",
                bind: "display_config.enableCsvExport",
                default: true,
              },
              {
                key: "enableColumnsPicker",
                type: "boolean",
                label: "Enable columns picker",
                bind: "display_config.enableColumnsPicker",
                default: false,
              },
            ],
          },
          {
            id: "openButton",
            title: "Open button",
            fields: [
              {
                key: "openButtonFieldId",
                type: "fieldPicker",
                label: "Open button column",
                bind: "display_config.openButtonFieldId",
                default: "title",
                description:
                  "Choose which column shows the row Open button. If that column is hidden, the button moves to the nearest visible column toward the left.",
              },
            ],
          },
          {
            id: "borders",
            title: "Table borders",
            fields: [
              {
                key: "tableRowBorders",
                type: "enum",
                label: "Row borders",
                bind: "display_config.tableRowBorders",
                default: "enabled",
                options: BORDER_OPTIONS,
              },
              {
                key: "tableColumnBorders",
                type: "enum",
                label: "Column borders",
                bind: "display_config.tableColumnBorders",
                default: "disabled",
                options: BORDER_OPTIONS,
              },
            ],
          },
        ],
      },
      {
        id: "columns",
        label: "Columns",
        icon: "columns",
        badgeKey: "columns",
        component: "columnEditor",
      },
      {
        id: "filter",
        label: "Filters",
        icon: "filter",
        badgeKey: "filters",
        component: "filterEditor",
      },
      {
        id: "access",
        label: "Access",
        icon: "shield",
        component: "accessPanel",
      },
    ],
    fieldCatalog: domain.fields.map((f) => ({
      id: f.id,
      label: f.label,
      kind: f.kind,
      filterable: f.filterable,
      sortable: f.sortable,
    })),
    filterOperators: TABLE_FILTER_OPERATORS,
    openButtonFieldIds,
  };
}
