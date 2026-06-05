// deno-lint-ignore-file no-import-prefix
import { createClient } from 'npm:@supabase/supabase-js@2';

export type UrlParamComponents = {
  companyId: string;
  datasourceId: string;
  accountDatasourceId: string;
  integrationName: string;
  actionType: string;
  action: string;
}

export type PurchaseOrder = {
  company_id: string;
  vendor_id: string;
  purchase_order_number: string;
  status: string | null;
  total_amount: number | null;
  delivered_date: string | null;
  estimated_delivery_date: string | null;
  integration_data: Record<string, unknown> | null;
  datasource_id: string;
}

export type PurchaseOrderLine = {
  purchase_order_id: string;
  product_variant_id: string;
  sku: string;
  quantity: number;
  received_quantity: number;
  in_transit: number;
  unit_cost: number;
  moq_value: number | null;
  moq_type: string | null;
  data_source_id: string | null;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getCredentials(companyId: string, datasourceAccountId: string, integrationName: string) {
  const { data, error } = await supabase
    .schema('datasources')
    .from(`app_${integrationName}_connection`)
    .select('*')
    .eq('company_id', companyId)
    .eq('datasource_account_id', datasourceAccountId)
    .single();

  if (error) throw new Error(`Failed to get credentials: ${error.message}`);
  return data;
}

export async function findSkuId(sku: string, companyId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('plm_product_variants')
    .select('id')
    .eq('company_id', companyId)
    .eq('sku', sku)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

export async function findSkuIds(skus: string[], companyId: string): Promise<Map<string, string>> {
  const uniqueSkus = [...new Set(skus.filter(Boolean))];
  const skuIdMap = new Map<string, string>();
  if (!uniqueSkus.length) return skuIdMap;

  const chunks = chunkArray(uniqueSkus, 500);
  for (const chunk of chunks) {
    const { data, error } = await supabase
      .from('plm_product_variants')
      .select('id, sku')
      .eq('company_id', companyId)
      .in('sku', chunk);

    if (error) throw new Error(error.message);
    for (const item of data ?? []) {
      if (item.sku && !skuIdMap.has(item.sku)) {
        skuIdMap.set(item.sku, item.id);
      }
    }
  }
  return skuIdMap;
}

export async function upsertPurchaseOrders(orders: Omit<PurchaseOrder, "datasource_id">[]) {
  if (!orders.length) return [];
  const chunks = chunkArray(orders, 100);
  const results: { id: string }[] = [];

  for (const chunk of chunks) {
    const { data, error } = await supabase
      .from("erp_purchase_orders")
      .upsert(chunk, { onConflict: "company_id,vendor_id,purchase_order_number" })
      .select("id");

    if (error) throw new Error(error.message);
    results.push(...(data ?? []));
  }
  return results;
}

export async function upsertPurchaseOrderLines(lines: PurchaseOrderLine[]) {
  if (!lines.length) return { upserted: 0 };
  const chunks = chunkArray(lines, 100);
  let upserted = 0;

  for (const chunk of chunks) {
    const { data, error } = await supabase
      .from("erp_purchase_order_lines")
      .upsert(chunk, { onConflict: "purchase_order_id,sku" })
      .select("id");

    if (error) throw new Error(error.message);
    upserted += (data?.length ?? 0);
  }
  return { upserted };
}

export async function deleteMissingLines(poId: string, keptSourceIds: string[]) {
  if (keptSourceIds.length === 0) {
    const { error } = await supabase
      .from("erp_purchase_order_lines")
      .delete()
      .eq("purchase_order_id", poId);

    if (error) throw new Error(error.message);
    return;
  }

  const inList = `(${keptSourceIds.map((id) => `"${id}"`).join(",")})`;
  const { error } = await supabase
    .from("erp_purchase_order_lines")
    .delete()
    .eq("purchase_order_id", poId)
    .not("data_source_id", "in", inList);

  if (error) throw new Error(error.message);
}

export type VendorMapEntry = {
  datasource_vendor_name: string;
  datasource_vendor_id: string;
  app_vendor_name: string;
  app_vendor_id: string;
}

export async function getVendorMap(companyId: string, accountDatasourceId: string): Promise<VendorMapEntry[]> {
  const { data, error } = await supabase
    .schema("datasources")
    .from("app_prediko_connection")
    .select("vendor_map")
    .eq("company_id", companyId)
    .eq("datasource_account_id", accountDatasourceId)
    .single();

  if (error) throw new Error(`Failed to read vendor_map: ${error.message}`);
  return Array.isArray(data?.vendor_map) ? data.vendor_map as VendorMapEntry[] : [];
}

export function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export const generatePostUrl = (urlParamComponents: UrlParamComponents, actionType: string, action: string) => {
  const { companyId, integrationName, accountDatasourceId, datasourceId } = urlParamComponents;
  return `https://ocisdaeugliixyhcjnkv.supabase.co/functions/v1/wms_purchase_orders/${integrationName}/${actionType}/${companyId}/${accountDatasourceId}/${datasourceId}/${action}`;
}

export async function getShipHeroVendorMap(companyId: string, accountDatasourceId: string): Promise<VendorMapEntry[]> {
  const { data, error } = await supabase
    .schema("datasources")
    .from("app_shiphero_connection")
    .select("vendor_map")
    .eq("company_id", companyId)
    .eq("datasource_account_id", accountDatasourceId)
    .single();

  if (error) throw new Error(`Failed to read vendor_map from shiphero connection: ${error.message}`);
  return Array.isArray(data?.vendor_map) ? data.vendor_map as VendorMapEntry[] : [];
}
