// Registers metafield definition webhooks with Shopify when a new config is created
// Called by app_company_integration_configuration_apply_modules trigger

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const METAFIELD_TOPICS = ["METAFIELD_DEFINITIONS_CREATE", "METAFIELD_DEFINITIONS_UPDATE", "METAFIELD_DEFINITIONS_DELETE"];
const WEBHOOK_URI = "https://ocisdaeugliixyhcjnkv.supabase.co/functions/v1/shopify-metafield-webhook";

const WEBHOOK_CREATE_MUTATION = `
mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
  webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
    webhookSubscription { id topic uri }
    userErrors { field message }
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

  const { company_integration_id } = payload;
  if (!company_integration_id) {
    return new Response(JSON.stringify({ error: "Missing company_integration_id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
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
    return new Response(JSON.stringify({ error: "Connection not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
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

  const results: { topic: string; ok: boolean; error?: string }[] = [];
  for (const topic of METAFIELD_TOPICS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [authKey]: authValue,
        },
        body: JSON.stringify({
          query: WEBHOOK_CREATE_MUTATION,
          variables: {
            topic,
            webhookSubscription: { uri: WEBHOOK_URI },
          },
        }),
      });
      const json = await res.json();
      const errs = json?.data?.webhookSubscriptionCreate?.userErrors ?? [];
      if (errs.length > 0) {
        results.push({ topic, ok: false, error: errs.map((e: { message: string }) => e.message).join("; ") });
      } else {
        results.push({ topic, ok: true });
      }
    } catch (e) {
      results.push({ topic, ok: false, error: String(e) });
    }
  }

  return new Response(
    JSON.stringify({ ok: results.every((r) => r.ok), results }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
