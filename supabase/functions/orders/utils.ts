// Setup type definitions for built-in Supabase Runtime APIs
// deno-lint-ignore-file no-import-prefix
import { createClient } from "npm:@supabase/supabase-js@2";

export type wmsOrder = {
  customer_id: string;
  company_id: string;
  sales_channel_id: string;
  order_number: string;
  data_source_id: string;
  order_total: number | null;
  paid_amount: string | null;
  due_amount: number | null;
  external_id: string;
  purchase_order_number: string | null;
  start_ship_date: string | null;
  end_ship_date: string | null;
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
  salesChannelId: string;
  integrationId: string;
  integrationName: string;
  dataSourceId: string;
  actionType: string;
  action: string;
};

type orderRow = {
  id: string;
  customer_id: string;
  order_number: string;
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

export async function getCredentials(
  companyId: string,
  integrationId: string,
  credentialId: string,
) {
  const { data, error } = await supabase
    .from("app_company_data_source_subscriptions")
    .select("connection_settings")
    .eq("company_id", companyId)
    .eq("integration_id", integrationId)
    .eq("id", credentialId)
    .single();

  if (error) {
    throw new Error("Failed to get credentials");
  }

  return data.connection_settings;
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
  const {
    companyId,
    integrationId,
    dataSourceId,
    integrationName,
    salesChannelId,
  } = urlParamComponents;
  return `${supabaseUrl}/functions/v1/orders/orders/${integrationName}/${integrationId}/${companyId}/${dataSourceId}/${salesChannelId}/${actionType}/${action}`;
};