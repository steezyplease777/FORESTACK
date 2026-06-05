// Receives Shopify metafield_definitions webhooks and refreshes metafield options in config
// Triggered on METAFIELD_DEFINITIONS_CREATE, UPDATE, DELETE

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const FETCH_METAFIELDS_URL = "https://ocisdaeugliixyhcjnkv.supabase.co/functions/v1/fetch-shopify-product-metafields";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const shopDomain = req.headers.get("X-Shopify-Shop-Domain");
  if (!shopDomain) {
    return new Response(JSON.stringify({ error: "Missing X-Shopify-Shop-Domain" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const shopSubdomain = shopDomain.split(".")[0] || "";
  if (!shopSubdomain) {
    return new Response(JSON.stringify({ error: "Invalid shop domain" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: objs } = await supabase
    .from("app_integration_objects")
    .select("id, webhook")
    .not("webhook", "is", null);

  const webhookObjIds = (objs ?? [])
    .filter((r) => (r.webhook as { subscriptions?: unknown[] })?.subscriptions?.length)
    .map((r) => r.id);

  if (webhookObjIds.length === 0) {
    return new Response(JSON.stringify({ ok: true, refreshed: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: conns } = await supabase
    .from("app_company_integrations")
    .select("id, connection_settings");

  const matchingIds: string[] = [];
  for (const c of conns ?? []) {
    const auth = (c.connection_settings as Record<string, unknown>)?.headerAuth as Record<string, unknown>;
    const arr = (auth?.requestUrlVariables ?? []) as Record<string, string>[];
    if (arr.some((v) => v?.shop === shopSubdomain)) matchingIds.push(c.id);
  }

  if (matchingIds.length === 0) {
    return new Response(JSON.stringify({ ok: true, refreshed: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: configs } = await supabase
    .from("app_company_integration_configuration")
    .select("company_integration_id, integration_object_id")
    .in("company_integration_id", matchingIds)
    .in("integration_object_id", webhookObjIds);

  let refreshed = 0;
  for (const cfg of configs ?? []) {
    try {
      const res = await fetch(FETCH_METAFIELDS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_integration_id: cfg.company_integration_id,
          integration_object_id: cfg.integration_object_id,
        }),
      });
      if (res.ok) refreshed++;
    } catch (_e) {
      /* skip */
    }
  }

  return new Response(
    JSON.stringify({ ok: true, refreshed }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
