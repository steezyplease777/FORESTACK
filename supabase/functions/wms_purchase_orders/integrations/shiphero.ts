import {
  supabase,
  findSkuId,
  upsertPurchaseOrderLines,
  deleteMissingLines,
  getShipHeroVendorMap,
  generatePostUrl,
  type UrlParamComponents,
  type PurchaseOrderLine,
  type VendorMapEntry,
} from '../utils.ts';

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
};

type ShipHeroGraphQLRequest = {
  query: string;
  variables: Record<string, unknown>;
};

function formatShipHeroCredentials(conn: ShipHeroConnection): ShipHeroCredentials {
  if (!conn.access_token) {
    throw new Error("Missing ShipHero access_token");
  }
  return {
    Authorization: conn.access_token,
    "Content-Type": "application/json",
  };
}

async function sendShipHeroGraphQLRequest(
  headers: ShipHeroCredentials,
  endpoint: ShipHeroGraphQLRequest,
) {
  const response = await fetch("https://public-api.shiphero.com/graphql/", {
    method: "POST",
    headers,
    body: JSON.stringify(endpoint),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ShipHero request failed: ${response.status} ${errorBody}`);
  }

  const body = await response.json();

  if (body.errors?.length) {
    throw new Error(`ShipHero GraphQL errors: ${body.errors.map((e: { message: string }) => e.message).join("; ")}`);
  }

  return body;
}

const shipHeroEndpoints = {
  purchaseOrders: (cursor: string | null) => ({
    query: `query($cursor: String) {
  purchase_orders {
    request_id
    complexity
    data(first: 25, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          legacy_id
          po_number
          account_id
          warehouse_id
          vendor_id
          vendor {
            id
            name
          }
          created_at
          po_date
          date_closed
          packing_note
          fulfillment_status
          po_note
          description
          subtotal
          discount
          total_price
          tax
          shipping_method
          shipping_carrier
          shipping_name
          shipping_price
          tracking_number
          line_items(first: 100) {
            edges {
              node {
                id
                legacy_id
                po_id
                sku
                vendor_sku
                quantity
                quantity_received
                quantity_rejected
                price
                product_name
                fulfillment_status
                vendor_id
              }
            }
          }
        }
      }
    }
  }
}`,
    variables: { cursor: cursor ?? null },
  }),

  vendors: () => ({
    query: `query {
  vendors {
    request_id
    complexity
    data(first: 100) {
      edges {
        node {
          id
          legacy_id
          name
          email
          account_number
        }
      }
    }
  }
}`,
    variables: {},
  }),

  webhookSubscribe: (dataSourceName: string, accountDataSourceName: string, postUrl: string) => ({
    query: `mutation {
  webhook_create(
    data: {
      name: "PO Update"
      url: "${postUrl}"
      shop_name: "${dataSourceName.trim().toLowerCase().replaceAll(" ", "_")}_${accountDataSourceName.trim().toLowerCase().replaceAll(" ", "_")}_forestackPOWebhook"
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
  }),

  webhookDelete: (webhookName: string, shopName: string) => ({
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
  }),
};

type ShipHeroPONode = {
  id: string;
  legacy_id: number;
  po_number: string;
  account_id: string;
  warehouse_id: string;
  vendor_id: string | null;
  vendor: { id: string; name: string } | null;
  created_at: string;
  po_date: string | null;
  date_closed: string | null;
  packing_note: string | null;
  fulfillment_status: string | null;
  po_note: string | null;
  description: string | null;
  subtotal: string | null;
  discount: string | null;
  total_price: string | null;
  tax: string | null;
  shipping_method: string | null;
  shipping_carrier: string | null;
  shipping_name: string | null;
  shipping_price: string | null;
  tracking_number: string | null;
  line_items: {
    edges: Array<{
      node: {
        id: string;
        legacy_id: number;
        po_id: string;
        sku: string;
        vendor_sku: string | null;
        quantity: number;
        quantity_received: number;
        quantity_rejected: number;
        price: string | null;
        product_name: string | null;
        fulfillment_status: string | null;
        vendor_id: string | null;
      };
    }>;
  };
};

type ShipHeroPOWebhookPayload = {
  test?: string;
  purchase_order: {
    id: number;
    po_number: string;
    po_id: number;
    po_uuid: string;
    line_items: Array<{
      id: string;
      quantity: number;
      quantity_received: number;
      sku: string;
      vendor_id: number;
      vendor_uuid: string;
      vendor_account_number: string | null;
      vendor_sku: string;
    }>;
    warehouse_id: number;
    status: string;
    webhook_type: string;
  };
};

function parsePOWebhookPayload(payload: unknown): ShipHeroPOWebhookPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid ShipHero PO Update webhook payload");
  }
  const wh = payload as Partial<ShipHeroPOWebhookPayload>;
  if (!wh.purchase_order || wh.purchase_order.webhook_type !== "PO Update") {
    throw new Error("Invalid ShipHero PO Update webhook payload");
  }
  return wh as ShipHeroPOWebhookPayload;
}

export const shipHero = {
  dataMapSync: {
    vendor: async (credentials: unknown, urlParamComponents: UrlParamComponents) => {
      const { companyId, accountDatasourceId } = urlParamComponents;
      const headers = formatShipHeroCredentials(credentials as ShipHeroConnection);

      const response = await sendShipHeroGraphQLRequest(headers, shipHeroEndpoints.vendors());
      const vendorEdges = response?.data?.vendors?.data?.edges ?? [];
      const shipHeroVendors: { id: string; name: string }[] = vendorEdges.map(
        (e: { node: { id: string; name: string } }) => ({
          id: e.node.id,
          name: e.node.name,
        }),
      );

      const currentMap = await getShipHeroVendorMap(companyId, accountDatasourceId);
      const existingByKey = new Map(
        currentMap.map((e) => [`${e.datasource_vendor_name}:${e.datasource_vendor_id}`, e]),
      );

      const { data: appVendors, error: vendorErr } = await supabase
        .from("erp_vendors")
        .select("id, name")
        .eq("company_id", companyId);

      if (vendorErr) throw new Error(`Failed to read erp_vendors: ${vendorErr.message}`);
      const vendorByName = new Map(
        (appVendors ?? []).map((v: { id: string; name: string }) => [v.name.toLowerCase(), v]),
      );

      const merged: VendorMapEntry[] = shipHeroVendors.map((vendor) => {
        const key = `${vendor.name}:${vendor.id}`;
        const existing = existingByKey.get(key);

        if (existing?.app_vendor_id) {
          return {
            datasource_vendor_name: vendor.name,
            datasource_vendor_id: vendor.id,
            app_vendor_name: existing.app_vendor_name,
            app_vendor_id: existing.app_vendor_id,
          };
        }

        const matched = vendorByName.get(vendor.name.toLowerCase());
        return {
          datasource_vendor_name: vendor.name,
          datasource_vendor_id: vendor.id,
          app_vendor_name: matched?.name ?? "",
          app_vendor_id: matched?.id ?? "",
        };
      });

      const { error: writeErr } = await supabase
        .schema("datasources")
        .from("app_shiphero_connection")
        .update({ vendor_map: merged })
        .eq("company_id", companyId)
        .eq("datasource_account_id", accountDatasourceId);

      if (writeErr) throw new Error(`Failed to update vendor_map: ${writeErr.message}`);

      return { synced: merged.length, vendors: merged };
    },
  },

  bulk: {
    sync: async (credentials: unknown, urlParamComponents: UrlParamComponents) => {
      const { companyId, datasourceId, accountDatasourceId } = urlParamComponents;
      console.log(`[ShipHero PO bulk.sync] Starting for company=${companyId}, datasource=${datasourceId}`);
      const headers = formatShipHeroCredentials(credentials as ShipHeroConnection);

      const vendorMap = await getShipHeroVendorMap(companyId, accountDatasourceId);
      console.log(`[ShipHero PO bulk.sync] Vendor map loaded: ${vendorMap.length} entries`);
      const vendorLookup = new Map(
        vendorMap
          .filter((v) => v.app_vendor_id)
          .map((v) => [v.datasource_vendor_id, v.app_vendor_id]),
      );

      let cursor: string | null = null;
      let hasNextPage = true;
      let posUpserted = 0;
      let linesUpserted = 0;
      let pageNum = 0;

      while (hasNextPage) {
        pageNum++;
        console.log(`[ShipHero PO bulk.sync] Fetching page ${pageNum}, cursor=${cursor}`);
        const response = await sendShipHeroGraphQLRequest(
          headers,
          shipHeroEndpoints.purchaseOrders(cursor),
        );

        const connection = response?.data?.purchase_orders?.data;
        if (!connection) {
          console.error(`[ShipHero PO bulk.sync] No data in response. Full response keys: ${JSON.stringify(Object.keys(response?.data ?? {}))}`);
          throw new Error("ShipHero returned no purchase_orders data");
        }
        const edges: Array<{ node: ShipHeroPONode }> = connection?.edges ?? [];
        const pageInfo = connection?.pageInfo ?? { hasNextPage: false, endCursor: null };
        console.log(`[ShipHero PO bulk.sync] Page ${pageNum}: ${edges.length} POs, hasNext=${pageInfo.hasNextPage}`);

        for (const { node: po } of edges) {
          const vendorId = po.vendor_id
            ? (vendorLookup.get(po.vendor_id) ?? null)
            : null;

          const poPayload = {
            company_id: companyId,
            purchase_order_number: po.po_number ?? String(po.legacy_id),
            status: po.fulfillment_status ?? null,
            total_amount: Number(po.total_price ?? 0),
            vendor_id: vendorId,
            delivered_date: po.date_closed ?? null,
            carrier: po.shipping_carrier ?? null,
            tracking_number: po.tracking_number ?? null,
            notes: po.po_note ?? null,
            datasource_id: datasourceId,
            integration_data: {
              shiphero: {
                id: po.id,
                legacy_id: po.legacy_id,
                warehouse_id: po.warehouse_id,
                po_date: po.po_date,
              },
            },
          };

          const { data: poData, error: poErr } = await supabase
            .from("erp_purchase_orders")
            .upsert(poPayload, { onConflict: "company_id,purchase_order_number" })
            .select("id")
            .single();

          if (poErr) throw new Error(`PO upsert failed: ${poErr.message}`);
          const poId = poData.id as string;
          posUpserted++;

          const lineEdges = po.line_items?.edges ?? [];
          const keptSourceIds: string[] = [];
          const linePayloads: PurchaseOrderLine[] = [];

          for (const { node: line } of lineEdges) {
            const lineSourceId = line.id ?? null;
            if (lineSourceId) keptSourceIds.push(lineSourceId);

            const sku = line.sku ?? null;
            if (!sku) continue;

            const variantId = await findSkuId(sku, companyId);
            if (!variantId) continue;

            linePayloads.push({
              purchase_order_id: poId,
              product_variant_id: variantId,
              sku,
              quantity: Number(line.quantity ?? 0),
              received_quantity: Number(line.quantity_received ?? 0),
              in_transit: 0,
              unit_cost: Number(line.price ?? 0),
              moq_value: null,
              moq_type: null,
              data_source_id: lineSourceId,
            });
          }

          if (linePayloads.length) {
            const { upserted } = await upsertPurchaseOrderLines(linePayloads);
            linesUpserted += upserted;
          }

          await deleteMissingLines(poId, keptSourceIds);
        }

        hasNextPage = pageInfo.hasNextPage;
        cursor = pageInfo.endCursor;
      }

      console.log(`[ShipHero PO bulk.sync] Complete: ${posUpserted} POs, ${linesUpserted} lines across ${pageNum} pages`);
      return { posUpserted, linesUpserted };
    },
  },

  webhook: {
    subscribe: async (_poData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
      const { companyId, datasourceId, accountDatasourceId } = urlParamComponents;
      const headers = formatShipHeroCredentials(credentials as ShipHeroConnection);

      const { data: existing, error: readErr } = await supabase
        .schema("datasources")
        .from("purchase_orders_datasource_webhooks")
        .select("id, external_id")
        .eq("purchase_orders_datasource_id", datasourceId)
        .eq("company_id", companyId);

      if (readErr) throw new Error(`Failed to read PO webhooks: ${readErr.message}`);
      if (existing?.length) {
        return { message: "PO webhook already subscribed", existing };
      }

      const { data: dsRow, error: dsErr } = await supabase
        .schema("datasources")
        .from("purchase_orders_datasources")
        .select("datasource_account_id(name)")
        .eq("id", datasourceId)
        .single();

      if (dsErr) throw new Error(`Failed to read datasource account name: ${dsErr.message}`);
      const accountName = ((dsRow as unknown) as { datasource_account_id?: { name?: string } })?.datasource_account_id?.name ?? accountDatasourceId;

      const postUrl = generatePostUrl(urlParamComponents, "webhook", "update");
      const endpoint = shipHeroEndpoints.webhookSubscribe(datasourceId, accountName, postUrl);
      const response = await sendShipHeroGraphQLRequest(headers, endpoint);

      const webhookResponse = response?.data?.webhook_create;
      const webhook = webhookResponse?.webhook;
      const externalId = webhook?.id ?? null;

      const { error: insertErr } = await supabase
        .schema("datasources")
        .from("purchase_orders_datasource_webhooks")
        .insert({
          company_id: companyId,
          purchase_orders_datasource_id: datasourceId,
          external_id: externalId,
          webhook_url: postUrl,
          topic: "PO Update",
          webhook_metadata: webhookResponse,
        });

      if (insertErr) console.error("Failed to store PO webhook:", insertErr.message);

      return { subscribed: true, externalId, webhookUrl: postUrl, shipheroResponse: webhook };
    },

    unsubscribe: async (_poData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
      const { companyId, datasourceId } = urlParamComponents;
      const headers = formatShipHeroCredentials(credentials as ShipHeroConnection);

      const { data: webhooks, error: readErr } = await supabase
        .schema("datasources")
        .from("purchase_orders_datasource_webhooks")
        .select("id, external_id, topic, webhook_metadata")
        .eq("purchase_orders_datasource_id", datasourceId)
        .eq("company_id", companyId);

      if (readErr) throw new Error(`Failed to read PO webhooks: ${readErr.message}`);
      if (!webhooks?.length) {
        return { message: "No PO webhooks found for this datasource" };
      }

      const deleted: string[] = [];
      const failed: { id: string; error: string }[] = [];

      for (const wh of webhooks) {
        try {
          const shopName = ((wh as unknown) as { webhook_metadata?: { webhook?: { shop_name?: string } } })
            ?.webhook_metadata?.webhook?.shop_name;
          if (!shopName) throw new Error("Missing shop_name in webhook_metadata");
          const endpoint = shipHeroEndpoints.webhookDelete(wh.topic ?? "PO Update", shopName);
          await sendShipHeroGraphQLRequest(headers, endpoint);
          deleted.push(wh.id);
        } catch (err: unknown) {
          failed.push({ id: wh.id, error: (err as Error).message });
        }
      }

      const webhookIds = webhooks.map((w: { id: string }) => w.id);
      const { error: deleteErr } = await supabase
        .schema("datasources")
        .from("purchase_orders_datasource_webhooks")
        .delete()
        .in("id", webhookIds);

      if (deleteErr) console.error("Failed to delete PO webhook records:", deleteErr.message);

      return { unsubscribed: true, deleted, failed };
    },

    update: async (poData: unknown, _credentials: unknown, urlParamComponents: UrlParamComponents) => {
      const { companyId, datasourceId, accountDatasourceId } = urlParamComponents;
      const webhookPayload = parsePOWebhookPayload(poData);
      const po = webhookPayload.purchase_order;

      const vendorMap = await getShipHeroVendorMap(companyId, accountDatasourceId);
      const vendorLookup = new Map(
        vendorMap
          .filter((v) => v.app_vendor_id)
          .map((v) => [v.datasource_vendor_id, v.app_vendor_id]),
      );

      const firstLineVendorUuid = po.line_items?.[0]?.vendor_uuid ?? null;
      const vendorId = firstLineVendorUuid
        ? (vendorLookup.get(firstLineVendorUuid) ?? null)
        : null;

      const poPayload = {
        company_id: companyId,
        purchase_order_number: po.po_number ?? String(po.po_id),
        status: po.status ?? null,
        total_amount: 0,
        vendor_id: vendorId,
        datasource_id: datasourceId,
        integration_data: {
          shiphero: {
            id: po.po_uuid,
            legacy_id: po.id,
            warehouse_id: String(po.warehouse_id),
          },
        },
      };

      const { data: poRow, error: poErr } = await supabase
        .from("erp_purchase_orders")
        .upsert(poPayload, { onConflict: "company_id,purchase_order_number" })
        .select("id")
        .single();

      if (poErr) throw new Error(`PO webhook upsert failed: ${poErr.message}`);
      const poId = poRow.id as string;

      const keptSourceIds: string[] = [];
      const linePayloads: PurchaseOrderLine[] = [];

      for (const line of po.line_items) {
        const lineSourceId = line.id ?? null;
        if (lineSourceId) keptSourceIds.push(lineSourceId);

        const sku = line.sku ?? null;
        if (!sku) continue;

        const variantId = await findSkuId(sku, companyId);
        if (!variantId) continue;

        linePayloads.push({
          purchase_order_id: poId,
          product_variant_id: variantId,
          sku,
          quantity: Number(line.quantity ?? 0),
          received_quantity: Number(line.quantity_received ?? 0),
          in_transit: 0,
          unit_cost: 0,
          moq_value: null,
          moq_type: null,
          data_source_id: lineSourceId,
        });
      }

      let linesUpserted = 0;
      if (linePayloads.length) {
        const { upserted } = await upsertPurchaseOrderLines(linePayloads);
        linesUpserted = upserted;
      }

      await deleteMissingLines(poId, keptSourceIds);

      return { poId, linesUpserted };
    },
  },
};
