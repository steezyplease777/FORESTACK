// Registers all webhooks from webhook_config and stores subscription IDs
// Called when new app_company_integration_configuration is created

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BASE_URL = "https://ocisdaeugliixyhcjnkv.supabase.co/functions/v1";

const WEBHOOK_CREATE = `
mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
  webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
    webhookSubscription { id topic uri metafieldNamespaces }
    userErrors { field message }
  }
}
`;

const PRODUCT_TOPICS = new Set([
  "PRODUCTS_CREATE",
  "PRODUCTS_UPDATE",
]);

interface Payload {
  company_integration_id: string;
  integration_object_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  }
  let payload: Payload;
  try { payload = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const { company_integration_id, integration_object_id } = payload;
  if (!company_integration_id || !integration_object_id) {
    return new Response(JSON.stringify({ error: "Missing ids" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: cfgRow } = await supabase
    .from("app_company_integration_configuration")
    .select("webhook_config")
    .eq("company_integration_id", company_integration_id)
    .eq("integration_object_id", integration_object_id)
    .single();

  const webhookConfig = JSON.parse(JSON.stringify(cfgRow?.webhook_config ?? {}));
  const meta = Array.isArray(webhookConfig.systemSubscriptions?.metafieldWebhooks) ? webhookConfig.systemSubscriptions.metafieldWebhooks : [];
  const objSubs = Array.isArray(webhookConfig.objectSubscriptions) ? webhookConfig.objectSubscriptions : [];
  const all = [...meta, ...objSubs].filter((w: { topic?: string; callbackPath?: string }) => w.topic && w.callbackPath);

  if (all.length === 0) {
    return new Response(JSON.stringify({ ok: true, registered: 0 }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  const { data: conn } = await supabase
    .from("app_company_integrations")
    .select("connection_settings")
    .eq("id", company_integration_id)
    .single();

  if (!conn?.connection_settings) {
    return new Response(JSON.stringify({ error: "Connection not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  const auth = (conn.connection_settings as Record<string, unknown>).headerAuth as Record<string, unknown>;
  const urlTemplate = (auth?.requestUrl ?? "") as string;
  const urlVars = (auth?.requestUrlVariables ?? []) as Record<string, string>[];
  let url = urlTemplate;
  for (const v of urlVars) { const k = Object.keys(v)[0]; if (k) url = url.replace(`{${k}}`, v[k] ?? ""); }
  const authKey = (auth?.authHeaderKey ?? "X-Shopify-Access-Token") as string;
  const authVal = (auth?.authHeaderValue ?? "") as string;

  for (const w of all) {
    const uri = `${BASE_URL}/${w.callbackPath}`;
    const subInput: Record<string, unknown> = { uri };
    if (PRODUCT_TOPICS.has(w.topic)) {
      subInput.metafieldNamespaces = ["custom"];
    }
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", [authKey]: authVal },
        body: JSON.stringify({ query: WEBHOOK_CREATE, variables: { topic: w.topic, webhookSubscription: subInput } }),
      });
      const json = await res.json();
      const errs = json?.data?.webhookSubscriptionCreate?.userErrors ?? [];
      const subId = errs.length === 0 ? json?.data?.webhookSubscriptionCreate?.webhookSubscription?.id ?? "" : "";
      w.subscriptionId = subId;
    } catch (_e) { w.subscriptionId = ""; }
  }

  await supabase
    .from("app_company_integration_configuration")
    .update({ webhook_config: webhookConfig })
    .eq("company_integration_id", company_integration_id)
    .eq("integration_object_id", integration_object_id);

  return new Response(JSON.stringify({ ok: true, webhook_config: webhookConfig }), { status: 200, headers: { "Content-Type": "application/json" } });
});
