// deno-lint-ignore-file no-import-prefix
// deno-lint-ignore no-unversioned-import
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
// deno-lint-ignore no-unversioned-import
import { Hono } from "jsr:@hono/hono";
import { getCredentials } from './utils.ts';
import { integrations } from './integrationRouter.ts';
import type { UrlParamComponents } from './utils.ts';

declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

function hasKey<T extends object>(obj: T, key: PropertyKey): key is keyof T {
  return key in obj;
}

const app = new Hono();

app.post("/wms_purchase_orders/:integrationName/:actionType/:companyId/:accountDatasourceId/:datasourceId/:action", async (c) => {
  const { integrationName, companyId, accountDatasourceId, datasourceId, actionType, action } = c.req.param();
  const rawBody = await c.req.text();
  const body = rawBody ? JSON.parse(rawBody) : {};

  const hasRequiredParams = [
    integrationName,
    companyId,
    accountDatasourceId,
    datasourceId,
    actionType,
    action,
  ].every(Boolean);

  if (!hasRequiredParams) {
    return c.json({ error: 'Missing required params' }, 400);
  }

  if (!hasKey(integrations, integrationName)) {
    return c.json({ error: `Unsupported integration: ${integrationName}` }, 400);
  }

  const integration = integrations[integrationName];
  if (!hasKey(integration, actionType)) {
    return c.json({ error: `Unsupported action type: ${actionType}` }, 400);
  }

  const actionGroup = integration[actionType];
  if (!hasKey(actionGroup, action)) {
    return c.json({ error: `Unsupported action: ${actionType}.${action}` }, 400);
  }

  const integrationAction = actionGroup[action] as (
    poData: unknown,
    credentials: unknown,
    urlParamComponents: UrlParamComponents,
  ) => Promise<unknown>;

  const urlParamComponents: UrlParamComponents = {
    companyId,
    datasourceId,
    accountDatasourceId,
    integrationName,
    actionType,
    action,
  };

  const credentials = await getCredentials(companyId, accountDatasourceId, integrationName);

  if (actionType === "bulk" && action === "sync") {
    EdgeRuntime.waitUntil(
      integrationAction(body, credentials, urlParamComponents).catch((error) => {
        console.error("Background purchase order bulk sync failed:", error);
      }),
    );

    return c.json({ accepted: true }, 202);
  }

  if ((actionType as string) === "webhook" && action !== "subscribe" && action !== "unsubscribe") {
    EdgeRuntime.waitUntil(
      integrationAction(body, credentials, urlParamComponents).catch((error) => {
        console.error(`Background webhook.${action} failed:`, error);
      }),
    );

    return c.json({ ok: true });
  }

  const result = await integrationAction(body, credentials, urlParamComponents);
  return c.json({ result });
});

Deno.serve(app.fetch);
