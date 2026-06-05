// Setup type definitions for built-in Supabase Runtime APIs
// deno-lint-ignore-file no-import-prefix
// deno-lint-ignore no-unversioned-import
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { plmApi } from "./apiRoutes/plm.ts";
import { pmApi } from "./apiRoutes/pm.ts";
import { type RequestContext } from "./utils.ts";

type RouteRequest = {
    requestData: unknown;
    context: RequestContext;
};

export const publicApi = {
    product: {
        create: ({ requestData, context }: RouteRequest) => {
            return plmApi.product.create(requestData, context);
        },
        update: ({ requestData, context }: RouteRequest) => {
            return plmApi.product.update(requestData, context);
        },
    },
    projectStyles: {
        create: ({ requestData, context }: RouteRequest) => {
            return pmApi.projectStyles.create(requestData, context);
        },
    }
};
