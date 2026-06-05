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
        }
    }
}
        