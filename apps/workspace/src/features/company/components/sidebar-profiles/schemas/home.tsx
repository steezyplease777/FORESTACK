// @ts-nocheck

import { schemaFromModule } from "@/config/schema-from-module";

import type { PortalSidebarSchema } from "../schema";

/** Sidebar schema for the Home portal (dashboard / team / tasks / inbox). */
export const homeSchema: PortalSidebarSchema = schemaFromModule("home");
