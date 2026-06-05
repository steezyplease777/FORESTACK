import { shopify } from './integrations/shopify.ts';
import { type UrlParamComponents } from './utils.ts';


export const integrations = {
    shopify: {
        bulk: {
            initiate: async (orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
                return await shopify.bulk.initiate(orderData, credentials, urlParamComponents);
            },
            sync: async (orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
                return await shopify.bulk.sync(orderData, credentials, urlParamComponents);
            }
        },
        data_map_sync: {
            order_channel: async (orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
                return await shopify.dataMapSync.orderChannel(orderData, credentials, urlParamComponents);
            },
            backfill_order_channel: async (orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
                return await shopify.dataMapSync.backfillOrderChannel(orderData, credentials, urlParamComponents);
            }
        },
        webhook: {
            subscribe: async (orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
                return await shopify.webhook.subscribe(orderData, credentials, urlParamComponents);
            },
            unsubscribe: async (orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
                return await shopify.webhook.unsubscribe(orderData, credentials, urlParamComponents);
            },
            create: async (orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
                return await shopify.webhook.create(orderData, credentials, urlParamComponents);
            },
            update: async (orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
                return await shopify.webhook.update(orderData, credentials, urlParamComponents);
            },
            cancel: async (orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
                return await shopify.webhook.cancel(orderData, credentials, urlParamComponents);
            },
            delete: async (orderData: unknown, credentials: unknown, urlParamComponents: UrlParamComponents) => {
                return await shopify.webhook.delete(orderData, credentials, urlParamComponents);
            }
        }
    }
}
