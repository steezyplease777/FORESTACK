import type {
  DataDomainKey,
  UtilityName,
  ViewAction,
  ViewTypeKey,
} from "./types.ts";
import { badRequest, notFound } from "./errors.ts";
import { getDomainBySlug } from "../domains/index.ts";
import { getViewModule } from "../modules/index.ts";

const VIEW_ACTIONS = new Set<ViewAction>([
  "view",
  "edit",
  "create",
  "list",
  "update",
  "delete",
]);
const VIEW_TYPES = new Set<ViewTypeKey>(["table", "grouped", "pivot", "kanban", "calendar"]);
const UTILITIES = new Set<UtilityName>([
  "columns",
  "filterable-fields",
  "sortable-fields",
  "relationship-fields",
  "aggregation-options",
  "filter-values",
  "chart-aggregate",
  "document-types",
  "documents-map",
  "renderer-options",
  "defaults",
]);

export function parsePositiveInt(
  value: string | null,
  fallback: number,
  max?: number,
): number {
  const n = value == null ? fallback : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  const rounded = Math.floor(n);
  if (max != null && rounded > max) return max;
  return rounded;
}

export function resolveDomainSlug(dataDomainId: string) {
  const domain = getDomainBySlug(dataDomainId);
  if (!domain) {
    notFound(`Unknown data domain: ${dataDomainId}`);
  }
  return domain;
}

export function resolveViewType(viewType: string): ViewTypeKey {
  if (!VIEW_TYPES.has(viewType as ViewTypeKey)) {
    badRequest(`Unknown view type: ${viewType}`);
  }
  const module = getViewModule(viewType as ViewTypeKey);
  if (!module) {
    notFound(`View type module not implemented: ${viewType}`);
  }
  return viewType as ViewTypeKey;
}

export function resolveAction(action: string): ViewAction {
  if (!VIEW_ACTIONS.has(action as ViewAction)) {
    badRequest(
      `Unknown action: ${action}. Expected view, edit, create, list, update, or delete.`,
    );
  }
  return action as ViewAction;
}

export function requireViewDataId(viewDataId: string | null | undefined): string {
  const id = String(viewDataId ?? "").trim();
  if (!id) {
    badRequest("viewDataId path parameter is required for this action");
  }
  return id;
}

export function resolveUtility(utility: string): UtilityName {
  if (!UTILITIES.has(utility as UtilityName)) {
    badRequest(`Unknown utility: ${utility}`);
  }
  return utility as UtilityName;
}

export function assertViewDomainMatch(
  viewDomain: string,
  domainKey: DataDomainKey,
  dbDomainValue: string,
) {
  const normalized = String(viewDomain || "").toLowerCase();
  const allowed = new Set([
    domainKey,
    dbDomainValue,
    "expense",
    "invoices",
    "expenses",
  ]);
  if (!allowed.has(normalized)) {
    badRequest(
      `View domain "${viewDomain}" does not match requested domain "${domainKey}"`,
    );
  }
}

export function viewTypeMatchesRecord(
  viewType: ViewTypeKey,
  viewTypeKey: string,
  displayConfig: Record<string, unknown> | null | undefined,
): boolean {
  const renderer = String(displayConfig?.renderer ?? "").toLowerCase();
  if (renderer && renderer === viewType) return true;
  const key = String(viewTypeKey || "").toLowerCase();
  if (key.includes(viewType)) return true;
  if (viewType === "table" && (key.includes("invoice") || key.includes("expense"))) {
    return true;
  }
  if (viewType === "grouped" && (key.includes("group") || renderer === "grouped")) {
    return true;
  }
  return false;
}
