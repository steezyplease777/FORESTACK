// Edge Function: shopify-webhooks
// All comparison logic in TypeScript -- no more plm_product_update_shopify_current_values RPC
// Handles: metafield webhooks, product create/update/delete

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const FETCH_METAFIELDS_URL = "https://ocisdaeugliixyhcjnkv.supabase.co/functions/v1/fetch-shopify-metafields";

// ── Types ──────────────────────────────────────────────────────────

interface FieldDef {
  syncField: boolean;
  sourceColumn?: string;
  default?: unknown;
  payloadKeys?: string[];
}

interface FieldGroup {
  key: string;
  type: "object" | "array";
  sourceArray?: string;
  payloadPath?: string;
  fields: Record<string, FieldDef>;
}

interface SyncConfig {
  apiReferenceTable?: string;
  identifierType?: { type: string; customMetafieldKey?: string };
  fieldGroups: FieldGroup[];
  metafields?: Record<string, any>;
}

interface DataStatusEntry {
  integrationField: string;
  currentValue: string;
  status: string;
}

// ── Utilities ──────────────────────────────────────────────────────

function getSourceValue(apiRow: Record<string, any>, sourceColumn: string, arrKey?: string): string | null {
  if (!sourceColumn) return null;
  const prefix = arrKey ? arrKey + "." : null;
  if (prefix && sourceColumn.startsWith(prefix)) {
    const key = sourceColumn.slice(prefix.length);
    const arr = apiRow[arrKey!];
    if (!Array.isArray(arr)) return null;
    return arr.map((i) => i[key]?.toString().trim()).filter(Boolean).join(", ") || null;
  }
  if (sourceColumn.startsWith("variants.")) {
    const key = sourceColumn.slice(9);
    const arr = apiRow.variants;
    if (!Array.isArray(arr)) return null;
    return arr.map((i) => i[key]?.toString().trim()).filter(Boolean).join(", ") || null;
  }
  return apiRow[sourceColumn]?.toString().trim() || null;
}

function extractPayloadValue(
  payload: Record<string, any>,
  fieldKey: string,
  fieldDef: FieldDef,
  fg: FieldGroup,
): string | null {
  if (fg.type === "object") {
    if (fieldDef.payloadKeys) {
      for (const pk of fieldDef.payloadKeys) {
        const v = payload[pk]?.toString().trim();
        if (v) return v;
      }
    }
    return payload[fieldKey]?.toString().trim() || null;
  } else if (fg.type === "array") {
    const payloadPath = fg.payloadPath || fg.key;
    let arr = payload[payloadPath];
    if (arr?.nodes && Array.isArray(arr.nodes)) arr = arr.nodes;
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const srcKey = fg.sourceArray || fg.key;
    const sourceCol = fieldDef.sourceColumn || "";
    if (sourceCol.startsWith(srcKey + ".")) {
      return arr.map((i) => i[fieldKey]?.toString().trim()).filter(Boolean).join(", ") || null;
    }
    return arr[0]?.[fieldKey]?.toString().trim() || null;
  }
  return null;
}

function buildEmptyDataStatus(config: SyncConfig): DataStatusEntry[] {
  const entries: DataStatusEntry[] = [];
  for (const fg of config.fieldGroups) {
    for (const [fk, fv] of Object.entries(fg.fields)) {
      if (fv.syncField) entries.push({ integrationField: fk, currentValue: "", status: "" });
    }
  }
  for (const [mk, mv] of Object.entries(config.metafields || {})) {
    if (mv.syncField) entries.push({ integrationField: mk, currentValue: "", status: "" });
  }
  return entries.length > 0 ? entries : [{ integrationField: "", currentValue: "", status: "" }];
}

function compareFields(
  config: SyncConfig,
  apiRow: Record<string, any>,
  payload: Record<string, any>,
  existing: DataStatusEntry[],
  productId: string,
): { dataStatus: DataStatusEntry[]; allMatch: boolean } {
  const ds = existing.map((e) => ({ ...e }));
  let allMatch = true;

  for (const fg of config.fieldGroups) {
    const srcKey = fg.sourceArray || fg.key;
    for (const [fk, fv] of Object.entries(fg.fields)) {
      if (!fv.syncField) continue;
      const payloadVal = extractPayloadValue(payload, fk, fv, fg);
      const entry = ds.find((e) => e.integrationField === fk);
      if (entry && payloadVal) entry.currentValue = payloadVal;

      let sourceVal: string | null = null;
      if (fv.sourceColumn) {
        sourceVal = fg.type === "array" ? getSourceValue(apiRow, fv.sourceColumn, srcKey) : getSourceValue(apiRow, fv.sourceColumn);
      } else if (fv.default !== undefined) {
        sourceVal = typeof fv.default === "string" ? fv.default : String(fv.default);
      } else continue;

      const currentVal = entry?.currentValue || "";
      const match = (sourceVal || "").toLowerCase() === currentVal.toLowerCase();
      if (entry) entry.status = match ? "MATCH" : "MISMATCH";
      if (!match) allMatch = false;
    }
  }

  for (const [mk, mv] of Object.entries(config.metafields || {})) {
    if (!mv.syncField) continue;
    let payloadVal: string | null = null;
    const mfs = payload.metafields;
    if (Array.isArray(mfs)) {
      const m = mfs.find((x: any) => x.namespace === mv.namespace && x.key === mv.key);
      payloadVal = m?.value?.toString() || null;
    }
    const entry = ds.find((e) => e.integrationField === mk);
    if (entry && payloadVal) entry.currentValue = payloadVal;

    let sourceVal: string | null = null;
    if (mv.valueSource === "product_id") sourceVal = productId;
    else if (mv.sourceColumn) sourceVal = getSourceValue(apiRow, mv.sourceColumn);

    const currentVal = entry?.currentValue || "";
    const match = (sourceVal || "").toLowerCase() === currentVal.toLowerCase();
    if (entry) entry.status = match ? "MATCH" : "MISMATCH";
    if (!match) allMatch = false;
  }

  return { dataStatus: ds, allMatch };
}

function extractInternalProductId(payload: Record<string, unknown>, metafieldKey: string): string | null {
  const mfs = payload?.metafields;
  if (Array.isArray(mfs)) {
    const m = mfs.find((x: any) => x?.namespace === "custom" && x?.key === metafieldKey);
    return (m as any)?.value?.toString() ?? null;
  }
  if (mfs && typeof mfs === "object" && "custom" in mfs) {
    return ((mfs as any).custom?.[metafieldKey] as string) ?? null;
  }
  return null;
}

// ── Route ──────────────────────────────────────────────────────────

function getRoute(req: Request): "metafield" | "product" | null {
  const path = new URL(req.url).pathname;
  if (path.includes("/metafield")) return "metafield";
  if (path.includes("/product")) return "product";
  const topic = req.headers.get("X-Shopify-Topic") ?? "";
  if (topic.startsWith("metafield_definitions")) return "metafield";
  if (topic.startsWith("products")) return "product";
  return null;
}

// ── Metafield Handler (unchanged) ──────────────────────────────

async function handleMetafield(req: Request): Promise<Response> {
  const shopDomain = req.headers.get("X-Shopify-Shop-Domain");
  if (!shopDomain) return jsonRes({ error: "Missing X-Shopify-Shop-Domain" }, 400);
  const shopSubdomain = shopDomain.split(".")[0] || "";
  if (!shopSubdomain) return jsonRes({ error: "Invalid shop domain" }, 400);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: objs } = await supabase.from("app_integration_objects").select("id, webhook").not("webhook", "is", null);
  const webhookObjIds = (objs ?? [])
    .filter((r) => ((r.webhook as any)?.systemSubscriptions?.metafieldWebhooks?.length ?? 0) > 0)
    .map((r) => r.id);
  if (webhookObjIds.length === 0) return jsonRes({ ok: true, refreshed: 0 });

  const { data: conns } = await supabase.from("app_company_integrations").select("id, connection_settings");
  const matchingIds = findMatchingConnections(conns ?? [], shopSubdomain);
  if (matchingIds.length === 0) return jsonRes({ ok: true, refreshed: 0 });

  const { data: configs } = await supabase.from("app_company_integration_configuration")
    .select("company_integration_id, integration_object_id")
    .in("company_integration_id", matchingIds)
    .in("integration_object_id", webhookObjIds);

  let refreshed = 0;
  for (const cfg of configs ?? []) {
    try {
      const res = await fetch(FETCH_METAFIELDS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_integration_id: cfg.company_integration_id, integration_object_id: cfg.integration_object_id }),
      });
      if (res.ok) refreshed++;
    } catch { /* skip */ }
  }
  return jsonRes({ ok: true, refreshed });
}

// ── Product Handler ────────────────────────────────────────────────

async function handleProduct(req: Request): Promise<Response> {
  const shopDomain = req.headers.get("X-Shopify-Shop-Domain");
  const topic = req.headers.get("X-Shopify-Topic") ?? "";
  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { /* optional */ }

  const gid: string | null = body?.admin_graphql_api_id ?? null;
  if (!gid) return jsonRes({ ok: true, skipped: "no admin_graphql_api_id" });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: conns } = await supabase.from("app_company_integrations").select("id, connection_settings");
  const shopSubdomain = shopDomain?.split(".")[0] ?? "";
  const matchingIds = findMatchingConnections(conns ?? [], shopSubdomain);
  let updated = 0;

  // ── DELETE ──
  if (topic === "products/delete") {
    for (const cid of matchingIds) {
      const { data: products } = await supabase.rpc("find_products_by_shopify_gid", {
        p_company_integration_id: cid,
        p_shopify_gid: gid,
      });
      for (const prod of products ?? []) {
        const shopifyArr = (prod.integration_data?.shopify || []).map((e: any) =>
          e.companyIntegrationId === cid && e.sourceConnectionId === gid
            ? { ...e, soruceStatus: "_DELETED_ON_SHOPIFY" }
            : e,
        );
        await supabase.from("plm_products").update({
          integration_data: { ...prod.integration_data, shopify: shopifyArr },
        }).eq("id", prod.id);
        updated++;
      }
    }
    return jsonRes({ ok: true, topic, updated });
  }

  // ── CREATE / UPDATE ──
  let payload = body as Record<string, any>;

  const hasData = body?.title ?? body?.product_type ?? body?.productType ?? body?.variants;
  if (!hasData && conns?.length && shopDomain) {
    const conn = conns.find((c) => matchingIds.includes(c.id));
    if (conn?.connection_settings) {
      payload = await fetchProductFromShopify(conn.connection_settings as any, gid) || payload;
    }
  }

  for (const cid of matchingIds) {
    const { data: cfgRow } = await supabase.from("app_company_integration_configuration")
      .select("configuration_data").eq("company_integration_id", cid).limit(1).single();
    const config = (cfgRow?.configuration_data || {}) as SyncConfig;
    const idType = config.identifierType?.type || "customId";
    const mfKey = config.identifierType?.customMetafieldKey || "internal_product_id";
    const refTable = config.apiReferenceTable || "api_product";

    let targetProducts: { id: string; integration_data: any }[] = [];

    if (idType === "customId") {
      const productId = extractInternalProductId(payload, mfKey);
      if (productId) {
        const { data } = await supabase.from("plm_products").select("id, integration_data").eq("id", productId).single();
        if (data) targetProducts = [data];
      }
    } else {
      const { data } = await supabase.rpc("find_products_by_shopify_gid", {
        p_company_integration_id: cid,
        p_shopify_gid: gid,
      });
      targetProducts = data ?? [];
    }

    for (const prod of targetProducts) {
      const { data: apiRow } = await supabase.from(refTable).select("*").eq("id", prod.id).single();
      if (!apiRow) continue;

      const shopifyArr: any[] = prod.integration_data?.shopify || [];
      let entryFound = false;

      const newShopifyArr = shopifyArr.map((entry: any) => {
        if (entry.companyIntegrationId !== cid) return entry;
        if (entry.sourceConnectionId && entry.sourceConnectionId !== gid) return entry;
        entryFound = true;

        const existingStatus: DataStatusEntry[] = entry.dataStatus || buildEmptyDataStatus(config);
        const { dataStatus, allMatch } = compareFields(config, apiRow, payload, existingStatus, prod.id);

        return {
          ...entry,
          sourceConnectionId: entry.sourceConnectionId || gid,
          soruceStatus: allMatch ? "SYNCED" : "NOT_SYNCED",
          dataStatus,
        };
      });

      if (!entryFound && idType === "customId") {
        const { data: connName } = await supabase.from("app_company_integrations").select("connection_name").eq("id", cid).single();
        const emptyStatus = buildEmptyDataStatus(config);
        const { dataStatus, allMatch } = compareFields(config, apiRow, payload, emptyStatus, prod.id);
        newShopifyArr.push({
          companyIntegrationId: cid,
          integrationConnectionName: connName?.connection_name || "",
          integrationConnectionId: cid,
          sourceConnectionId: gid,
          soruceStatus: allMatch ? "SYNCED" : "NOT_SYNCED",
          dataStatus,
        });
      }

      await supabase.from("plm_products").update({
        integration_data: { ...(prod.integration_data || {}), shopify: newShopifyArr },
      }).eq("id", prod.id);
      updated++;
    }
  }

  return jsonRes({ ok: true, topic, updated });
}

// ── Helpers ────────────────────────────────────────────────────────

function findMatchingConnections(conns: any[], shopSubdomain: string): string[] {
  const ids: string[] = [];
  for (const c of conns) {
    const auth = c.connection_settings?.headerAuth;
    const vars: Record<string, string>[] = auth?.requestUrlVariables ?? [];
    if (vars.some((v) => v?.shop === shopSubdomain)) ids.push(c.id);
  }
  return ids;
}

async function fetchProductFromShopify(connSettings: any, gid: string): Promise<Record<string, any> | null> {
  const auth = connSettings?.headerAuth;
  if (!auth?.requestUrl) return null;
  const vars: Record<string, string>[] = auth.requestUrlVariables || [];
  let url = auth.requestUrl as string;
  for (const v of vars) {
    for (const [k, val] of Object.entries(v)) url = url.replace(`{${k}}`, val);
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", [auth.authHeaderKey || "X-Shopify-Access-Token"]: auth.authHeaderValue || "" },
      body: JSON.stringify({
        query: `query getProduct($id: ID!) {
          product(id: $id) {
            id title bodyHtml productType vendor handle status
            variants(first: 100) { nodes { sku price barcode position } }
            metafields(first: 50) { nodes { namespace key value } }
          }
        }`,
        variables: { id: gid },
      }),
    });
    const j = await res.json();
    const p = j?.data?.product;
    if (!p) return null;
    return {
      admin_graphql_api_id: gid,
      title: p.title,
      body_html: p.bodyHtml ?? p.body_html,
      product_type: p.productType ?? p.product_type,
      vendor: p.vendor,
      handle: p.handle,
      status: p.status,
      variants: Array.isArray(p.variants?.nodes) ? p.variants.nodes : p.variants ?? [],
      metafields: Array.isArray(p.metafields?.nodes)
        ? p.metafields.nodes.map((m: any) => ({ namespace: m.namespace, key: m.key, value: m.value }))
        : p.metafields ?? [],
    };
  } catch { return null; }
}

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

// ── Entry Point ────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return jsonRes({ error: "Method not allowed" }, 405);
  const route = getRoute(req);
  if (route === "metafield") return handleMetafield(req);
  if (route === "product") return handleProduct(req);
  return jsonRes({ error: "Unknown webhook route" }, 400);
});
