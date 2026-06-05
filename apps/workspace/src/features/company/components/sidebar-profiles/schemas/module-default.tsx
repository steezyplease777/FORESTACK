// @ts-nocheck

import { schemaFromModule } from "@/config/schema-from-module";

import type { PortalSidebarSchema, PortalSlug } from "../schema";

/**
 * @deprecated Use `schemaFromModule` from `@/config/schema-from-module`.
 */
export function createModuleDefaultSchema(
  moduleSlug: PortalSlug,
): PortalSidebarSchema {
  return schemaFromModule(moduleSlug);
}
