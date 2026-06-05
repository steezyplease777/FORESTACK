// Edge Function: shopify-sync
// Config-driven GraphQL request compiler -- all in TypeScript
// Replaces: build_shopify_product_request_draft, shopify_product_set_send,
//           shopify_sync_process_http_response, shopify_sync_pending table

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ── Types ──────────────────────────────────────────────────────────

interface FieldDef {
  syncField: boolean;
  sourceColumn?: string;
  default?: unknown;
}

interface OptionDef {
  name: string;
  sourceColumn: string;
  sortColumn?: string;
  position?: number;
}

interface FieldGroup {
  key: string;
  type: "object" | "array";
  sourceArray?: string;
  fields: Record<string, FieldDef>;
  options?: OptionDef[];
}

interface SyncConfig {
  apiReferenceTable?: string;
  identifierType?: { type: string; customMetafieldKey?: string };
  fieldGroups: FieldGroup[];
  metafields?: Record<string, any>;
}

// ── Utilities ──────────────────────────────────────────────────────

function stripPrefix(col: string, arrKey: string): string | null {
  const p = arrKey + ".";
  return col.startsWith(p) ? col.slice(p.length) || null : null;
}

function setNested(obj: Record<string, any>, path: string, val: unknown) {
  if (path.includes(".")) {
    const [parent, child] = path.split(".");
    obj[parent] = obj[parent] || {};
    obj[parent][child] = val;
  } else {
    obj[path] = val;
  }
}

function resolveUrl(template: string, vars: Record<string, string>[]): string {
  let url = template;
  for (const v of vars) {
    for (const [k, val] of Object.entries(v)) {
      url = url.replace(`{${k}}`, val);
    }
  }
  return url;
}

function getVal(row: Record<string, any>, col: string): string | null {
  const v = row?.[col];
  if (v == null) return null;
  const s = v.toString().trim();
  return s || null;
}

// ── Compiler: config + api row → GraphQL variables ─────────────────

function compileInput(
  config: SyncConfig,
  apiRow: Record<string, any>,
  productId: string,
  shopifyGid?: string | null,
): { input: Record<string, any>; identifier: Record<string, any> | null } {
  const input: Record<string, any> = {};
  const idCfg = config.identifierType || { type: "customId", customMetafieldKey: "internal_product_id" };
  const idType = idCfg.type || "customId";
  const mfKey = idCfg.customMetafieldKey;

  for (const fg of config.fieldGroups) {
    if (fg.type === "object") {
      for (const [fk, fv] of Object.entries(fg.fields)) {
        if (!fv.syncField) continue;
        let v: string | null = null;
        if (fv.sourceColumn) {
          v = getVal(apiRow, fv.sourceColumn);
        } else if (fv.default !== undefined) {
          v = typeof fv.default === "string" ? fv.default : JSON.stringify(fv.default);
        } else continue;
        if (v == null && fv.default == null) continue;
        if (v != null) setNested(input, fk, v);
      }

    } else if (fg.type === "array") {
      const srcKey = fg.sourceArray || fg.key;
      const srcArr: Record<string, any>[] = Array.isArray(apiRow[srcKey]) ? apiRow[srcKey] : [];
      if (srcArr.length === 0) continue;
      const opts = fg.options || [];

      const optMaps: Record<string, { key: string; posMap: Map<string, number> }> = {};
      for (const opt of opts) {
        const optKey = stripPrefix(opt.sourceColumn, srcKey) || opt.sourceColumn;
        const sortKey = opt.sortColumn ? (stripPrefix(opt.sortColumn, srcKey) || opt.sortColumn) : null;
        const valSort = new Map<string, number>();
        for (const item of srcArr) {
          const v = item[optKey]?.toString().trim();
          if (!v) continue;
          const s = sortKey ? parseInt(item[sortKey]) || Infinity : Infinity;
          if (!valSort.has(v) || s < valSort.get(v)!) valSort.set(v, s);
        }
        const sorted = [...valSort.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
        const posMap = new Map<string, number>();
        sorted.forEach(([v], i) => posMap.set(v, i + 1));
        optMaps[opt.name] = { key: optKey, posMap };
      }

      if (opts.length > 0) {
        const productOptions = opts.map((opt) => ({
          name: opt.name,
          position: opt.position || 1,
          values: [...optMaps[opt.name].posMap.keys()].map((v) => ({ name: v })),
        }));
        if (productOptions[0]?.values.length > 0) input.productOptions = productOptions;
      }

      const items: Record<string, any>[] = [];
      for (const el of srcArr) {
        let ok = true;
        for (const opt of opts) {
          const v = el[optMaps[opt.name].key]?.toString().trim();
          if (!v || !optMaps[opt.name].posMap.has(v)) { ok = false; break; }
        }
        if (!ok) continue;

        const varObj: Record<string, any> = {};
        for (const [fk, fv] of Object.entries(fg.fields)) {
          if (!fv.syncField) continue;
          let fval: string | null = null;
          if (fv.sourceColumn) {
            const varKey = stripPrefix(fv.sourceColumn, srcKey);
            if (varKey) {
              fval = el[varKey]?.toString().trim() || null;
            } else {
              fval = getVal(apiRow, fv.sourceColumn);
              if (fk === "price" && fval) fval = parseFloat(fval).toFixed(2);
            }
          } else if (fv.default !== undefined) {
            fval = typeof fv.default === "string" ? fv.default : String(fv.default);
          }
          if (fval != null) varObj[fk] = fval;
        }

        if (opts.length > 0) {
          varObj.optionValues = opts.map((opt) => ({
            optionName: opt.name,
            name: el[optMaps[opt.name].key]?.toString(),
          }));
          varObj.position = optMaps[opts[0].name].posMap.get(el[optMaps[opts[0].name].key]?.toString()) || 1;
        }
        items.push(varObj);
      }
      if (items.length > 0) input[fg.key] = items;
    }
  }

  if (!("status" in input)) input.status = "ACTIVE";

  const mfs: Record<string, any>[] = [];
  if (idType === "customId" && mfKey) {
    mfs.push({ namespace: "custom", key: mfKey, value: productId.trim() });
  }
  for (const [mk, mv] of Object.entries(config.metafields || {})) {
    if (idType === "customId" && mk === mfKey) continue;
    if (!mv.syncField) continue;
    const src = mv.sourceColumn || mv.valueSource;
    let v: string | null = null;
    if (src === "product_id") v = productId.trim();
    else if (src) v = getVal(apiRow, src);
    if (v) mfs.push({ namespace: mv.namespace, key: mv.key, value: v });
  }
  if (mfs.length > 0) input.metafields = mfs;

  if (!shopifyGid && !input.title) {
    const fallback = getVal(apiRow, "product_name");
    if (!fallback) throw new Error(`Cannot create: title missing for ${productId}`);
    input.title = fallback;
  }

  let identifier: Record<string, any> | null = null;
  if (idType === "customId" && mfKey) {
    identifier = shopifyGid
      ? { id: shopifyGid }
      : { customId: { namespace: "custom", key: mfKey, value: productId.trim() } };
  } else if (idType === "integrationId" && shopifyGid) {
    identifier = { id: shopifyGid };
  }

  return { input, identifier };
}

// ── Main Handler ───────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonRes({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const { company_integration_id, integration_object_id, product_id, shopify_product_gid } = body;

    if (!company_integration_id || !integration_object_id || !product_id) {
      return jsonRes({ error: "Missing required: company_integration_id, integration_object_id, product_id" }, 400);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const [objRes, cfgRes, connRes] = await Promise.all([
      supabase.from("app_integration_objects").select("graphql_query").eq("id", integration_object_id).single(),
      supabase.from("app_company_integration_configuration").select("configuration_data")
        .eq("company_integration_id", company_integration_id)
        .eq("integration_object_id", integration_object_id).single(),
      supabase.from("app_company_integrations").select("connection_settings").eq("id", company_integration_id).single(),
    ]);

    const graphqlQuery = objRes.data?.graphql_query;
    if (!graphqlQuery) return jsonRes({ error: "No graphql_query for integration object" }, 400);

    const config = (cfgRes.data?.configuration_data || {}) as SyncConfig;
    const auth = (connRes.data?.connection_settings as any)?.headerAuth || {};
    const shopifyUrl = resolveUrl(auth.requestUrl || "", auth.requestUrlVariables || []);

    const refTable = config.apiReferenceTable || "api_product";
    const { data: apiRow } = await supabase.from(refTable).select("*").eq("id", product_id).single();
    if (!apiRow) return jsonRes({ error: `No row in ${refTable} for ${product_id}` }, 404);

    let effectiveGid = shopify_product_gid || null;
    if (!effectiveGid && config.identifierType?.type === "integrationId") {
      const { data: prod } = await supabase.from("plm_products").select("integration_data").eq("id", product_id).single();
      const entry = (prod?.integration_data?.shopify || []).find(
        (e: any) => e.companyIntegrationId === company_integration_id && e.sourceConnectionId,
      );
      if (entry?.sourceConnectionId) effectiveGid = entry.sourceConnectionId;
    }

    const { input, identifier } = compileInput(config, apiRow, product_id, effectiveGid);
    const variables: Record<string, any> = { input };
    if (identifier) variables.identifier = identifier;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (auth.authHeaderKey) headers[auth.authHeaderKey] = auth.authHeaderValue || "";

    const shopifyRes = await fetch(shopifyUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: graphqlQuery, variables }),
    });
    const result = await shopifyRes.json();

    const userErrors = result?.data?.productSet?.userErrors || [];
    if (userErrors.length > 0) {
      return jsonRes({ error: "Shopify userErrors", userErrors, variables_sent: variables }, 422);
    }
    if (result?.errors?.length > 0) {
      return jsonRes({ error: "Shopify API errors", errors: result.errors }, 422);
    }

    const returnedGid = result?.data?.productSet?.product?.id;
    if (config.identifierType?.type === "integrationId" && returnedGid) {
      const { data: prod } = await supabase.from("plm_products").select("integration_data").eq("id", product_id).single();
      if (prod?.integration_data) {
        const shopifyArr = (prod.integration_data.shopify || []).map((e: any) =>
          e.companyIntegrationId === company_integration_id
            ? { ...e, sourceConnectionId: returnedGid }
            : e,
        );
        await supabase.from("plm_products").update({
          integration_data: { ...prod.integration_data, shopify: shopifyArr },
        }).eq("id", product_id);
      }
    }

    return jsonRes({ ok: true, shopify_product_id: returnedGid, variables_sent: variables });
  } catch (err) {
    return jsonRes({ error: (err as Error).message }, 500);
  }
});

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
