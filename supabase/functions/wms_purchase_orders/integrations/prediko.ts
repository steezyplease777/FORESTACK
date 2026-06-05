import {
  supabase,
  findSkuId,
  upsertPurchaseOrderLines,
  deleteMissingLines,
  getVendorMap,
  type UrlParamComponents,
  type PurchaseOrderLine,
  type VendorMapEntry,
} from '../utils.ts';

type PredikoConnection = {
  access_token: string;
  authorization_code?: string;
  refresh_token?: string;
};

type PredikoPurchaseOrderLine = {
  id: string;
  sku_name: string;
  quantity_confirmed: number;
  received: number;
  in_transit: number;
  unit_cost_supplier: number;
  moq: number | null;
  moq_type: string | null;
};

type PredikoPurchaseOrder = {
  id: string;
  reference: string | null;
  delivery_date: string[];
  order_status: string | null;
  supplier_name: string;
  supplier_currency?: string | null;
  order_parts: PredikoPurchaseOrderLine[];
  cost: number;
  moq_satisfied: number | boolean;
  currency: string;
  payment_at_date: number;
  remaining: number;
  notes: string | null;
  shipping_cost: number;
  tax_cost: number;
  tracking_number: string | null;
  total_cost: number;
  extra_costs: number;
  warehouse_names: string[];
  raw_material_status: string | null;
  address: unknown | null;
  attachments: unknown | null;
  created_at?: string;
  updated_at?: string;
};

function formatPredikoCredentials(credentials: PredikoConnection) {
  return {
    Authorization: `Bearer ${credentials.access_token}`,
  };
}

async function fetchPurchaseOrders(headers: Record<string, string>): Promise<PredikoPurchaseOrder[]> {
  const res = await fetch("https://api.prediko.io/api/v1/orders", { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Prediko API error ${res.status}: ${body}`);
  }
  const json = await res.json();
  return json.data as PredikoPurchaseOrder[];
}

type PredikoSupplier = {
  id: string;
  name: string;
  emails: string[] | null;
  address: Record<string, unknown> | null;
  lead_time: number | null;
  currency: string | null;
};

async function fetchPurchaseOrderLines(
  headers: Record<string, string>,
  purchaseOrderId: string,
): Promise<PredikoPurchaseOrderLine[]> {
  const res = await fetch(`https://api.prediko.io/api/v1/orders/${purchaseOrderId}`, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Prediko API error ${res.status}: ${body}`);
  }
  const json = await res.json();
  return json.order_parts as PredikoPurchaseOrderLine[];
}

async function fetchSuppliers(headers: Record<string, string>): Promise<PredikoSupplier[]> {
  const res = await fetch("https://api.prediko.io/api/v1/suppliers", { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Prediko suppliers API error ${res.status}: ${body}`);
  }
  const json = await res.json();
  return json.data as PredikoSupplier[];
}

export const prediko = {
  dataMapSync: {
    vendor: async (credentials: unknown, urlParamComponents: UrlParamComponents) => {
      const { companyId, accountDatasourceId } = urlParamComponents;
      const headers = formatPredikoCredentials(credentials as PredikoConnection);

      const suppliers = await fetchSuppliers(headers);

      const currentMap = await getVendorMap(companyId, accountDatasourceId);
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

      const merged: VendorMapEntry[] = suppliers.map((supplier) => {
        const key = `${supplier.name}:${supplier.id}`;
        const existing = existingByKey.get(key);

        if (existing?.app_vendor_id) {
          return {
            datasource_vendor_name: supplier.name,
            datasource_vendor_id: supplier.id,
            app_vendor_name: existing.app_vendor_name,
            app_vendor_id: existing.app_vendor_id,
          };
        }

        const matched = vendorByName.get(supplier.name.toLowerCase());
        return {
          datasource_vendor_name: supplier.name,
          datasource_vendor_id: supplier.id,
          app_vendor_name: matched?.name ?? "",
          app_vendor_id: matched?.id ?? "",
        };
      });

      const { error: writeErr } = await supabase
        .schema("datasources")
        .from("app_prediko_connection")
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
      const headers = formatPredikoCredentials(credentials as PredikoConnection);

      const vendorMap = await getVendorMap(companyId, accountDatasourceId);
      const vendorLookup = new Map(
        vendorMap
          .filter((v) => v.app_vendor_id)
          .map((v) => [v.datasource_vendor_name.toLowerCase(), v.app_vendor_id]),
      );

      const orders = await fetchPurchaseOrders(headers);
      let posUpserted = 0;
      let linesUpserted = 0;

      for (const order of orders) {
        const vendorId = vendorLookup.get(order.supplier_name.toLowerCase()) ?? null;

        const poPayload = {
          company_id: companyId,
          purchase_order_number: order.reference ?? order.id,
          status: order.order_status ?? null,
          total_amount: order.total_cost ?? 0,
          vendor_id: vendorId,
          delivered_date: order.delivery_date?.[0] ?? null,
          datasource_id: datasourceId,
          integration_data: { prediko: { id: order.id, reference: order.reference ?? null } },
        };

        const { data: poData, error: poErr } = await supabase
          .from("erp_purchase_orders")
          .upsert(poPayload, { onConflict: "company_id,purchase_order_number" })
          .select("id")
          .single();

        if (poErr) throw new Error(`PO upsert failed: ${poErr.message}`);
        const poId = poData.id as string;
        posUpserted++;

        const lines = await fetchPurchaseOrderLines(headers, order.id);
        const keptSourceIds: string[] = [];
        const linePayloads: PurchaseOrderLine[] = [];

        for (const line of lines) {
          const predikoLineId = line.id ?? null;
          if (predikoLineId) keptSourceIds.push(predikoLineId);

          const sku = line.sku_name ?? null;
          if (!sku) continue;

          const variantId = await findSkuId(sku, companyId);
          if (!variantId) continue;

          linePayloads.push({
            purchase_order_id: poId,
            product_variant_id: variantId,
            sku,
            quantity: Number(line.quantity_confirmed ?? 0),
            received_quantity: Number(line.received ?? 0),
            in_transit: Number(line.in_transit ?? 0),
            unit_cost: Number(line.unit_cost_supplier ?? 0),
            moq_value: line.moq ?? null,
            moq_type: line.moq_type ?? null,
            data_source_id: predikoLineId,
          });
        }

        const { upserted } = await upsertPurchaseOrderLines(linePayloads);
        linesUpserted += upserted;

        await deleteMissingLines(poId, keptSourceIds);
      }

      return { fetched: orders.length, posUpserted, linesUpserted };
    },
  },
};
