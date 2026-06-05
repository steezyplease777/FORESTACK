// deno-lint-ignore-file no-explicit-any
// Media Type Child Path Edge Function
// On INSERT of app_object_media_types: builds path {company_id}/{record_id} and writes to object_file_child_path_key
// Path format within bucket: {company_id}/{record_id}
// Full path = object_file_storage_key (from app_objects) + '/' + object_file_child_path_key

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

interface WebhookPayload {
  type?: "INSERT" | "UPDATE" | "DELETE";
  table?: string;
  schema?: string;
  record?: { id?: string; object_id?: string; company_id?: string };
  old_record?: unknown;
}

interface ManualPayload {
  media_type_id?: string;
  company_id?: string;
}

const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

console.info("media-type-child-path (write-back) started");

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new Response(JSON.stringify({ error: "Invalid content type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: WebhookPayload & ManualPayload = await req.json();

    // Accept Database Webhook (record) or manual (media_type_id + company_id)
    const recordId = body.record?.id ?? body.media_type_id;
    const companyId = body.record?.company_id ?? body.company_id;

    if (!recordId || !companyId) {
      return new Response(
        JSON.stringify({
          error: "Missing id and company_id. Expect record.id + record.company_id (webhook) or media_type_id + company_id (manual)",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Path: {company_id}/{record_id}
    const childPathKey = `${companyId}/${recordId}`;

    const { error: updErr } = await supabase
      .from("app_object_media_types")
      .update({ object_file_child_path_key: childPathKey })
      .eq("id", recordId);

    if (updErr) throw updErr;

    return new Response(
      JSON.stringify({ object_file_child_path_key: childPathKey, wrote_back: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("media-type-child-path error", e?.message);
    return new Response(
      JSON.stringify({ error: e?.message || "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});