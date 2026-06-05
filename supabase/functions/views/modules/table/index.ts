import type { ViewTypeModule } from "../../shared/types.ts";
import { getTableDefaultDisplayConfig } from "./defaults.ts";
import { getTableEditorSchema } from "./schema.ts";
import { getTableEditorUiSchema } from "./editor-ui-schema.ts";
import {
  buildTableExternalRules,
  buildTableOrderBy,
  collectTableRequiredFieldIds,
  resolveTableDisplayConfig,
} from "./filters.ts";
import { handleTableView } from "./view.ts";
import { handleTableEdit } from "./edit.ts";
import { handleTableCreate } from "./create.ts";
import { handleTableList } from "./list.ts";
import { handleTableUpdate } from "./update.ts";
import { handleTableDelete } from "./delete.ts";
import { handleTableUtility } from "./utility.ts";

export const tableModule: ViewTypeModule = {
  key: "table",
  handlers: {
    view: handleTableView,
    edit: handleTableEdit,
    create: handleTableCreate,
    list: handleTableList,
    update: handleTableUpdate,
    delete: handleTableDelete,
    utility: handleTableUtility,
  },
  getDefaultDisplayConfig: getTableDefaultDisplayConfig,
  getEditorSchema: getTableEditorSchema,
  getEditorUiSchema: getTableEditorUiSchema,
  resolveDisplayConfig: resolveTableDisplayConfig,
  buildExternalRules: buildTableExternalRules,
  buildOrderBy: buildTableOrderBy,
  collectRequiredFieldIds: collectTableRequiredFieldIds,
};

export default tableModule;
