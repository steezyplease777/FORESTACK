import {
  chunkMePlease,
  clearStoredBulkOperationId,
  findProductVariantIds,
  generatePostUrl,
  getStoredBulkOperationId,
  mapOrdersByKey,
  resolveCustomers,
  resolveSubscriptionId,
  storeBulkOperationId,
  supabase,
  updateOrderChannelMap,
  upsertOrderLineItems,
  upsertOrders,
  type crmCustomerSeed,
  type orderChannelMapEntry,
  type orderChannelSeed,
  type UrlParamComponents,
  type wmsOrder,
  type wmsOrderLineItem,
} from "../utils.ts";

const SHOPIFY_WEBHOOK_SUBSCRIPTION_MUTATION = `
  mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
      webhookSubscription { id topic uri }
      userErrors { field message }
    }
  }
`;

type WebhookSubscriptionResult = {
  webhookSubscriptionCreate: {
    webhookSubscription: { id: string; topic: string; uri: string } | null;
    userErrors: { field: string[]; message: string }[];
  };
};

async function createWebhookSubscription(
  topic: string,
  callbackUrl: string,
  credentials: unknown,
): Promise<{ id: string; topic: string; uri: string }> {
  const data = await shopifyGraphQLRequest<WebhookSubscriptionResult>(
    credentials,
    SHOPIFY_WEBHOOK_SUBSCRIPTION_MUTATION,
    { topic, webhookSubscription: { callbackUrl } },
  );

  const result = data.webhookSubscriptionCreate;
  if (result.userErrors.length) {
    throw new Error(`Webhook subscribe failed for ${topic}: ${result.userErrors.map((e) => e.message).join("; ")}`);
  }
  if (!result.webhookSubscription) {
    throw new Error(`Webhook subscribe returned null for ${topic}`);
  }
  return result.webhookSubscription;
}

const SHOPIFY_WEBHOOK_SUBSCRIPTION_DELETE_MUTATION = `
  mutation webhookSubscriptionDelete($id: ID!) {
    webhookSubscriptionDelete(id: $id) {
      deletedWebhookSubscriptionId
      userErrors { field message }
    }
  }
`;

type WebhookDeleteResult = {
  webhookSubscriptionDelete: {
    deletedWebhookSubscriptionId: string | null;
    userErrors: { field: string[]; message: string }[];
  };
};

async function deleteWebhookSubscription(
  subscriptionGid: string,
  credentials: unknown,
): Promise<void> {
  const data = await shopifyGraphQLRequest<WebhookDeleteResult>(
    credentials,
    SHOPIFY_WEBHOOK_SUBSCRIPTION_DELETE_MUTATION,
    { id: subscriptionGid },
  );

  const result = data.webhookSubscriptionDelete;
  if (result.userErrors.length) {
    console.error(`Webhook delete failed for ${subscriptionGid}: ${result.userErrors.map((e) => e.message).join("; ")}`);
  }
}

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
  registeredSourceUrl?: string | null;
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
  access_token: string;
  admin_store_name: string;
  admin_api_version: string;
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

type ShopifyCurrentBulkOperationResponse = {
  currentBulkOperation: {
    id: string;
    url?: string | null;
    partialDataUrl?: string | null;
    status?: string | null;
    errorCode?: string | null;
  } | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getCurrentBulkOperation(
  credentials: unknown,
) {
  const data = await shopifyGraphQLRequest<ShopifyCurrentBulkOperationResponse>(
    credentials,
    `
      query getCurrentBulkOperation {
        currentBulkOperation(type: QUERY) {
          id
          status
          errorCode
          url
          partialDataUrl
        }
      }
    `,
    {},
  );

  return data.currentBulkOperation;
}

export type ShopifyBulkOperationWebhook = {
  admin_graphql_api_id?: string;
  adminGraphqlApiId?: string;
  completed_at?: string;
  created_at?: string;
  error_code?: string | null;
  errorCode?: string | null;
  status?: string;
  type?: string;
  url?: string | null;
  partial_data_url?: string | null;
  partialDataUrl?: string | null;
};

type ShopifyBulkOrderRecord = {
  id: string;
  name?: string | null;
  poNumber?: string | null;
  sourceName?: string | null;
  sourceIdentifier?: string | null;
  createdAt?: string | null;
  processedAt?: string | null;
  closedAt?: string | null;
  cancelledAt?: string | null;
  displayFinancialStatus?: string | null;
  displayFulfillmentStatus?: string | null;
  email?: string | null;
  phone?: string | null;
  registeredSourceUrl?: string | null;
  totalShippingPriceSet?: ShopifyMoneyBag;
  totalDiscountsSet?: ShopifyMoneyBag;
  totalOutstandingSet?: ShopifyMoneyBag;
  customer?: ShopifyCustomer | null;
  billingAddress?: ShopifyMailingAddress | null;
  shippingAddress?: ShopifyMailingAddress | null;
  currentTotalPriceSet?: ShopifyMoneyBag;
  netPaymentSet?: ShopifyMoneyBag;
  publication?: {
    id: string;
    name: string;
  } | null;
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
        sourceName
        sourceIdentifier
        createdAt
        processedAt
        closedAt
        cancelledAt
        displayFinancialStatus
        displayFulfillmentStatus
        email
        phone
        publication {
          id
          name
        }
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
        totalShippingPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        totalDiscountsSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        totalOutstandingSet {
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
          countryCodeV2
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

const SHOPIFY_SINGLE_ORDER_QUERY = `
  query fetchOrder($id: ID!) {
    order(id: $id) {
      id
      name
      poNumber
      sourceName
      sourceIdentifier
      createdAt
      processedAt
      closedAt
      cancelledAt
      displayFinancialStatus
      displayFulfillmentStatus
      email
      phone
      publication {
        id
        name
      }
      currentTotalPriceSet {
        shopMoney { amount currencyCode }
      }
      netPaymentSet {
        shopMoney { amount currencyCode }
      }
      totalShippingPriceSet {
        shopMoney { amount currencyCode }
      }
      totalDiscountsSet {
        shopMoney { amount currencyCode }
      }
      totalOutstandingSet {
        shopMoney { amount currencyCode }
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
        countryCodeV2
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
              shopMoney { amount currencyCode }
            }
            originalTotalSet {
              shopMoney { amount currencyCode }
            }
            discountedUnitPriceSet {
              shopMoney { amount currencyCode }
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
`;

type SingleOrderResponse = {
  order: ShopifyBulkOrderRecord & {
    lineItems: {
      edges: { node: ShopifyBulkLineItemRecord }[];
    };
  };
};

async function fetchSingleOrder(
  gid: string,
  credentials: unknown,
): Promise<(ShopifyBulkOrderRecord & { _lineItems: ShopifyBulkLineItemRecord[] }) | null> {
  try {
    const data = await shopifyGraphQLRequest<SingleOrderResponse>(
      credentials,
      SHOPIFY_SINGLE_ORDER_QUERY,
      { id: gid },
    );

    if (!data.order) return null;

    const { lineItems, ...orderFields } = data.order;
    const parsedLineItems = (lineItems?.edges ?? []).map((e) => e.node);

    return { ...orderFields, _lineItems: parsedLineItems };
  } catch (err) {
    console.error(`fetchSingleOrder failed for ${gid}:`, err);
    return null;
  }
}

function parseShopifyCredentials(credentials: unknown) {
  if (!credentials || typeof credentials !== "object") {
    throw new Error("Invalid Shopify credentials");
  }

  const settings = credentials as ShopifyConnectionSettings;
  if (!settings.access_token || !settings.admin_store_name || !settings.admin_api_version) {
    throw new Error("Invalid Shopify credentials");
  }

  const normalizedStoreHost = settings.admin_store_name
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  const requestHost = normalizedStoreHost.includes(".")
    ? normalizedStoreHost
    : `${normalizedStoreHost}.myshopify.com`;
  const requestUrl = `https://${requestHost}/admin/api/${settings.admin_api_version}/graphql.json`;
  const headers : HeadersInit = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": settings.access_token,
  };
  return { requestUrl, headers } as { requestUrl: string, headers: HeadersInit };
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
  subscriptionId: string,
): crmCustomerSeed {
  const address = order.shippingAddress ?? order.billingAddress ?? null;
  const email = (order.customer?.email ?? order.email ?? buildFallbackEmail(order)).trim().toLowerCase();

  return {
    company_id: urlParamComponents.companyId,
    datasource_id: subscriptionId,
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

function buildOrderChannelSeed(order: ShopifyBulkOrderRecord): orderChannelSeed | null {
  const pubName = order.publication?.name?.trim() || null;
  const pubId = order.publication?.id ? extractShopifyId(order.publication.id) : null;

  if (!pubName || !pubId) return null;

  return {
    key: `${pubName}:${pubId}`,
    name: pubName,
    external_id: pubId,
  };
}

function mapShopifyFulfillmentStatus(
  status: string | null | undefined,
): "UNFULFILLED" | "PARTIAL" | "FULFILLED" | null {
  switch (status?.toUpperCase()) {
    case "UNFULFILLED":
      return "UNFULFILLED";
    case "PARTIALLY_FULFILLED":
      return "PARTIAL";
    case "FULFILLED":
      return "FULFILLED";
    default:
      return null;
  }
}

function buildWmsOrder(
  order: ShopifyBulkOrderRecord,
  lineItems: ShopifyBulkLineItemRecord[],
  customerId: string,
  orderChannelId: string | null,
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
    order_channel_id: orderChannelId,
    order_number: buildOrderNumber(order),
    datasource_id: urlParamComponents.datasourceId,
    datasource_raw_data: {
      order,
      lineItems,
    },
    order_total: orderTotal,
    paid_amount: paidAmountNumber === null ? null : String(paidAmountNumber),
    total_shipping: toNumber(order.totalShippingPriceSet?.shopMoney.amount),
    total_discounts: toNumber(order.totalDiscountsSet?.shopMoney.amount),
    total_outstanding: toNumber(order.totalOutstandingSet?.shopMoney.amount),
    external_id: order.id,
    datasource_link: order.registeredSourceUrl ?? null,
    purchase_order_number: order.poNumber ?? null,
    start_ship_window_date: order.processedAt ?? order.createdAt ?? null,
    end_ship_window_date: order.closedAt ?? null,
    fulfillment_status: mapShopifyFulfillmentStatus(order.displayFulfillmentStatus),
    shipping_address: order.shippingAddress
      ? {
          street_1: order.shippingAddress.address1 ?? null,
          street_2: order.shippingAddress.address2 ?? null,
          city: order.shippingAddress.city ?? null,
          province: order.shippingAddress.province ?? null,
          zipcode: order.shippingAddress.zip ?? null,
          country: order.shippingAddress.countryCodeV2 ?? null,
        }
      : null,
  };
}

async function extractBulkResultUrl(
  credentials: unknown,
  payload: unknown,
  urlParamComponents: UrlParamComponents,
): Promise<string> {
  const normalizedPayload = normalizeBulkWebhookPayload(payload);
  if (!normalizedPayload) {
    throw new Error("Invalid Shopify bulk webhook payload");
  }

  const webhook = normalizedPayload as ShopifyBulkOperationWebhook;
  const status = webhook.status?.toLowerCase();

  if (status && status !== "completed") {
    throw new Error(
      `Shopify bulk operation did not complete: ${webhook.status}${(webhook.error_code ?? webhook.errorCode) ? ` (${webhook.error_code ?? webhook.errorCode})` : ""}`,
    );
  }

  const directResultUrl = webhook.url ?? webhook.partial_data_url ?? webhook.partialDataUrl ?? null;
  if (directResultUrl) {
    return directResultUrl;
  }

  const webhookId = webhook.admin_graphql_api_id ?? webhook.adminGraphqlApiId ?? null;
  const storedId = webhookId ? null : await getStoredBulkOperationId(urlParamComponents.datasourceId);
  const bulkOperationId = webhookId ?? storedId;
  console.log("extractBulkResultUrl — webhookId:", webhookId, "storedId:", storedId, "resolved:", bulkOperationId);
  if (!bulkOperationId) {
    let lastStatus: string | null | undefined = null;
    let lastErrorCode: string | null | undefined = null;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const currentBulkOperation = await getCurrentBulkOperation(credentials);
      const currentResultUrl =
        currentBulkOperation?.url ??
        currentBulkOperation?.partialDataUrl ??
        null;

      if (currentResultUrl) {
        return currentResultUrl;
      }

      lastStatus = currentBulkOperation?.status;
      lastErrorCode = currentBulkOperation?.errorCode;
      if (lastStatus?.toLowerCase() === "completed") {
        break;
      }

      await sleep(2000);
    }

    if (lastStatus) {
      throw new Error(
        `Missing Shopify bulk result URL${lastStatus ? ` (current status: ${lastStatus}${lastErrorCode ? `, error: ${lastErrorCode}` : ""})` : ""}`,
      );
    }

    throw new Error("Missing Shopify bulk result URL");
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
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
      { id: bulkOperationId },
    );

    const node = data.node;
    if (!node) {
      throw new Error(`Shopify bulk operation node not found for id: ${bulkOperationId}`);
    }

    const nodeStatus = node.status?.toUpperCase();
    const resultUrl = node.url ?? node.partialDataUrl ?? null;

    if (resultUrl) {
      return resultUrl;
    }

    if (nodeStatus === "FAILED" || nodeStatus === "CANCELED" || nodeStatus === "EXPIRED") {
      throw new Error(
        `Shopify bulk operation ${nodeStatus}${node.errorCode ? ` (${node.errorCode})` : ""}`,
      );
    }

    if (nodeStatus === "COMPLETED" && !resultUrl) {
      throw new Error("Shopify bulk operation completed but returned no result URL");
    }

    console.log(`Bulk operation ${bulkOperationId} status: ${nodeStatus ?? "unknown"}, waiting… (attempt ${attempt + 1}/10)`);
    await sleep(3000);
  }

  throw new Error(`Shopify bulk operation ${bulkOperationId} did not produce a result URL after polling`);
}

function tryParseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function normalizeBulkWebhookPayload(payload: unknown): Record<string, unknown> | null {
  if (!payload) {
    return null;
  }

  if (typeof payload === "string") {
    return tryParseJsonObject(payload);
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const normalized = normalizeBulkWebhookPayload(item);
      if (normalized) {
        return normalized;
      }
    }
    return null;
  }

  if (typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const candidateKeys = [
    "admin_graphql_api_id",
    "adminGraphqlApiId",
    "url",
    "partial_data_url",
    "partialDataUrl",
  ];

  if (candidateKeys.some((key) => key in record)) {
    return record;
  }

  const nestedKeys = ["data", "body", "payload", "webhook"];
  for (const key of nestedKeys) {
    if (key in record) {
      const normalized = normalizeBulkWebhookPayload(record[key]);
      if (normalized) {
        return normalized;
      }
    }
  }

  return record;
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
  subscriptionId: string,
  channelMap: orderChannelMapEntry[],
) {
  if (!batch.length) {
    return {
      syncedOrders: 0,
      syncedOrderLines: 0,
      discoveredChannels: [] as orderChannelMapEntry[],
    };
  }

  const channelLookup = new Map(
    channelMap
      .filter((e) => e.app_order_channel_id)
      .map((e) => [`${e.datasource_order_channel_name.toLowerCase()}:${e.datasource_order_channel_id}`, e.app_order_channel_id]),
  );

  const seedCache = batch.map(({ order, lineItems }) => ({
    order,
    lineItems,
    customerSeed: buildCustomerSeed(order, urlParamComponents, subscriptionId),
    channelSeed: buildOrderChannelSeed(order),
  }));

  const seenChannelKeys = new Set<string>();
  const discoveredChannels: orderChannelMapEntry[] = [];
  for (const { channelSeed } of seedCache) {
    if (!channelSeed) continue;
    const key = channelSeed.key;
    if (!seenChannelKeys.has(key)) {
      seenChannelKeys.add(key);
      discoveredChannels.push({
        datasource_order_channel_name: channelSeed.name,
        datasource_order_channel_id: channelSeed.external_id ?? "",
        app_order_channel_name: "",
        app_order_channel_id: "",
      });
    }
  }

  const customerIdMap = await resolveCustomers(
    seedCache.map((s) => s.customerSeed),
  );

  const mappedOrders = seedCache.flatMap(({ order, lineItems, customerSeed, channelSeed }) => {
    const customerId = customerIdMap.get(customerSeed.email);
    if (!customerId) return [];

    const orderChannelId = channelSeed
      ? channelLookup.get(channelSeed.key.toLowerCase()) ?? null
      : null;

    return [buildWmsOrder(order, lineItems, customerId, orderChannelId, urlParamComponents)];
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
    discoveredChannels,
  };
}

const ORDERS_PER_INVOCATION = 500;
const BATCH_SIZE = 50;

const encoder = new TextEncoder();

async function streamAndProcessOrders(
  stream: ReadableStream<Uint8Array>,
  urlParamComponents: UrlParamComponents,
  subscriptionId: string,
  channelMap: orderChannelMapEntry[],
): Promise<{
  syncedOrders: number;
  syncedOrderLines: number;
  discoveredChannels: orderChannelMapEntry[];
  nextByteOffset: number;
  hasMore: boolean;
}> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let byteOffset = 0;
  let resumeByteOffset = 0;
  let currentOrder: ShopifyBulkOrderRecord | null = null;
  let currentLineItems: ShopifyBulkLineItemRecord[] = [];
  let ordersProcessed = 0;
  let reachedLimit = false;
  let syncedOrders = 0;
  let syncedOrderLines = 0;
  const batch: ShopifyBulkOrderBatchItem[] = [];
  const discoveredChannelsMap = new Map<string, orderChannelMapEntry>();

  const flushBatch = async () => {
    if (!batch.length) return;
    const result = await syncOrderBatch(batch.splice(0, batch.length), urlParamComponents, subscriptionId, channelMap);
    syncedOrders += result.syncedOrders;
    syncedOrderLines += result.syncedOrderLines;
    for (const ch of result.discoveredChannels ?? []) {
      const key = `${ch.datasource_order_channel_name}:${ch.datasource_order_channel_id}`;
      if (!discoveredChannelsMap.has(key)) {
        discoveredChannelsMap.set(key, ch);
      }
    }
  };

  const queueOrder = async () => {
    if (!currentOrder) return;

    if (ordersProcessed >= ORDERS_PER_INVOCATION) {
      reachedLimit = true;
      currentOrder = null;
      currentLineItems = [];
      return;
    }

    batch.push({ order: currentOrder, lineItems: currentLineItems });
    ordersProcessed += 1;
    currentOrder = null;
    currentLineItems = [];

    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
    }
  };

  const processLine = async (rawLine: string) => {
    const lineBytes = encoder.encode(rawLine + "\n").byteLength;
    const lineStartOffset = byteOffset;
    byteOffset += lineBytes;

    const trimmed = rawLine.trim();
    if (!trimmed) return;

    const parsed = JSON.parse(trimmed) as ShopifyBulkOrderRecord | ShopifyBulkLineItemRecord;

    if ("__parentId" in parsed && parsed.__parentId) {
      if (currentOrder && parsed.__parentId === currentOrder.id) {
        currentLineItems.push(parsed);
      }
      return;
    }

    await queueOrder();
    resumeByteOffset = lineStartOffset;
    currentOrder = parsed;
    currentLineItems = [];
  };

  readLoop:
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    textBuffer += decoder.decode(value, { stream: true });
    const lines = textBuffer.split("\n");
    textBuffer = lines.pop() ?? "";

    for (const line of lines) {
      await processLine(line);
      if (reachedLimit) {
        reader.cancel();
        break readLoop;
      }
    }
  }

  if (!reachedLimit && textBuffer.trim()) {
    await processLine(textBuffer);
  }

  if (!reachedLimit) {
    await queueOrder();
  }
  await flushBatch();

  return {
    syncedOrders,
    syncedOrderLines,
    discoveredChannels: Array.from(discoveredChannelsMap.values()),
    nextByteOffset: resumeByteOffset,
    hasMore: reachedLimit,
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

const WEBHOOK_TOPIC_ACTION_MAP: Record<string, string> = {
  ORDERS_CREATE: "create",
  ORDERS_UPDATED: "update",
  ORDERS_CANCELLED: "cancel",
  ORDERS_DELETE: "delete",
};

const WEBHOOK_TOPICS = Object.keys(WEBHOOK_TOPIC_ACTION_MAP);

async function getSubscribedTopics(
  companyId: string,
  datasourceId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .schema("datasources")
    .from("order_datasource_webhooks")
    .select("topic")
    .eq("order_datasource_id", datasourceId)
    .eq("company_id", companyId);

  if (error) throw new Error(`Failed to read webhook subscriptions: ${error.message}`);
  return new Set((data ?? []).map((r) => r.topic).filter(Boolean));
}

async function processWebhookOrder(
  action: string,
  orderData: unknown,
  credentials: unknown,
  urlParamComponents: UrlParamComponents,
) {
  const payload = orderData as Record<string, unknown> | undefined;
  const adminGid = payload?.admin_graphql_api_id as string | undefined;

  if (!adminGid) {
    console.warn(`Webhook [${action}]: no admin_graphql_api_id in payload`);
    return { ok: true, action: "skipped" };
  }

  const subscriptionId = await resolveSubscriptionId(urlParamComponents.accountDatasourceId);

  const { data: dsRow, error: dsErr } = await supabase
    .schema("datasources")
    .from("orders_datasources")
    .select("order_channel_map")
    .eq("id", urlParamComponents.datasourceId)
    .single();

  if (dsErr) throw new Error(`Failed to read order_channel_map: ${dsErr.message}`);
  const channelMap = Array.isArray(dsRow?.order_channel_map)
    ? dsRow.order_channel_map as orderChannelMapEntry[]
    : [];

  const order = await fetchSingleOrder(adminGid, credentials);
  if (!order) {
    console.warn(`Webhook [${action}]: could not fetch order ${adminGid}`);
    return { ok: true, action: "fetch_failed" };
  }

  const lineItems = order._lineItems ?? [];
  const result = await syncOrderBatch(
    [{ order, lineItems }],
    urlParamComponents,
    subscriptionId,
    channelMap,
  );

  console.log(`Webhook [${action}]: synced ${result.syncedOrders} order, ${result.syncedOrderLines} lines`);

  if (result.discoveredChannels?.length) {
    await updateOrderChannelMap(urlParamComponents.datasourceId, result.discoveredChannels);
  }

  return { ok: true, action: "synced", ...result };
}

export const shopify = {
  bulk: {
    initiate: async (_orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
      const preflight = await shopifyGraphQLRequest<{ orders: { edges: { node: { id: string } }[] } }>(
        credentials,
        `{ orders(first: 1) { edges { node { id } } } }`,
        {},
      );
      const orderCount = preflight.orders?.edges?.length ?? 0;
      console.log("Preflight order check:", orderCount, "orders visible");
      if (orderCount === 0) {
        throw new Error(
          "Shopify returned 0 orders — the access token may lack read_orders scope, or the store has no orders",
        );
      }

      const data = await shopifyGraphQLRequest<ShopifyBulkOperationRunQueryResponse>(
        credentials,
        SHOPIFY_BULK_OPERATION_MUTATION,
        { query: SHOPIFY_BULK_ORDERS_QUERY },
      );

      const result = data.bulkOperationRunQuery;
      if (result.userErrors.length) {
        throw new Error(result.userErrors.map((error) => error.message).join("; "));
      }

      if (result.bulkOperation?.id) {
        await storeBulkOperationId(urlParamComponents.datasourceId, result.bulkOperation.id);
      }

      return {
        callbackUrl: generatePostUrl(urlParamComponents, "bulk", "sync"),
        bulkOperation: result.bulkOperation,
      };
    },
    sync: async (orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
      const payload = orderData as Record<string, unknown> | undefined;
      const isContinuation = payload?._continue === true;
      const resultUrl = isContinuation
        ? payload._resultUrl as string
        : await extractBulkResultUrl(credentials, orderData, urlParamComponents);
      const subscriptionId = isContinuation
        ? payload._subscriptionId as string
        : await resolveSubscriptionId(urlParamComponents.accountDatasourceId);
      const startByteOffset = isContinuation
        ? (payload._byteOffset as number) ?? 0
        : 0;

      const { data: dsRow, error: dsErr } = await supabase
        .schema("datasources")
        .from("orders_datasources")
        .select("order_channel_map")
        .eq("id", urlParamComponents.datasourceId)
        .single();

      if (dsErr) throw new Error(`Failed to read order_channel_map: ${dsErr.message}`);
      const channelMap = Array.isArray(dsRow?.order_channel_map)
        ? dsRow.order_channel_map as orderChannelMapEntry[]
        : [];

      const fetchHeaders: HeadersInit = {};
      if (startByteOffset > 0) {
        fetchHeaders["Range"] = `bytes=${startByteOffset}-`;
      }
      const response = await fetch(resultUrl, { method: "GET", headers: fetchHeaders });
      if (!response.ok && response.status !== 206) {
        const errorBody = await response.text();
        throw new Error(`Failed to fetch Shopify bulk result: ${response.status} ${errorBody}`);
      }

      if (!response.body) {
        throw new Error("Shopify bulk result returned no body");
      }

      console.log(`Starting stream from byte offset ${startByteOffset}`);
      const result = await streamAndProcessOrders(
        response.body,
        urlParamComponents,
        subscriptionId,
        channelMap,
      );
      console.log(`Processed ${result.syncedOrders} orders, ${result.syncedOrderLines} lines, hasMore=${result.hasMore}`);

      if (result.discoveredChannels.length) {
        await updateOrderChannelMap(urlParamComponents.datasourceId, result.discoveredChannels);
        console.log(`Updated order_channel_map with ${result.discoveredChannels.length} channel(s)`);
      }

      if (result.hasMore) {
        const absoluteByteOffset = startByteOffset + result.nextByteOffset;
        const continueUrl = generatePostUrl(urlParamComponents, "bulk", "sync");
        console.log(`Invoking continuation at byte offset ${absoluteByteOffset}`);
        const contResp = await fetch(continueUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") ?? ""}`,
          },
          body: JSON.stringify({
            _continue: true,
            _resultUrl: resultUrl,
            _subscriptionId: subscriptionId,
            _byteOffset: absoluteByteOffset,
          }),
        });
        if (!contResp.ok) {
          console.error(`Continuation failed: ${contResp.status} ${await contResp.text()}`);
        }
      } else {
        await clearStoredBulkOperationId(urlParamComponents.datasourceId);
        console.log("Bulk sync complete");
      }

      return result;
    },
  },

  dataMapSync: {
    orderChannel: async (_orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
      const shopifyPublications = await shopifyGraphQLRequest<{
        publications: { edges: { node: { id: string; name: string } }[] };
      }>(
        credentials,
        `{ publications(first: 100) { edges { node { id name } } } }`,
        {},
      );

      const liveChannels = shopifyPublications.publications.edges.map((edge) => ({
        datasource_order_channel_name: edge.node.name.trim(),
        datasource_order_channel_id: extractShopifyId(edge.node.id) ?? edge.node.id,
      }));

      const { data: row, error: readError } = await supabase
        .schema("datasources")
        .from("orders_datasources")
        .select("order_channel_map")
        .eq("id", urlParamComponents.datasourceId)
        .single();

      if (readError) throw new Error(`Failed to read order_channel_map: ${readError.message}`);

      const currentMap = Array.isArray(row?.order_channel_map)
        ? row.order_channel_map as orderChannelMapEntry[]
        : [];

      const existingByKey = new Map(
        currentMap.map((e) => [`${e.datasource_order_channel_name}:${e.datasource_order_channel_id}`, e]),
      );

      const liveKeys = new Set(
        liveChannels.map((ch) => `${ch.datasource_order_channel_name}:${ch.datasource_order_channel_id}`),
      );

      const merged: orderChannelMapEntry[] = liveChannels.map((ch) => {
        const key = `${ch.datasource_order_channel_name}:${ch.datasource_order_channel_id}`;
        const existing = existingByKey.get(key);
        return {
          datasource_order_channel_name: ch.datasource_order_channel_name,
          datasource_order_channel_id: ch.datasource_order_channel_id,
          app_order_channel_name: existing?.app_order_channel_name ?? "",
          app_order_channel_id: existing?.app_order_channel_id ?? "",
        };
      });

      const removed = currentMap.filter(
        (e) => !liveKeys.has(`${e.datasource_order_channel_name}:${e.datasource_order_channel_id}`),
      );

      const { error: writeError } = await supabase
        .schema("datasources")
        .from("orders_datasources")
        .update({ order_channel_map: merged })
        .eq("id", urlParamComponents.datasourceId);

      if (writeError) throw new Error(`Failed to update order_channel_map: ${writeError.message}`);

      return {
        action: "orderChannel",
        synced: merged.length,
        removed: removed.length,
        channels: merged,
      };
    },

    backfillOrderChannel: async (_orderData: unknown, _credentials: unknown, urlParamComponents: UrlParamComponents) => {
      const { data: dsRow, error: dsErr } = await supabase
        .schema("datasources")
        .from("orders_datasources")
        .select("order_channel_map")
        .eq("id", urlParamComponents.datasourceId)
        .single();

      if (dsErr) throw new Error(`Failed to read order_channel_map: ${dsErr.message}`);
      const channelMap = Array.isArray(dsRow?.order_channel_map)
        ? dsRow.order_channel_map as orderChannelMapEntry[]
        : [];

      const channelLookup = new Map(
        channelMap
          .filter((e) => e.app_order_channel_id)
          .map((e) => [`${e.datasource_order_channel_name.toLowerCase()}:${e.datasource_order_channel_id}`, e.app_order_channel_id]),
      );

      if (!channelLookup.size) {
        return { updated: 0, message: "No mapped channels in order_channel_map" };
      }

      const PAGE_SIZE = 500;
      let totalUpdated = 0;
      let lastId: string | null = null;

      while (true) {
        let query = supabase
          .from("wms_orders")
          .select("id, datasource_raw_data")
          .eq("datasource_id", urlParamComponents.datasourceId)
          .is("order_channel_id", null)
          .order("id", { ascending: true })
          .limit(PAGE_SIZE);

        if (lastId) {
          query = query.gt("id", lastId);
        }

        const { data: orders, error: fetchErr } = await query;
        if (fetchErr) throw new Error(`Failed to fetch orders: ${fetchErr.message}`);
        if (!orders?.length) break;

        const updates: { id: string; order_channel_id: string }[] = [];
        for (const row of orders) {
          lastId = row.id;
          const raw = row.datasource_raw_data as { order?: { publication?: { name?: string; id?: string } } } | null;
          const pubName = raw?.order?.publication?.name?.trim();
          const pubId = raw?.order?.publication?.id
            ? extractShopifyId(raw.order.publication.id) ?? ""
            : "";

          if (!pubName) continue;

          const key = `${pubName.toLowerCase()}:${pubId}`;
          const appChannelId = channelLookup.get(key);
          if (appChannelId) {
            updates.push({ id: row.id, order_channel_id: appChannelId });
          }
        }

        if (updates.length) {
          for (const chunk of chunkMePlease(updates, 100)) {
            for (const upd of chunk) {
              const { error } = await supabase
                .from("wms_orders")
                .update({ order_channel_id: upd.order_channel_id })
                .eq("id", upd.id);
              if (error) console.error(`Failed to update order ${upd.id}:`, error.message);
            }
          }
          totalUpdated += updates.length;
        }

        if (orders.length < PAGE_SIZE) break;
      }

      return { updated: totalUpdated };
    },
  },

  webhook: {
    subscribe: async (_orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
      const existing = await getSubscribedTopics(urlParamComponents.companyId, urlParamComponents.datasourceId);
      const missing = WEBHOOK_TOPICS.filter((t) => !existing.has(t));

      if (!missing.length) {
        return { message: "All webhook topics already subscribed", topics: Array.from(existing) };
      }

      const results: { topic: string; id: string; action: string }[] = [];
      for (const topic of missing) {
        const action = WEBHOOK_TOPIC_ACTION_MAP[topic];
        const callbackUrl = generatePostUrl(urlParamComponents, "webhook", action);
        const sub = await createWebhookSubscription(topic, callbackUrl, credentials);
        const { error } = await supabase
          .schema("datasources")
          .from("order_datasource_webhooks")
          .insert({
            company_id: urlParamComponents.companyId,
            order_datasource_id: urlParamComponents.datasourceId,
            external_id: sub.id,
            webhook_url: callbackUrl,
            topic,
          });
        if (error) console.error(`Failed to store webhook sub for ${topic}:`, error.message);
        results.push({ topic, id: sub.id, action });
      }

      return { subscribed: results, alreadyExisted: Array.from(existing) };
    },

    unsubscribe: async (_orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
      const { data: rows, error } = await supabase
        .schema("datasources")
        .from("order_datasource_webhooks")
        .select("id, external_id, topic")
        .eq("order_datasource_id", urlParamComponents.datasourceId)
        .eq("company_id", urlParamComponents.companyId);

      if (error) throw new Error(`Failed to read webhook subscriptions: ${error.message}`);
      if (!rows?.length) {
        return { message: "No webhook subscriptions found", deleted: 0 };
      }

      const deleted: { topic: string | null; externalId: string }[] = [];
      for (const row of rows) {
        if (row.external_id) {
          await deleteWebhookSubscription(row.external_id, credentials);
        }
        const { error: delErr } = await supabase
          .schema("datasources")
          .from("order_datasource_webhooks")
          .delete()
          .eq("id", row.id);
        if (delErr) {
          console.error(`Failed to delete webhook record ${row.id}:`, delErr.message);
        } else {
          deleted.push({ topic: row.topic, externalId: row.external_id });
        }
      }

      return { deleted: deleted.length, details: deleted };
    },

    create: async (orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
      return await processWebhookOrder("create", orderData, credentials, urlParamComponents);
    },

    update: async (orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
      return await processWebhookOrder("update", orderData, credentials, urlParamComponents);
    },

    cancel: async (orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
      return await processWebhookOrder("cancel", orderData, credentials, urlParamComponents);
    },

    delete: async (orderData: unknown, _credentials: unknown, _urlParamComponents: UrlParamComponents) => {
      const payload = orderData as Record<string, unknown> | undefined;
      const adminGid = payload?.admin_graphql_api_id as string | undefined;
      console.log(`Webhook [delete]: order deleted (GID: ${adminGid ?? "unknown"})`);
      return { ok: true, action: "delete_logged" };
    },
  },
};
