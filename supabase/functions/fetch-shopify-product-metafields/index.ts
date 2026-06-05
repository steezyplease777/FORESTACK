// Edge Function: fetch-shopify-product-metafields
// Called by app_company_integration_configuration_apply_modules trigger when a new Shopify Products config is created.
// Fetches the user's Shopify product metafield definitions and merges them into configuration_data.productInformation.metafields

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SHOPIFY_PRODUCT_METAFIELDS_QUERY = `
query metafieldDefinitions($first: Int!, $ownerType: MetafieldOwnerType!, $query: String) {
  metafieldDefinitions(first: $first, ownerType: $ownerType, query: $query) {
    edges {
      node {
        id
        namespace
        key
        name
        type { name }
      }
    }
  }
}
`;

interface Payload {
  company_integration_id: string;
  integration_object_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { company_integration_id, integration_object_id } = payload;
  if (!company_integration_id || !integration_object_id) {
    return new Response(
      JSON.stringify({ error: "Missing company_integration_id or integration_object_id" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: conn, error: connErr } = await supabase
    .from("app_company_integrations")
    .select("connection_settings")
    .eq("id", company_integration_id)
    .single();

  if (connErr || !conn?.connection_settings) {
    return new Response(
      JSON.stringify({ error: "Connection not found or no settings" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const auth = (conn.connection_settings as Record<string, unknown>)?.headerAuth ?? {};
  const authObj = auth as Record<string, unknown>;
  const urlTemplate = (authObj.requestUrl ?? "") as string;
  const urlVars = (authObj.requestUrlVariables ?? []) as Record<string, string>[];
  let url = urlTemplate;
  for (const v of urlVars) {
    const key = Object.keys(v)[0];
    if (key) url = url.replace(`{${key}}`, v[key] ?? "");
  }
  const authKey = (authObj.authHeaderKey ?? "X-Shopify-Access-Token") as string;
  const authValue = (authObj.authHeaderValue ?? "") as string;

  const shopifyRes = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [authKey]: authValue,
    },
    body: JSON.stringify({
      query: SHOPIFY_PRODUCT_METAFIELDS_QUERY,
      variables: {
        first: 100,
        ownerType: "PRODUCT",
        query: null,
      },
    }),
  });

  const shopifyJson = await shopifyRes.json();

  if (shopifyJson?.errors?.length) {
    return new Response(
      JSON.stringify({ error: "Shopify API error", details: shopifyJson.errors }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const edges = shopifyJson?.data?.metafieldDefinitions?.edges ?? [];
  const metafieldsAvailable = edges.map((e: { node: { id: string; namespace: string; key: string; name: string; type?: { name: string } } }) => ({
    id: e.node.id,
    namespace: e.node.namespace,
    key: e.node.key,
    name: e.node.name ?? e.node.key,
    type: e.node.type?.name ?? "single_line_text_field",
  }));

  const { data: cfg, error: cfgErr } = await supabase
    .from("app_company_integration_configuration")
    .select("configuration_data")
    .eq("company_integration_id", company_integration_id)
    .eq("integration_object_id", integration_object_id)
    .single();

  if (cfgErr || !cfg) {
    return new Response(
      JSON.stringify({ error: "Configuration not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const current = (cfg.configuration_data ?? {}) as Record<string, unknown>;
  const productInfo = (current.productInformation ?? {}) as Record<string, unknown>;
  const existingMetafields = (productInfo.metafields ?? {}) as Record<string, Record<string, unknown>>;

  // Merge Shopify metafields into productInformation.metafields (namespace.key as key)
  const mergedMetafields = { ...existingMetafields };
  for (const m of metafieldsAvailable) {
    const compositeKey = `${m.namespace}.${m.key}`;
    if (!(compositeKey in mergedMetafields)) {
      mergedMetafields[compositeKey] = {
        syncField: false,
        namespace: m.namespace,
        key: m.key,
        sourceColumn: null,
        type: m.type,
      };
    }
  }

  const updated = {
    ...current,
    productInformation: {
      ...productInfo,
      metafieldsAvailable,
      metafields: mergedMetafields,
    },
  };

  const { error: updateErr } = await supabase
    .from("app_company_integration_configuration")
    .update({ configuration_data: updated })
    .eq("company_integration_id", company_integration_id)
    .eq("integration_object_id", integration_object_id);

  if (updateErr) {
    return new Response(
      JSON.stringify({ error: updateErr.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ metafieldsAvailable, metafields: mergedMetafields, count: metafieldsAvailable.length }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
