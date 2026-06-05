import {
  findProductVariantIds,
  generatePostUrl,
  mapOrdersByKey,
  resolveCustomers,
  upsertOrderLineItems,
  upsertOrders,
  type crmCustomerSeed,
  type UrlParamComponents,
  type wmsOrder,
  type wmsOrderLineItem,
} from "../utils.ts";

export type ShopifyCurrencyCode = string;

export type ShopifyMoneyV2 = {
  amount: string;
  currencyCode: ShopifyCurrencyCode;
};

export type ShopifyMoneyBag = {
  shopMoney: ShopifyMoneyV2;
  presentmentMoney: ShopifyMoneyV2;
};

export type ShopifyPageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
};

export type ShopifyConnectionEdge<T> = {
  cursor: string;
  node: T;
};

export type ShopifyConnection<T> = {
  edges: Array<ShopifyConnectionEdge<T>>;
  nodes: T[];
  pageInfo: ShopifyPageInfo;
};

export type ShopifyCount = {
  count: number;
};

export type ShopifyAttribute = {
  key: string;
  value?: string | null;
};

export type ShopifyMailingAddress = {
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  company?: string | null;
  country?: string | null;
  countryCodeV2?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  formattedArea?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  name?: string | null;
  phone?: string | null;
  province?: string | null;
  provinceCode?: string | null;
  zip?: string | null;
};

export type ShopifyCustomer = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  phone?: string | null;
};

export type ShopifyMetafield = {
  id: string;
  namespace: string;
  key: string;
  value: string;
  type: string;
};

export type ShopifyTaxLine = {
  title: string;
  rate: number;
  priceSet?: ShopifyMoneyBag;
};

export type ShopifyDiscountApplication = {
  allocationMethod?: string;
  targetSelection?: string;
  targetType?: string;
  value?: unknown;
};

export type ShopifyLineItem = {
  id: string;
  sku?: string | null;
  title?: string | null;
  name?: string | null;
  quantity?: number;
  currentQuantity?: number;
  refundableQuantity?: number;
  fulfillableQuantity?: number;
  variantTitle?: string | null;
  vendor?: string | null;
  discountedTotalSet?: ShopifyMoneyBag;
  originalTotalSet?: ShopifyMoneyBag;
  discountedUnitPriceSet?: ShopifyMoneyBag;
  taxLines?: ShopifyTaxLine[];
  customAttributes?: ShopifyAttribute[];
};

export type ShopifyShippingLine = {
  title?: string | null;
  code?: string | null;
  carrierIdentifier?: string | null;
  currentDiscountedPriceSet?: ShopifyMoneyBag;
  discountedPriceSet?: ShopifyMoneyBag;
  originalPriceSet?: ShopifyMoneyBag;
};

export type ShopifyFulfillment = {
  id: string;
  status?: string | null;
  trackingCompany?: string | null;
  trackingInfo?: Array<{
    company?: string | null;
    number?: string | null;
    url?: string | null;
  }>;
};

export type ShopifyTransaction = {
  id: string;
  kind?: string | null;
  status?: string | null;
  gateway?: string | null;
  amountSet?: ShopifyMoneyBag;
  processedAt?: string | null;
};

export type ShopifyRefund = {
  id: string;
  createdAt?: string | null;
  note?: string | null;
  totalRefundedSet?: ShopifyMoneyBag;
};

export type ShopifyOrder = {
  id: string;
  legacyResourceId?: string | null;
  name?: string;
  confirmationNumber?: string | null;
  createdAt?: string;
  updatedAt?: string;
  processedAt?: string;
  closedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  closed?: boolean;
  confirmed?: boolean;
  edited?: boolean;
  fullyPaid?: boolean;
  unpaid?: boolean;
  test?: boolean;
  currencyCode?: ShopifyCurrencyCode;
  presentmentCurrencyCode?: ShopifyCurrencyCode;
  displayFinancialStatus?: string | null;
  displayFulfillmentStatus?: string | null;
  financialStatus?: string | null;
  fulfillmentStatus?: string | null;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
  poNumber?: string | null;
  sourceName?: string | null;
  sourceIdentifier?: string | null;
  tags?: string[];
  customAttributes?: ShopifyAttribute[];
  customerAcceptsMarketing?: boolean;
  taxesIncluded?: boolean;
  taxExempt?: boolean;
  subtotalLineItemsQuantity?: number;
  totalWeight?: string | number | null;
  currentSubtotalPriceSet?: ShopifyMoneyBag;
  currentTotalDiscountsSet?: ShopifyMoneyBag;
  currentTotalTaxSet?: ShopifyMoneyBag;
  currentTotalPriceSet?: ShopifyMoneyBag;
  totalPriceSet?: ShopifyMoneyBag;
  totalShippingPriceSet?: ShopifyMoneyBag;
  totalDiscountsSet?: ShopifyMoneyBag;
  totalTaxSet?: ShopifyMoneyBag;
  subtotalPriceSet?: ShopifyMoneyBag;
  netPaymentSet?: ShopifyMoneyBag;
  customer?: ShopifyCustomer | null;
  billingAddress?: ShopifyMailingAddress | null;
  shippingAddress?: ShopifyMailingAddress | null;
  displayAddress?: ShopifyMailingAddress | null;
  lineItems?: ShopifyConnection<ShopifyLineItem>;
  shippingLines?: ShopifyConnection<ShopifyShippingLine>;
  discountApplications?: ShopifyConnection<ShopifyDiscountApplication>;
  metafields?: ShopifyConnection<ShopifyMetafield>;
  fulfillments?: ShopifyFulfillment[];
  fulfillmentsCount?: ShopifyCount;
  refunds?: ShopifyRefund[];
  transactions?: ShopifyTransaction[];
  transactionsCount?: ShopifyCount;
};

export type ShopifyOrdersQueryResponse = {
  orders: ShopifyConnection<ShopifyOrder>;
};

export type ShopifyOrderQueryResponse = {
  order: ShopifyOrder | null;
};

type ShopifyConnectionSettings = {
  requestUrl?: string;
  "X-Shopify-Access-Token"?: string;
  "X-Shopify-Token"?: string;
  headerAuth?: {
    requestUrl?: string;
    authHeaderKey?: string;
    authHeaderValue?: string;
    requestUrlVariables?: Array<Record<string, string>>;
  };
  headerContentTypes?: string[];
};

type ShopifyGraphQLResponse<T> = {
  data?: T;
  errors?: Array<{
    message: string;
  }>;
};

type ShopifyBulkOperationRunQueryResponse = {
  bulkOperationRunQuery: {
    bulkOperation: {
      id: string;
      status: string;
      url?: string | null;
    } | null;
    userErrors: Array<{
      field?: string[] | null;
      message: string;
    }>;
  };
};

type ShopifyBulkOperationNodeResponse = {
  node: {
    id: string;
    url?: string | null;
    partialDataUrl?: string | null;
    status?: string | null;
    errorCode?: string | null;
  } | null;
};

export type ShopifyBulkOperationWebhook = {
  admin_graphql_api_id?: string;
  completed_at?: string;
  created_at?: string;
  error_code?: string | null;
  status?: string;
  type?: string;
  url?: string | null;
  partial_data_url?: string | null;
};

type ShopifyBulkOrderRecord = {
  id: string;
  name?: string | null;
  poNumber?: string | null;
  createdAt?: string | null;
  processedAt?: string | null;
  closedAt?: string | null;
  displayFinancialStatus?: string | null;
  email?: string | null;
  phone?: string | null;
  customer?: ShopifyCustomer | null;
  billingAddress?: ShopifyMailingAddress | null;
  shippingAddress?: ShopifyMailingAddress | null;
  currentTotalPriceSet?: ShopifyMoneyBag;
  netPaymentSet?: ShopifyMoneyBag;
};

type ShopifyBulkLineItemRecord = {
  __parentId: string;
  id: string;
  sku?: string | null;
  title?: string | null;
  name?: string | null;
  quantity?: number;
  currentQuantity?: number;
  discountedTotalSet?: ShopifyMoneyBag;
  originalTotalSet?: ShopifyMoneyBag;
  discountedUnitPriceSet?: ShopifyMoneyBag;
  variant?: {
    barcode?: string | null;
    sku?: string | null;
  } | null;
};

type ShopifyBulkOrderBatchItem = {
  order: ShopifyBulkOrderRecord;
  lineItems: ShopifyBulkLineItemRecord[];
};

const SHOPIFY_BULK_ORDERS_QUERY = `{
  orders {
    edges {
      node {
        id
        name
        poNumber
        createdAt
        processedAt
        closedAt
        displayFinancialStatus
        email
        phone
        currentTotalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        netPaymentSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        customer {
          id
          email
          firstName
          lastName
          displayName
          phone
        }
        billingAddress {
          address1
          address2
          city
          country
          firstName
          lastName
          phone
          province
          zip
        }
        shippingAddress {
          address1
          address2
          city
          country
          firstName
          lastName
          phone
          province
          zip
        }
        lineItems(first: 250) {
          edges {
            node {
              id
              sku
              title
              name
              quantity
              currentQuantity
              discountedTotalSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              originalTotalSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              discountedUnitPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              variant {
                sku
                barcode
              }
            }
          }
        }
      }
    }
  }
}`;

function parseShopifyCredentials(credentials: unknown) {
  if (!credentials || typeof credentials !== "object") {
    throw new Error("Invalid Shopify credentials");
  }

  const settings = credentials as ShopifyConnectionSettings;
  const flatRequestUrl = settings.requestUrl;
  const flatAccessToken = settings["X-Shopify-Access-Token"] ??
    settings["X-Shopify-Token"];
  if (flatRequestUrl && flatAccessToken) {
    return {
      requestUrl: flatRequestUrl,
      headers: {
        "Content-Type": settings.headerContentTypes?.[0] ?? "application/json",
        "X-Shopify-Access-Token": flatAccessToken,
      } satisfies HeadersInit,
    };
  }

  const headerAuth = settings.headerAuth;

  if (
    !headerAuth?.requestUrl ||
    !headerAuth.authHeaderKey ||
    !headerAuth.authHeaderValue
  ) {
    throw new Error("Invalid Shopify credentials");
  }

  const replacements = Object.assign(
    {},
    ...(headerAuth.requestUrlVariables ?? []),
  ) as Record<string, string>;
  let requestUrl = headerAuth.requestUrl;
  for (const [key, value] of Object.entries(replacements)) {
    requestUrl = requestUrl.replaceAll(`{${key}}`, value);
  }

  return {
    requestUrl,
    headers: {
      "Content-Type": settings.headerContentTypes?.[0] ?? "application/json",
      [headerAuth.authHeaderKey]: headerAuth.authHeaderValue,
    } satisfies HeadersInit,
  };
}

async function shopifyGraphQLRequest<T>(
  credentials: unknown,
  query: string,
  variables: Record<string, unknown>,
) {
  const { requestUrl, headers } = parseShopifyCredentials(credentials);
  const response = await fetch(requestUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Shopify request failed: ${response.status} ${errorBody}`);
  }

  const body = await response.json() as ShopifyGraphQLResponse<T>;

  if (body.errors?.length) {
    throw new Error(body.errors.map((error) => error.message).join("; "));
  }

  if (!body.data) {
    throw new Error("Shopify request returned no data");
  }

  return body.data;
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractShopifyId(value: string | null | undefined): string | null {
  if (!value) return null;
  const parts = value.split("/");
  return parts[parts.length - 1] ?? null;
}

function buildFallbackEmail(order: ShopifyBulkOrderRecord): string {
  const stableId = extractShopifyId(order.customer?.id ?? order.id) ?? crypto.randomUUID();
  return `shopify-${stableId}@placeholder.foreall.local`;
}

function buildCustomerSeed(
  order: ShopifyBulkOrderRecord,
  urlParamComponents: UrlParamComponents,
): crmCustomerSeed {
  const address = order.shippingAddress ?? order.billingAddress ?? null;
  const email = (order.customer?.email ?? order.email ?? buildFallbackEmail(order)).trim().toLowerCase();

  return {
    company_id: urlParamComponents.companyId,
    datasource_id: urlParamComponents.dataSourceId,
    email,
    first_name: order.customer?.firstName ?? address?.firstName ?? "Shopify",
    last_name: order.customer?.lastName ?? address?.lastName ?? null,
    phone: order.customer?.phone ?? order.phone ?? address?.phone ?? "",
    address: [address?.address1, address?.address2].filter(Boolean).join(", "),
    city: address?.city ?? "",
    state: address?.province ?? "",
    zip: address?.zip ?? "",
    country: address?.country ?? "",
    external_id: order.customer?.id ?? null,
  };
}

function buildOrderNumber(order: ShopifyBulkOrderRecord): string {
  return order.name?.trim() || extractShopifyId(order.id) || crypto.randomUUID();
}

function buildWmsOrder(
  order: ShopifyBulkOrderRecord,
  customerId: string,
  urlParamComponents: UrlParamComponents,
): wmsOrder {
  const orderTotal = toNumber(order.currentTotalPriceSet?.shopMoney.amount);
  const explicitPaid = toNumber(order.netPaymentSet?.shopMoney.amount);
  const paidAmountNumber = explicitPaid ?? (
    order.displayFinancialStatus?.toLowerCase() === "paid" ? orderTotal : null
  );
  const dueAmount = orderTotal !== null
    ? Math.max(orderTotal - (paidAmountNumber ?? 0), 0)
    : null;

  return {
    customer_id: customerId,
    company_id: urlParamComponents.companyId,
    sales_channel_id: urlParamComponents.salesChannelId,
    order_number: buildOrderNumber(order),
    data_source_id: urlParamComponents.dataSourceId,
    order_total: orderTotal,
    paid_amount: paidAmountNumber === null ? null : String(paidAmountNumber),
    due_amount: dueAmount,
    external_id: order.id,
    purchase_order_number: order.poNumber ?? null,
    start_ship_date: order.processedAt ?? order.createdAt ?? null,
    end_ship_date: order.closedAt ?? null,
  };
}

async function extractBulkResultUrl(
  credentials: unknown,
  payload: unknown,
): Promise<string> {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid Shopify bulk webhook payload");
  }

  const webhook = payload as ShopifyBulkOperationWebhook;
  const status = webhook.status?.toLowerCase();

  if (status && status !== "completed") {
    throw new Error(
      `Shopify bulk operation did not complete: ${webhook.status}${webhook.error_code ? ` (${webhook.error_code})` : ""}`,
    );
  }

  const directResultUrl = webhook.url ?? webhook.partial_data_url ?? null;
  if (directResultUrl) {
    return directResultUrl;
  }

  if (!webhook.admin_graphql_api_id) {
    throw new Error("Missing Shopify bulk result URL");
  }

  const data = await shopifyGraphQLRequest<ShopifyBulkOperationNodeResponse>(
    credentials,
    `
      query getBulkOperationResult($id: ID!) {
        node(id: $id) {
          ... on BulkOperation {
            id
            status
            errorCode
            url
            partialDataUrl
          }
        }
      }
    `,
    { id: webhook.admin_graphql_api_id },
  );

  const node = data.node;
  if (!node) {
    throw new Error("Shopify bulk operation lookup returned no node");
  }

  const resultUrl = node.url ?? node.partialDataUrl ?? null;
  if (!resultUrl) {
    throw new Error("Missing Shopify bulk result URL");
  }

  return resultUrl;
}

function buildOrderLookupKey(order: Pick<wmsOrder, "customer_id" | "order_number" | "external_id">) {
  return order.external_id || `${order.customer_id}:${order.order_number}`;
}

function buildOrderLineItems(
  orders: wmsOrder[],
  lineItemsByOrderId: Map<string, ShopifyBulkLineItemRecord[]>,
  orderIdMap: Map<string, string>,
  variantIdMap: Map<string, string>,
  companyId: string,
): wmsOrderLineItem[] {
  const aggregatedItems = new Map<string, wmsOrderLineItem>();

  for (const order of orders) {
    const sourceOrderId = order.external_id;
    const dbOrderId = orderIdMap.get(buildOrderLookupKey(order));

    if (!sourceOrderId || !dbOrderId) {
      continue;
    }

    const lineItems = lineItemsByOrderId.get(sourceOrderId) ?? [];
    for (const lineItem of lineItems) {
      const sku = (lineItem.sku ?? lineItem.variant?.sku ?? "").trim();
      const productVariantId = variantIdMap.get(sku);
      const quantity = toNumber(lineItem.currentQuantity ?? lineItem.quantity) ?? 0;

      if (!productVariantId || quantity <= 0) {
        continue;
      }

      const lineTotal = toNumber(lineItem.discountedTotalSet?.shopMoney.amount) ??
        toNumber(lineItem.originalTotalSet?.shopMoney.amount) ??
        0;
      const unitPrice = toNumber(lineItem.discountedUnitPriceSet?.shopMoney.amount) ??
        (quantity > 0 ? lineTotal / quantity : 0);
      const aggregateKey = `${dbOrderId}:${productVariantId}`;
      const existing = aggregatedItems.get(aggregateKey);

      if (existing) {
        existing.quantity += quantity;
        existing.line_total += lineTotal;
        existing.price = existing.quantity > 0 ? existing.line_total / existing.quantity : existing.price;
        continue;
      }

      aggregatedItems.set(aggregateKey, {
        order_id: dbOrderId,
        company_id: companyId,
        product_variant_id: productVariantId,
        quantity,
        price: unitPrice,
        line_total: lineTotal,
        sku: sku || null,
        upc: lineItem.variant?.barcode ?? null,
        product_title: lineItem.name ?? lineItem.title ?? null,
        external_id: lineItem.id,
      });
    }
  }

  return Array.from(aggregatedItems.values());
}

async function syncOrderBatch(
  batch: ShopifyBulkOrderBatchItem[],
  urlParamComponents: UrlParamComponents,
) {
  if (!batch.length) {
    return {
      syncedOrders: 0,
      syncedOrderLines: 0,
    };
  }

  const customerSeeds = batch.map(({ order }) =>
    buildCustomerSeed(order, urlParamComponents)
  );
  const customerIdMap = await resolveCustomers(customerSeeds);
  const mappedOrders = batch.flatMap(({ order }) => {
    const customerSeed = buildCustomerSeed(order, urlParamComponents);
    const customerId = customerIdMap.get(customerSeed.email);
    if (!customerId) {
      return [];
    }

    return [buildWmsOrder(order, customerId, urlParamComponents)];
  });

  if (!mappedOrders.length) {
    return {
      syncedOrders: 0,
      syncedOrderLines: 0,
    };
  }

  const upsertedOrders = await upsertOrders(mappedOrders);
  const orderIdMap = mapOrdersByKey(upsertedOrders);
  const lineItemsByOrderId = new Map<string, ShopifyBulkLineItemRecord[]>(
    batch.map(({ order, lineItems }) => [order.id, lineItems]),
  );
  const variantIdMap = await findProductVariantIds(
    Array.from(
      new Set(
        batch.flatMap(({ lineItems }) =>
          lineItems
            .map((item) => (item.sku ?? item.variant?.sku ?? "").trim())
            .filter(Boolean)
        ),
      ),
    ),
    urlParamComponents.companyId,
  );
  const mappedOrderLineItems = buildOrderLineItems(
    mappedOrders,
    lineItemsByOrderId,
    orderIdMap,
    variantIdMap,
    urlParamComponents.companyId,
  );
  const upsertedOrderLines = await upsertOrderLineItems(mappedOrderLineItems);

  return {
    syncedOrders: upsertedOrders.length,
    syncedOrderLines: upsertedOrderLines.length,
  };
}

async function processBulkJsonlStream(
  stream: ReadableStream<Uint8Array>,
  urlParamComponents: UrlParamComponents,
) {
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  const batchSize = 50;
  const batch: ShopifyBulkOrderBatchItem[] = [];
  let buffer = "";
  let currentOrder: ShopifyBulkOrderRecord | null = null;
  let currentLineItems: ShopifyBulkLineItemRecord[] = [];
  let syncedOrders = 0;
  let syncedOrderLines = 0;

  const flushBatch = async () => {
    if (!batch.length) return;

    const result = await syncOrderBatch(batch.splice(0, batch.length), urlParamComponents);
    syncedOrders += result.syncedOrders;
    syncedOrderLines += result.syncedOrderLines;
  };

  const queueCurrentOrder = async () => {
    if (!currentOrder) return;

    batch.push({
      order: currentOrder,
      lineItems: currentLineItems,
    });
    currentOrder = null;
    currentLineItems = [];

    if (batch.length >= batchSize) {
      await flushBatch();
    }
  };

  const handleLine = async (line: string) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    const parsed = JSON.parse(trimmedLine) as ShopifyBulkOrderRecord | ShopifyBulkLineItemRecord;
    if ("__parentId" in parsed && parsed.__parentId) {
      if (currentOrder && parsed.__parentId === currentOrder.id) {
        currentLineItems.push(parsed);
      }
      return;
    }

    await queueCurrentOrder();
    currentOrder = parsed;
    currentLineItems = [];
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      await handleLine(line);
    }
  }

  if (buffer.trim()) {
    await handleLine(buffer);
  }

  await queueCurrentOrder();
  await flushBatch();

  return {
    syncedOrders,
    syncedOrderLines,
  };
}

const SHOPIFY_BULK_OPERATION_MUTATION = `
  mutation bulkOperationRunQuery($query: String!) {
    bulkOperationRunQuery(query: $query) {
      bulkOperation {
        id
        status
        url
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const shopify = {
  bulk: {
    initiate: async (_orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
      const data = await shopifyGraphQLRequest<ShopifyBulkOperationRunQueryResponse>(
        credentials,
        SHOPIFY_BULK_OPERATION_MUTATION,
        { query: SHOPIFY_BULK_ORDERS_QUERY },
      );

      const result = data.bulkOperationRunQuery;
      if (result.userErrors.length) {
        throw new Error(result.userErrors.map((error) => error.message).join("; "));
      }

      return {
        callbackUrl: generatePostUrl(urlParamComponents, "bulk", "sync"),
        bulkOperation: result.bulkOperation,
      };
    },
    sync: async (orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
      const resultUrl = await extractBulkResultUrl(credentials, orderData);
      const response = await fetch(resultUrl, {
        method: "GET",
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to fetch Shopify bulk result: ${response.status} ${errorBody}`);
      }

      if (!response.body) {
        throw new Error("Shopify bulk result returned no body");
      }

      return await processBulkJsonlStream(response.body, urlParamComponents);
    },
  },
};