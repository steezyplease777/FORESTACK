import { chunkMePlease, cleanupInventoryItems, findSkuIds, findSkuId, supabase, upsertInventoryItems, upsertPartialInventoryItems, type inventoryItem, type partialInventoryItem, type UrlParamComponents, type WarehouseMapEntry, generatePostUrl, getDatasourceMapping } from '../utils.ts';

export type ShipHeroConnection = {
  company_id: string;
  access_token: string | null;
  authorization_code: string | null;
  refresh_token: string | null;
  created_at: string | null;
  datasource_account_id: string;
};

type ShipHeroCredentials = {
  Authorization: string;
  "Content-Type": string;
}

type ShipHeroGraphQLResponse<T> = {
  data?: T;
  errors?: Array<{
    message: string;
  }>;
};

async function shipHeroGraphQLRequest<T>(
  credentials: ShipHeroCredentials,
  shipHeroApi: { query: string, variables: Record<string, unknown> }
) {
  const response = await fetch("https://public-api.shiphero.com/graphql/", {
    method: "POST",
    headers: {
      Authorization: credentials.Authorization,
      "Content-Type": credentials["Content-Type"]
    },
    body: JSON.stringify({
       shipHeroApi,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ShipHero request failed: ${response.status} ${errorBody}`);
  }

  const body = await response.json() as ShipHeroGraphQLResponse<T>;

  if (body.errors?.length) {
    throw new Error(body.errors.map((error) => error.message).join("; "));
  }

  if (!body.data) {
    throw new Error("Shopify request returned no data");
  }

  return body.data;
}

function formatShipHeroCredentials(headerAuth: ShipHeroConnection) {
  const Authorization = headerAuth.access_token;
  if (!Authorization) {
    throw new Error("Missing ShipHero Authorization header");
  }
  return {
    Authorization: Authorization,
    "Content-Type": "application/json",
  } as ShipHeroCredentials;
}

export type SnapshotPayload = {
  snapshot_id: string;
  warehouse_id: string;
  customer_account_id: string;
  snapshot_started_at: string;
  products: Record<
    string,
    {
      sku: string;
      account_id: string;
      vendors?: Record<
        string,
        {
          vendor_id: string;
          vendor_name: string;
          vendor_sku: string;
        }
      >;
      warehouse_products: Record<
        string,
        {
          warehouse_id: string;
          on_hand: number;
          allocated: number;
          backorder: number;
          available: number;
          reserve: number;
          non_sellable: number;
          item_bins: Record<
            string,
            {
              location_id: string;
              location_name: string;
              lot_id: string;
              lot_name: string;
              expiration_date: string;
              sellable: boolean;
              quantity: number;
            }
          >;
        }
      >;
    }
  >;
};

export type inventoryUpdateWebhook = {
  account_id: number;
  account_uuid: string;
  webhook_type: "Inventory Update";
  inventory: Array<{
    sku: string;
    inventory: string;
    backorder_quantity: string;
    on_hand: string;
    virtual: boolean;
    sell_ahead: number;
    qty_in_totes: number;
    reserve: number;
    updated_warehouse: {
      warehouse_id: number;
      warehouse_uuid: string;
      identifier: string;
      inventory: string;
      backorder_quantity: string;
      on_hand: string;
      sell_ahead: number;
      qty_in_totes: number;
      reserve: number;
    };
  }>;
};

export function parseInventoryUpdateWebhook(payload: unknown): inventoryUpdateWebhook {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid ShipHero inventory update webhook payload");
  }

  const webhook = payload as Partial<inventoryUpdateWebhook>;
  if (
    webhook.webhook_type !== "Inventory Update" ||
    !Array.isArray(webhook.inventory)
  ) {
    throw new Error("Invalid ShipHero inventory update webhook payload");
  }

  return webhook as inventoryUpdateWebhook;
}

export function parseSnapshotPayload(payload: unknown): SnapshotPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid ShipHero snapshot payload");
  }

  const snapshot = payload as Partial<SnapshotPayload>;
  if (
    typeof snapshot.warehouse_id !== "string" ||
    !snapshot.products ||
    typeof snapshot.products !== "object"
  ) {
    throw new Error("Invalid ShipHero snapshot payload");
  }

  return snapshot as SnapshotPayload;
}


type ShipHeroGraphQLRequest = {
  query: string;
  variables: Record<string, unknown>;
};

const shipHeroEndpoints = {
  inventoryGenerateSnapshot: (warehouseId: string, postUrl: string) => {
    return { 
      query: `mutation { inventory_generate_snapshot(
           data: {
             warehouse_id: "${warehouseId}"
             notification_email: "charlie@foreall.com"
             post_url: "${postUrl}"
             post_url_pre_check: false
           }
           ) {
             request_id
             complexity
             snapshot {
              snapshot_id
              snapshot_url
            }
          }
      }`,
      variables: {},
    }
  },
  webhookSubscribe: (dataSourceName: string, accountDataSourceName: string, postUrl: string) => {
    return {
      query: `mutation {
  webhook_create(
    data: {
      name: "Inventory Update"
      url: "${postUrl}"
      shop_name: "${dataSourceName.trim().toLowerCase().replaceAll(" ", "_")}_${accountDataSourceName.trim().toLowerCase().replaceAll(" ", "_")}_forestackWebhook"
    }
  ) {
    request_id
    complexity
    webhook {
      id
      name
      url
      shop_name
      enabled
      health
      created_at
      updated_at
      last_enabled_change
      shared_signature_secret
    }
  }
}`,
      variables: {},
    }
  },
  webhookDelete: (webhookName: string, shopName: string) => {
    return {
      query: `mutation {
  webhook_delete(
    data: {
      name: "${webhookName}"
      shop_name: "${shopName}"
    }
  ) {
    request_id
    complexity
  }
}`,
      variables: {},
    }
  }
}

async function sendShipHeroGraphQLRequest(
  headerAuth: ShipHeroCredentials,
  endpoint: ShipHeroGraphQLRequest,
) {
  const response = await fetch("https://public-api.shiphero.com/graphql/", {
    method: "POST",
    headers: headerAuth,
    body: JSON.stringify(endpoint),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ShipHero request failed: ${response.status} ${errorBody}`);
  }

  return await response.json();
}

export const shipHero = {
    bulk: {
      start: async (headerAuth: unknown, urlParamComponents: UrlParamComponents) => {
        const { companyId, datasourceId, accountDatasourceId } = urlParamComponents;
        const postUrl = generatePostUrl(urlParamComponents, "bulk", "sync");
        const credentials = formatShipHeroCredentials(headerAuth as ShipHeroConnection);

        const warehouseMap: WarehouseMapEntry[] =
          (await getDatasourceMapping(companyId, datasourceId, accountDatasourceId, "warehouse")) ?? [];

        const mappedWarehouses = warehouseMap.filter((w) => w.app_inventory_warehouse_id);
        if (!mappedWarehouses.length) {
          throw new Error("No mapped warehouses found in inventory_warehouse_map. Run dataMapSync.warehouse first and map at least one warehouse.");
        }

        const snapshots: { externalWarehouseId: string; appWarehouseId: string; response: unknown }[] = [];
        for (const wh of mappedWarehouses) {
          const endpoint = shipHeroEndpoints.inventoryGenerateSnapshot(wh.datasource_inventory_warehouse_id, postUrl);
          const response = await sendShipHeroGraphQLRequest(credentials, endpoint);
          snapshots.push({
            externalWarehouseId: wh.datasource_inventory_warehouse_id,
            appWarehouseId: wh.app_inventory_warehouse_id,
            response,
          });
        }

        return { snapshots, postUrl };
      },
      sync: async (inventoryData: unknown, urlParamComponents: UrlParamComponents) => {
        const { companyId, datasourceId, accountDatasourceId } = urlParamComponents;
        const snapshotPayload = parseSnapshotPayload(inventoryData);
        const integrationWarehouseId = snapshotPayload.warehouse_id;

        const warehouseMap: WarehouseMapEntry[] =
          (await getDatasourceMapping(companyId, datasourceId, accountDatasourceId, "warehouse")) ?? [];

        const appWarehouseId = warehouseMap.find(
          (w) => w.datasource_inventory_warehouse_id === integrationWarehouseId,
        )?.app_inventory_warehouse_id;

        if (!appWarehouseId) {
          console.warn(`Skipping snapshot for unmapped ShipHero warehouse ${integrationWarehouseId}`);
          return { skipped: true, reason: "unmapped_warehouse", externalWarehouseId: integrationWarehouseId };
        }

        const products = Object.values(snapshotPayload.products);
        const productChunks = chunkMePlease(products, 500);
        const touchedProductVariantIds = new Set<string>();
        const results = [];

        for (const productChunk of productChunks) {
          const skuIdMap = await findSkuIds(
            productChunk.map((product) => product.sku),
            companyId,
          );

          const inventoryItems: inventoryItem[] = productChunk.flatMap((product) => {
            const productVariantId = skuIdMap.get(product.sku);
            const warehouseProduct = product.warehouse_products[integrationWarehouseId];

            if (!productVariantId || !warehouseProduct) {
              return [];
            }

            touchedProductVariantIds.add(productVariantId);

            return [{
              product_variant_id: productVariantId,
              company_id: companyId,
              datasource_id: datasourceId,
              warehouse_id: appWarehouseId,
              on_hand_quantity: warehouseProduct.on_hand,
              allocated_quantity: warehouseProduct.allocated,
              backordered_quantity: warehouseProduct.backorder,
              available_quantity: warehouseProduct.available,
              reserved_quantity: warehouseProduct.reserve,
            }];
          });

          const upsertedInventory = await upsertInventoryItems(inventoryItems);
          results.push(...upsertedInventory);
        }

        if (touchedProductVariantIds.size > 0) {
          await cleanupInventoryItems(
            companyId,
            appWarehouseId,
            Array.from(touchedProductVariantIds),
          );
        }

        return results;
      }
    },
    dataMapSync: {
      warehouse: async (_inventoryData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
        const { companyId, datasourceId, accountDatasourceId } = urlParamComponents;
        const headers = formatShipHeroCredentials(credentials as ShipHeroConnection);

        const response = await sendShipHeroGraphQLRequest(headers, {
          query: `query me {
            me {
              request_id
              complexity
              data {
                account {
                  id
                  warehouses {
                    id
                    legacy_id
                    identifier
                  }
                }
              }
            }
          }`,
          variables: {},
        });

        type WarehouseNode = { id: string; legacy_id: number; identifier: string };
        const warehouses: WarehouseNode[] = response?.data?.me?.data?.account?.warehouses ?? [];

        const liveWarehouses = warehouses.map((w) => ({
          datasource_inventory_warehouse_name: w.identifier,
          datasource_inventory_warehouse_id: w.id,
        }));

        const { data: row, error: readError } = await supabase
          .schema("datasources")
          .from("inventory_datasources")
          .select("inventory_warehouse_map")
          .eq("id", datasourceId)
          .eq("company_id", companyId)
          .eq("datasource_account_id", accountDatasourceId)
          .single();

        if (readError) throw new Error(`Failed to read inventory_warehouse_map: ${readError.message}`);

        const currentMap: WarehouseMapEntry[] = Array.isArray(row?.inventory_warehouse_map)
          ? row.inventory_warehouse_map
          : [];

        const existingByKey = new Map(
          currentMap.map((e) => [
            `${e.datasource_inventory_warehouse_name.toLowerCase()}:${e.datasource_inventory_warehouse_id}`,
            e,
          ]),
        );

        const merged: WarehouseMapEntry[] = liveWarehouses.map((w) => {
          const key = `${w.datasource_inventory_warehouse_name.toLowerCase()}:${w.datasource_inventory_warehouse_id}`;
          const existing = existingByKey.get(key);
          return {
            datasource_inventory_warehouse_name: w.datasource_inventory_warehouse_name,
            datasource_inventory_warehouse_id: w.datasource_inventory_warehouse_id,
            app_inventory_warehouse_name: existing?.app_inventory_warehouse_name ?? "",
            app_inventory_warehouse_id: existing?.app_inventory_warehouse_id ?? "",
          };
        });

        const { error: writeError } = await supabase
          .schema("datasources")
          .from("inventory_datasources")
          .update({ inventory_warehouse_map: merged })
          .eq("id", datasourceId)
          .eq("company_id", companyId)
          .eq("datasource_account_id", accountDatasourceId);

        if (writeError) throw new Error(`Failed to update inventory_warehouse_map: ${writeError.message}`);

        return { warehouses: merged.length, map: merged };
      }
    },
  webhook: {
    subscribe: async (_inventoryData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
      const { companyId, datasourceId, accountDatasourceId } = urlParamComponents;
      const headers = formatShipHeroCredentials(credentials as ShipHeroConnection);

      const { data: existing, error: readErr } = await supabase
        .schema("datasources")
        .from("inventory_datasource_webhooks")
        .select("id, external_id")
        .eq("inventory_datasource_id", datasourceId)
        .eq("company_id", companyId);

      if (readErr) throw new Error(`Failed to read inventory webhooks: ${readErr.message}`);
      if (existing?.length) {
        return { message: "Inventory webhook already subscribed", existing };
      }

      const { data: dsRow, error: dsErr } = await supabase
        .schema("datasources")
        .from("inventory_datasources")
        .select("datasource_account_id(name)")
        .eq("id", datasourceId)
        .single();

      if (dsErr) throw new Error(`Failed to read datasource account name: ${dsErr.message}`);
      const accountName = (dsRow as any)?.datasource_account_id?.name ?? accountDatasourceId;

      const postUrl = generatePostUrl(urlParamComponents, "webhook", "update");
      const endpoint = shipHeroEndpoints.webhookSubscribe(datasourceId, accountName, postUrl);
      const response = await sendShipHeroGraphQLRequest(headers, endpoint);

      const webhookResponse = response?.data?.webhook_create;
      const webhook = webhookResponse?.webhook;
      const externalId = webhook?.id ?? null;

      const { error: insertErr } = await supabase
        .schema("datasources")
        .from("inventory_datasource_webhooks")
        .insert({
          company_id: companyId,
          inventory_datasource_id: datasourceId,
          external_id: externalId,
          webhook_url: postUrl,
          topic: "Inventory Update",
          webhook_metadata: webhookResponse,
        });

      if (insertErr) console.error("Failed to store inventory webhook:", insertErr.message);

      return { subscribed: true, externalId, webhookUrl: postUrl, shipheroResponse: webhook };
    },
    unsubscribe: async (_inventoryData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
      const { companyId, datasourceId } = urlParamComponents;
      const headers = formatShipHeroCredentials(credentials as ShipHeroConnection);

      const { data: webhooks, error: readErr } = await supabase
        .schema("datasources")
        .from("inventory_datasource_webhooks")
        .select("id, external_id, topic, webhook_metadata")
        .eq("inventory_datasource_id", datasourceId)
        .eq("company_id", companyId);

      if (readErr) throw new Error(`Failed to read inventory webhooks: ${readErr.message}`);
      if (!webhooks?.length) {
        return { message: "No inventory webhooks found for this datasource" };
      }

      const deleted: string[] = [];
      const failed: { id: string; error: string }[] = [];

      for (const wh of webhooks) {
        try {
          const shopName = (wh as any).webhook_metadata?.webhook?.shop_name;
          if (!shopName) throw new Error("Missing shop_name in webhook_metadata");
          const endpoint = shipHeroEndpoints.webhookDelete(wh.topic ?? "Inventory Update", shopName);
          await sendShipHeroGraphQLRequest(headers, endpoint);
          deleted.push(wh.id);
        } catch (err: any) {
          failed.push({ id: wh.id, error: err.message });
        }
      }

      const webhookIds = webhooks.map((w: { id: string }) => w.id);
      const { error: deleteErr } = await supabase
        .schema("datasources")
        .from("inventory_datasource_webhooks")
        .delete()
        .in("id", webhookIds);

      if (deleteErr) console.error("Failed to delete inventory webhook records:", deleteErr.message);

      return { unsubscribed: true, deleted, failed };
    },
    update: async (inventoryData: unknown, urlParamComponents: UrlParamComponents) => {
      const { companyId, datasourceId, accountDatasourceId } = urlParamComponents;
      const webhookPayload = parseInventoryUpdateWebhook(inventoryData);
      const products = webhookPayload.inventory;
      const warehouseMap = await getDatasourceMapping(companyId, datasourceId, accountDatasourceId, "warehouse");

      const items: partialInventoryItem[] = [];
      for (const product of products) {
          const productVariantId = await findSkuId(product.sku, companyId);
          const warehouseId = warehouseMap?.find(
            (w: { datasource_inventory_warehouse_id: string }) =>
              w.datasource_inventory_warehouse_id === product.updated_warehouse.warehouse_uuid,
          )?.app_inventory_warehouse_id;

          if (!productVariantId || !warehouseId) continue;

          items.push({
            product_variant_id: productVariantId,
            company_id: companyId,
            datasource_id: datasourceId,
            warehouse_id: warehouseId,
            on_hand_quantity: Number(product.updated_warehouse.on_hand ?? product.on_hand),
            backordered_quantity: Number(product.updated_warehouse.backorder_quantity ?? product.backorder_quantity),
            available_quantity: Number(product.updated_warehouse.inventory ?? product.inventory),
            reserved_quantity: Number(product.updated_warehouse.reserve ?? product.reserve),
          });
      }

      return await upsertPartialInventoryItems(items);
    }
  }
}


