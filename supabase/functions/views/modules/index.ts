import type { ViewTypeKey, ViewTypeModule } from "../shared/types.ts";
import { tableModule } from "./table/index.ts";
import { groupedModule } from "./grouped/index.ts";

const MODULE_REGISTRY: Partial<Record<ViewTypeKey, ViewTypeModule>> = {
  table: tableModule,
  grouped: groupedModule,
};

export function getViewModule(viewType: ViewTypeKey): ViewTypeModule | null {
  return MODULE_REGISTRY[viewType] ?? null;
}

export function listViewModules(): ViewTypeKey[] {
  return Object.keys(MODULE_REGISTRY) as ViewTypeKey[];
}

export { tableModule, groupedModule };

export default MODULE_REGISTRY;
