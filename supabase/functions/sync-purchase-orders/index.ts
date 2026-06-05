// supabase/functions/sync-purchase-orders/index.ts
// deno-lint-ignore-file no-explicit-any

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { getEnv } from "./utils.ts";
import { getPurchaseOrders, mapPurchaseOrderToDb } from "./integrationObjects.ts";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getSupabaseServiceClient() {
  return createClient(getEnv("SUPABASE_URL"), getEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
}

async function getVariantIdBySku(supabase: any, sku: string) {
  const { data, error } = await supabase
    .from("plm_product_variants")
    .select("id")
    .eq("sku", sku)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

async function upsertPurchaseOrder(supabase: any, purchaseOrderPayload: any) {
  const { data, error } = await supabase
    .from("erp_purchase_orders")
    .upsert(purchaseOrderPayload, { onConflict: "company_id,vendor_id,purchase_order_number" })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

async function upsertPurchaseOrderLines(supabase: any, poId: string, lines: any[]) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { upserted: 0, keptSourceIds: [] as string[] };
  }

  const keptSourceIds: string[] = [];

  const linePayload = await Promise.all(
    lines.map(async (l: any) => {
      const predikoLineId = l?.id ?? null;
      if (predikoLineId) keptSourceIds.push(predikoLineId);

      const sku = l?.sku_name ?? null;
      if (!sku) return null;

      const variantId = await getVariantIdBySku(supabase, sku);
      if (!variantId) return null; // product_variant_id is NOT NULL in your table

      return {
        purchase_order_id: poId,
        product_variant_id: variantId,
        sku,
        quantity: Number(l.quantity_confirmed ?? 0),
        received_quantity: Number(l.received ?? 0),
        in_transit: Number(l.in_transit ?? 0),
        unit_cost: Number(l.unit_cost_supplier ?? 0),
        moq_value: l.moq ?? null,
        moq_type: l.moq_type ?? null,
        data_source_id: predikoLineId,
      } as Record<string, unknown>;
    }),
  );

  const filtered = linePayload.filter(Boolean) as Record<string, unknown>[];
  if (filtered.length === 0) return { upserted: 0, keptSourceIds };

  const { error, count } = await supabase
    .from("erp_purchase_order_lines")
    .upsert(filtered, { onConflict: "purchase_order_id,sku" })
    .select("id", { count: "exact", head: true });

  if (error) throw error;

  return { upserted: count ?? filtered.length, keptSourceIds };
}

async function deleteMissingLinesBySourceId(supabase: any, poId: string, keptSourceIds: string[]) {
  if (keptSourceIds.length === 0) {
    const { error } = await supabase
      .from("erp_purchase_order_lines")
      .delete()
      .eq("purchase_order_id", poId);

    if (error) throw error;
    return;
  }

  const inList = `(${keptSourceIds.map((id) => `"${id}"`).join(",")})`;

  const { error } = await supabase
    .from("erp_purchase_order_lines")
    .delete()
    .eq("purchase_order_id", poId)
    .not("data_source_id", "in", inList);

  if (error) throw error;
}

async function runPredikoSync() {
  const orders = await getPurchaseOrders();
  const supabase = getSupabaseServiceClient();

  const chunkSize = Number(Deno.env.get("CHUNK_SIZE") ?? 10);

  let posUpserted = 0;
  let linesUpserted = 0;

  for (let i = 0; i < orders.length; i += chunkSize) {
    const chunk = orders.slice(i, i + chunkSize);
    const mapped = await Promise.all(chunk.map(mapPurchaseOrderToDb));

    for (const item of mapped) {
      const poId = await upsertPurchaseOrder(supabase, item.purchaseOrder);
      posUpserted += 1;

      const { upserted, keptSourceIds } = await upsertPurchaseOrderLines(supabase, poId, item.lines);
      linesUpserted += upserted;

      await deleteMissingLinesBySourceId(supabase, poId, keptSourceIds);
    }
  }

  return { fetched: orders.length, posUpserted, linesUpserted };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "Use POST" }, 405);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const integration = body.integration;
    if (integration !== "prediko") {
      return json({ error: "Unknown integration", allowed: ["prediko"] }, 400);
    }

    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dry_run") === "true";

    if (dryRun) {
      const orders = await getPurchaseOrders();
      return json({
        dry_run: true,
        integration,
        fetched: orders.length,
        sample: orders[0] ?? null,
      });
    }

    // Background task: return immediately, run sync after response
    EdgeRuntime.waitUntil(
      runPredikoSync().then((result) => {
        console.log("prediko sync done", result);
      }).catch((err) => {
        console.error("prediko sync failed", err?.message ?? err);
      }),
    );

    return json(
      {
        queued: true,
        integration,
      },
      202,
    );
  } catch (e) {
    const msg = (e as Error)?.message ?? String(e);
    console.error("sync-purchase-orders error:", msg);
    return json({ error: msg }, 500);
  }
});