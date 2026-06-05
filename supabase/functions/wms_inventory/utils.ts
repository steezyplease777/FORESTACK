// Setup type definitions for built-in Supabase Runtime APIs
// deno-lint-ignore-file no-import-prefix
import { createClient } from 'npm:@supabase/supabase-js@2';

export type inventoryItem = {
    product_variant_id: string;
    on_hand_quantity: number;
    allocated_quantity: number;
    backordered_quantity: number;
    available_quantity: number;
    datasource_id: string;
    reserved_quantity: number;
    company_id: string;
    warehouse_id: string;
  }

export type partialInventoryItem =
  Pick<inventoryItem, "product_variant_id" | "company_id" | "warehouse_id" | "datasource_id"> &
  Partial<
    Pick<
      inventoryItem,
      | "on_hand_quantity"
      | "allocated_quantity"
      | "backordered_quantity"
      | "available_quantity"
      | "reserved_quantity"
    >
  >;
  
  export type UrlParamComponents = {
    companyId: string;
    datasourceId: string;
    accountDatasourceId: string;
    integrationName: string;
    actionType: string;
    action: string;
  }

  export type WarehouseMapEntry = {
    datasource_inventory_warehouse_name: string;
    datasource_inventory_warehouse_id: string;
    app_inventory_warehouse_name: string;
    app_inventory_warehouse_id: string;
  }

function getEnv(name: string): string {
    const v = Deno.env.get(name);
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function findSkuId(sku: string, companyId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('plm_product_variants')
        .select('id')
        .eq('company_id', companyId)
        .eq('sku', sku)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data.id ?? null;
}

export async function findSkuIds(skus: string[], companyId: string): Promise<Map<string, string>> {
    const uniqueSkus = [...new Set(skus.filter(Boolean))];
    const skuIdMap = new Map<string, string>();

    if (!uniqueSkus.length) {
        return skuIdMap;
    }

    const skuChunks = chunkMePlease(uniqueSkus, 500) as string[][];
    for (const skuChunk of skuChunks) {
        const { data, error } = await supabase
            .from('plm_product_variants')
            .select('id, sku')
            .eq('company_id', companyId)
            .in('sku', skuChunk);

        if (error) {
            throw new Error(error.message);
        }

        for (const item of data ?? []) {
            if (item.sku && !skuIdMap.has(item.sku)) {
                skuIdMap.set(item.sku, item.id);
            }
        }
    }

    return skuIdMap;
}

export async function getDatasourceMapping(companyId: string, datasourceId: string, accountDataSourceId: string, mapField: string) {
  const { data, error } = await supabase
    .schema('datasources')
    .from('inventory_datasources')
    .select(`inventory_${mapField}_map`)
    .eq('company_id', companyId)
    .eq('id', datasourceId)
    .eq('datasource_account_id', accountDataSourceId)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data[`inventory_${mapField}_map`];
}

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

export function chunkMePlease<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];

    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
      
    return chunks;
}

export async function upsertInventoryItems(inventoryItems: inventoryItem[]) {
    if (!inventoryItems.length) return [];

    const chunks = chunkMePlease(inventoryItems, 100);
    const results = [];

    for (const chunk of chunks) {
      const { data, error } = await supabase
        .from("wms_inventory")
        .upsert(chunk, {
          onConflict: "warehouse_id,company_id,product_variant_id",
        })
        .select();
  
      if (error) throw new Error(error.message);
  
      results.push(...data);
    }

    return results;
}

export async function upsertPartialInventoryItems(inventoryItems: partialInventoryItem[]) {
    if (!inventoryItems.length) return [];

    const chunks = chunkMePlease(inventoryItems, 100);
    const results = [];

    for (const chunk of chunks) {
      const { data, error } = await supabase
        .from("wms_inventory")
        .upsert(chunk, {
          onConflict: "warehouse_id,company_id,product_variant_id",
        })
        .select();

      if (error) throw new Error(error.message);

      results.push(...data);
    }

    return results;
}

export async function cleanupInventoryItems(
  companyId: string,
  warehouseId: string,
  productVariantIds: string[],
) {
    const { error } = await supabase.rpc("cleanup_wms_inventory", {
      _company_id: companyId,
      _warehouse_id: warehouseId,
      _product_variant_ids: productVariantIds,
    });

    if (error) throw new Error(error.message);
}

export async function inventoryBulkSync(inventoryItems: inventoryItem[]) {
    if (!inventoryItems.length) return [];
  
    const companyId = inventoryItems[0].company_id;
    const warehouseId = inventoryItems[0].warehouse_id;
    const productVariantIds = inventoryItems.map((item) => item.product_variant_id);
    const results = await upsertInventoryItems(inventoryItems);

    await cleanupInventoryItems(companyId, warehouseId, productVariantIds);
  
    return results;
}

  export const generatePostUrl = ( urlParamComponents: UrlParamComponents, actionType: string, action: string) => {
    const { companyId, integrationName, accountDatasourceId, datasourceId } = urlParamComponents;
    return `https://ocisdaeugliixyhcjnkv.supabase.co/functions/v1/wms_inventory/${integrationName}/${actionType}/${companyId}/${accountDatasourceId}/${datasourceId}/${action}`;
  }