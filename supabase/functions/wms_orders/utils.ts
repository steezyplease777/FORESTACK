// Setup type definitions for built-in Supabase Runtime APIs
// deno-lint-ignore-file no-import-prefix
import { createClient } from "npm:@supabase/supabase-js@2";

export type wmsOrder = {
  customer_id: string;
  company_id: string;
  order_channel_id: string | null;
  order_number: string;
  datasource_id: string;
  datasource_raw_data: unknown;
  order_total: number | null;
  paid_amount: string | null;
  total_shipping: number | null;
  total_discounts: number | null;
  external_id: string;
  datasource_link: string | null;
  purchase_order_number: string | null;
  start_ship_window_date: string | null;
  end_ship_window_date: string | null;
  total_outstanding: number | null;
  fulfillment_status: "UNFULFILLED" | "PARTIAL" | "FULFILLED" | null;
  shipping_address: {
    street_1: string | null;
    street_2: string | null;
    city: string | null;
    province: string | null;
    zipcode: string | null;
    country: string | null;
  } | null;
};

export type wmsOrderLineItem = {
  order_id: string;
  company_id: string;
  product_variant_id: string;
  quantity: number;
  price: number;
  line_total: number;
  sku: string | null;
  upc: string | null;
  product_title: string | null;
  external_id: string;
};

export type crmCustomerSeed = {
  company_id: string;
  datasource_id: string;
  email: string;
  first_name: string;
  last_name: string | null;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  external_id: string | null;
};

export type UrlParamComponents = {
  companyId: string;
  datasourceId: string;
  accountDatasourceId: string;
  integrationName: string;
  actionType: string;
  action: string;
}

type orderRow = {
  id: string;
  customer_id: string;
  order_number: string;
  external_id: string | null;
};

export type orderChannelSeed = {
  key: string;
  name: string;
  external_id: string | null;
};

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

const supabaseUrl = getEnv("SUPABASE_URL");
const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getCredentials(companyId: string, datasourceAccountId: string, integrationName: string) {
  const { data, error } = await supabase
      .schema('datasources')
      .from(`app_${integrationName}_connection`)
      .select('*')
      .eq('company_id', companyId)
      .eq('datasource_account_id', datasourceAccountId)
      .single();

  if (error) {
      throw new Error(`Failed to get credentials: ${error.message}`);
  }

  return data;
}

export async function storeBulkOperationId(
  datasourceId: string,
  bulkOperationId: string,
) {
  const { error } = await supabase
    .schema("datasources")
    .from("orders_datasources")
    .update({
      delegate_access_token: bulkOperationId,
    })
    .eq("id", datasourceId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getStoredBulkOperationId(
  datasourceId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .schema("datasources")
    .from("orders_datasources")
    .select("delegate_access_token")
    .eq("id", datasourceId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.delegate_access_token ?? null;
}

export async function clearStoredBulkOperationId(datasourceId: string) {
  const { error } = await supabase
    .schema("datasources")
    .from("orders_datasources")
    .update({
      delegate_access_token: null,
    })
    .eq("id", datasourceId);

  if (error) {
    throw new Error(error.message);
  }
}

export type orderChannelMapEntry = {
  datasource_order_channel_name: string;
  datasource_order_channel_id: string;
  app_order_channel_name: string;
  app_order_channel_id: string;
};

export async function updateOrderChannelMap(
  datasourceId: string,
  discoveredChannels: orderChannelMapEntry[],
) {
  const { data: existing, error: readError } = await supabase
    .schema("datasources")
    .from("orders_datasources")
    .select("order_channel_map")
    .eq("id", datasourceId)
    .single();

  if (readError) {
    throw new Error(`Failed to read order_channel_map: ${readError.message}`);
  }

  const currentMap = Array.isArray(existing?.order_channel_map)
    ? existing.order_channel_map as orderChannelMapEntry[]
    : [];

  const normalizeKey = (name: string, id: string) =>
    `${name.toLowerCase()}:${id}`;

  const existingKeys = new Set(
    currentMap.map((e: orderChannelMapEntry) => normalizeKey(e.datasource_order_channel_name, e.datasource_order_channel_id)),
  );

  const newEntries = discoveredChannels.filter(
    (ch) => !existingKeys.has(normalizeKey(ch.datasource_order_channel_name, ch.datasource_order_channel_id)),
  );

  if (!newEntries.length) return;

  const merged = [...currentMap, ...newEntries];

  const { error: writeError } = await supabase
    .schema("datasources")
    .from("orders_datasources")
    .update({ order_channel_map: merged })
    .eq("id", datasourceId);

  if (writeError) {
    throw new Error(`Failed to update order_channel_map: ${writeError.message}`);
  }
}

export async function resolveSubscriptionId(accountDatasourceId: string): Promise<string> {
  const { data, error } = await supabase
    .schema("datasources")
    .from("datasource_accounts")
    .select("subscription_id")
    .eq("id", accountDatasourceId)
    .single();

  if (error) {
    throw new Error(`Failed to resolve subscription ID: ${error.message}`);
  }

  if (!data.subscription_id) {
    throw new Error(`datasource_accounts row ${accountDatasourceId} has no subscription_id`);
  }

  return data.subscription_id as string;
}

export function chunkMePlease<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function uniqueBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function findProductVariantIds(
  skus: string[],
  companyId: string,
): Promise<Map<string, string>> {
  const normalizedSkus = uniqueBy(
    skus.map((sku) => sku.trim()).filter(Boolean),
    (sku) => sku,
  );

  if (!normalizedSkus.length) {
    return new Map();
  }

  const skuMap = new Map<string, string>();
  const skuChunks = chunkMePlease(normalizedSkus, 500);

  for (const skuChunk of skuChunks) {
    const { data, error } = await supabase
      .from("plm_product_variants")
      .select("id, sku")
      .eq("company_id", companyId)
      .in("sku", skuChunk);

    if (error) {
      throw new Error(error.message);
    }

    for (const row of data ?? []) {
      if (row.sku) {
        skuMap.set(row.sku, row.id);
      }
    }
  }

  return skuMap;
}

export async function resolveCustomers(
  customers: crmCustomerSeed[],
): Promise<Map<string, string>> {
  if (!customers.length) {
    return new Map();
  }

  const dedupedCustomers = uniqueBy(
    customers,
    (customer) =>
      `${customer.company_id}:${customer.datasource_id}:${customer.email.toLowerCase()}`,
  );
  const [{ company_id: companyId, datasource_id: dataSourceId }] = dedupedCustomers;
  const emailChunks = chunkMePlease(
    dedupedCustomers.map((customer) => customer.email),
    500,
  );
  const customerIdMap = new Map<string, string>();

  for (const emailChunk of emailChunks) {
    const { data, error } = await supabase
      .from("crm_customers")
      .select("id, email")
      .eq("company_id", companyId)
      .eq("datasource_id", dataSourceId)
      .in("email", emailChunk);

    if (error) {
      throw new Error(error.message);
    }

    for (const row of data ?? []) {
      if (row.email) {
        customerIdMap.set(row.email, row.id);
      }
    }
  }

  const missingCustomers = dedupedCustomers.filter(
    (customer) => !customerIdMap.has(customer.email),
  );

  for (const chunk of chunkMePlease(missingCustomers, 100)) {
    const { data, error } = await supabase
      .from("crm_customers")
      .upsert(chunk, {
        onConflict: "company_id,datasource_id,email",
      })
      .select("id, email");

    if (error) {
      throw new Error(error.message);
    }

    for (const row of data ?? []) {
      if (row.email) {
        customerIdMap.set(row.email, row.id);
      }
    }
  }

  return customerIdMap;
}

export async function upsertOrders(orders: wmsOrder[]): Promise<orderRow[]> {
  if (!orders.length) return [];

  const results: orderRow[] = [];

  for (const chunk of chunkMePlease(orders, 100)) {
    const { data, error } = await supabase
      .from("wms_orders")
      .upsert(chunk, {
        onConflict: "company_id,customer_id,order_number",
      })
      .select("id, customer_id, order_number, external_id");

    if (error) throw new Error(error.message);

    results.push(...(data ?? []));
  }

  return results;
}

export async function upsertOrderLineItems(orderLineItems: wmsOrderLineItem[]) {
  if (!orderLineItems.length) return [];

  const results = [];

  for (const chunk of chunkMePlease(orderLineItems, 100)) {
    const { data, error } = await supabase
      .from("wms_order_lines")
      .upsert(chunk, {
        onConflict: "order_id,product_variant_id",
      })
      .select();

    if (error) throw new Error(error.message);

    results.push(...(data ?? []));
  }

  return results;
}

export function mapOrdersByKey(orders: orderRow[]): Map<string, string> {
  const orderMap = new Map<string, string>();

  for (const order of orders) {
    orderMap.set(`${order.customer_id}:${order.order_number}`, order.id);
    if (order.external_id) {
      orderMap.set(order.external_id, order.id);
    }
  }

  return orderMap;
}

export const generatePostUrl = (
  urlParamComponents: UrlParamComponents,
  actionType: string,
  action: string,
) => {
  const { companyId, integrationName, accountDatasourceId, datasourceId } = urlParamComponents;
  return `${supabaseUrl}/functions/v1/wms_orders/${integrationName}/${actionType}/${companyId}/${accountDatasourceId}/${datasourceId}/${action}`;
};