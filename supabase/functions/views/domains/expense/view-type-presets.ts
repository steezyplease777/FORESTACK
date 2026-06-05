import type { ViewTypePresetDefinition } from "../../shared/types.ts";

/**
 * Hard-coded view type presets for the expense domain.
 * Nav create/editor dropdowns and embed targets are driven from here — not Softr block settings.
 * Fill in Softr page/block UUIDs for your app before shipping.
 */
export const EXPENSE_VIEW_TYPE_PRESETS: ViewTypePresetDefinition[] = [
  {
    key: "invoice-table-supabase",
    label: "TABLE",
    module: "table",
    navSectionParam: "views",
    createEmbedPageId: "9ebc0c28-d78d-44eb-a946-fd642ccd8bfc",
    createEmbedBlockId: "view-table",
    embedPageId: "c424c522-f811-4fb4-ae3e-006e87424111",
    embedBlockId: "view-table",
    previewEmbedPageId: "c424c522-f811-4fb4-ae3e-006e87424111",
    previewEmbedBlockId: "preview-view-table",
    zoom: "z100",
  },
  {
    key: "invoice-grouped-supabase",
    label: "GROUPED",
    module: "grouped",
    navSectionParam: "views",
    createEmbedPageId: "9ebc0c28-d78d-44eb-a946-fd642ccd8bfc",
    createEmbedBlockId: "grouped-view",
    embedPageId: "c424c522-f811-4fb4-ae3e-006e87424111",
    embedBlockId: "grouped-view",
    previewEmbedPageId: "c424c522-f811-4fb4-ae3e-006e87424111",
    previewEmbedBlockId: "grouped-view-preview",
    zoom: "z100",
  },
];
