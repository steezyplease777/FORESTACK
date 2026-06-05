import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { getEnv } from "./utils.ts";

type IntegrationObjects = {
  prediko: {
    purchaseOrderLine: {
      id: string;
      sku_name: string;
      quantity_confirmed: number;
      received: number;
      in_transit: number;
      unit_cost_supplier: number;
      moq: number;
      moq_type: string;
    };
    purchaseOrder: {
      id: string;
      reference: string | null;
      delivery_date: string[];
      order_status: string | null;
      supplier_name: string;
      supplier_currency?: string | null;
      order_parts: IntegrationObjects["prediko"]["purchaseOrderLine"][];
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
  };
};

export type PurchaseOrder = IntegrationObjects["prediko"]["purchaseOrder"];
export type PurchaseOrderLine = IntegrationObjects["prediko"]["purchaseOrderLine"];

function getSupabaseServiceClient() {
  return createClient(getEnv("SUPABASE_URL"), getEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
}

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const token = getEnv("PREDIKO_API_KEY");
  const res = await fetch("https://api.prediko.io/api/v1/orders", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error;

  const body = await res.json();
  return body.data as PurchaseOrder[];
}

export async function getPurchaseOrderLines(purchaseOrderId): Promise<PurchaseOrderLine[]> {
  const token = getEnv("PREDIKO_API_KEY");
  const res = await fetch(`https://api.prediko.io/api/v1/orders/${purchaseOrderId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error;

  const body = await res.json();
  return body['order_parts'] as PurchaseOrderLine[];
}

async function mapErpVendorIdByName(vendorName: string) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("erp_vendors")
    .select('id')
    .eq("name", vendorName)
    .maybeSingle();

  if (error) throw error;
  return data?.id;
}

export async function mapPurchaseOrderToDb(row: PurchaseOrder) {
  const companyId = '530ca681-c047-4d30-8cbf-4ca73a571963';
  const vendorName = row.supplier_name;
  const vendorId = await mapErpVendorIdByName(vendorName);
  const purchaseOrderId = row.id;
  const lines: PurchaseOrderLine[] = await getPurchaseOrderLines(purchaseOrderId);

  return {
    purchaseOrder: {
    company_id: companyId,
    purchase_order_number: row.reference,
    status: row.order_status ?? null,
    total_amount: row.total_cost ?? null,
    vendor_id: vendorId || '03045940-f0bc-4b1c-b154-bbbc57ea8e23',
    delivered_date: row.delivery_date?.[0] ?? null,
    data_source: '39480e44-5e09-4c9e-9a0e-9d393c4735f4',
    data_source_id: row.id,
    integration_data: { prediko: { id: row.id, reference: row.reference ?? null } }
    } as Record<string, unknown>,
    lines
  }
}