// deno-lint-ignore-file no-explicit-any
// Auto Bucket Creator Edge Function (updates bucket_id + object_file_storage_key)
// Creates a Storage bucket named `${module_code}-${name}-files` for a given app_objects row
// Writes bucket name to bucket_id and storage URL (up to bucket) to object_file_storage_key

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

// Supabase Database Webhook payload: { type, table, schema, record, old_record }
// Also supports manual calls with { app_object_id }
interface Payload {
  type?: "INSERT" | "UPDATE" | "DELETE";
  table?: string;
  schema?: string;
  record?: { id?: string };
  old_record?: unknown;
  app_object_id?: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function ensureBucket(name: string) {
  const { data: list, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) throw listErr;
  const exists = list?.some((b) => b.name === name);
  if (exists) return { created: false, name };

  const { data, error } = await supabase.storage.createBucket(name, {
    public: false,
    file_size_limit: 50 * 1024 * 1024,
  });
  if (error) {
    if (error.message?.toLowerCase().includes("already exists")) {
      return { created: false, name };
    }
    throw error;
  }
  return { created: true, name: data.name };
}

async function getBucketName(appObjectId: string) {
  // NOTE: match your schema: app_objects.app_module_id -> app_modules.id(module_code)
  const { data: appObj, error: appErr } = await supabase
    .from("app_objects")
    .select("id, name, app_module_id, app_module:app_module_id(id, module_code)")
    .eq("id", appObjectId)
    .single();
  if (appErr) throw appErr;
  if (!appObj?.app_module?.module_code || !appObj?.name) {
    throw new Error("module_code or name missing for app_object");
  }
  const safe = (s: string) => s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const bucket = `${safe(appObj.app_module.module_code)}-${safe(appObj.name)}-files`;
  const trimmed = bucket.slice(0, 63).replace(/-+$/g, "");
  return trimmed;
}

console.info("auto-bucket-creator (write-back) started");

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
    }
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new Response(JSON.stringify({ error: "Invalid content type" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const body: Payload = await req.json();

    // Accept Database Webhook payload (record.id) or manual payload (app_object_id)
    const appObjectId = body.record?.id ?? body.app_object_id;
    if (!appObjectId) {
      return new Response(
        JSON.stringify({ error: "Missing app_object_id. Expect record.id (webhook) or app_object_id (manual)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const bucketName = await getBucketName(appObjectId);
    const result = await ensureBucket(bucketName);

    // Storage URL up to bucket: {url}/storage/v1/object/authenticated/{bucket}
    const storageUrl = `${SUPABASE_URL}/storage/v1/object/authenticated/${bucketName}`;

    // Write back to app_objects.bucket_id and object_file_storage_key
    const { error: updErr } = await supabase
      .from("app_objects")
      .update({ bucket_id: bucketName, object_file_storage_key: storageUrl })
      .eq("id", appObjectId);
    if (updErr) throw updErr;

    return new Response(
      JSON.stringify({ bucket: bucketName, created: result.created, wrote_back: true }),
      { status: result.created ? 201 : 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("auto-bucket-creator error", e?.message);
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});