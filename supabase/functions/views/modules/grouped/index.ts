import type { ViewTypeModule } from "../../shared/types.ts";
import { getGroupedDefaultDisplayConfig } from "./defaults.ts";
import { getGroupedEditorSchema } from "./schema.ts";
import { getGroupedEditorUiSchema } from "./editor-ui-schema.ts";
import {
  buildGroupedExternalRules,
  buildGroupedOrderBy,
  collectGroupedRequiredFieldIds,
  resolveGroupedDisplayConfig,
} from "./filters.ts";
import { handleGroupedView } from "./view.ts";
import { handleGroupedCreate } from "./create.ts";
import { handleTableEdit } from "../table/edit.ts";
import { handleTableList } from "../table/list.ts";
import { handleTableUpdate } from "../table/update.ts";
import { handleTableDelete } from "../table/delete.ts";
import { handleTableUtility } from "../table/utility.ts";

export const groupedModule: ViewTypeModule = {
  key: "grouped",
  handlers: {
    view: handleGroupedView,
    edit: handleTableEdit,
    create: handleGroupedCreate,
    list: handleTableList,
    update: handleTableUpdate,
    delete: handleTableDelete,
    utility: handleTableUtility,
  },
  getDefaultDisplayConfig: getGroupedDefaultDisplayConfig,
  getEditorSchema: getGroupedEditorSchema,
  getEditorUiSchema: getGroupedEditorUiSchema,
  resolveDisplayConfig: resolveGroupedDisplayConfig,
  buildExternalRules: buildGroupedExternalRules,
  buildOrderBy: buildGroupedOrderBy,
  collectRequiredFieldIds: collectGroupedRequiredFieldIds,
};

export default groupedModule;
