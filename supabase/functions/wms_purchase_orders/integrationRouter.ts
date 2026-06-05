import { prediko } from './integrations/prediko.ts';
import { shipHero } from './integrations/shiphero.ts';
import { type UrlParamComponents } from './utils.ts';

export const integrations = {
  prediko: {
    bulk: {
      sync: async (_poData: unknown, headerAuth: unknown, urlParamComponents: UrlParamComponents) => {
        return await prediko.bulk.sync(headerAuth, urlParamComponents);
      },
    },
    data_map_sync: {
      vendor: async (_poData: unknown, headerAuth: unknown, urlParamComponents: UrlParamComponents) => {
        return await prediko.dataMapSync.vendor(headerAuth, urlParamComponents);
      },
    },
  },
  shiphero: {
    bulk: {
      sync: async (_poData: unknown, headerAuth: unknown, urlParamComponents: UrlParamComponents) => {
        return await shipHero.bulk.sync(headerAuth, urlParamComponents);
      },
    },
    data_map_sync: {
      vendor: async (_poData: unknown, headerAuth: unknown, urlParamComponents: UrlParamComponents) => {
        return await shipHero.dataMapSync.vendor(headerAuth, urlParamComponents);
      },
    },
    webhook: {
      subscribe: async (poData: unknown, headerAuth: unknown, urlParamComponents: UrlParamComponents) => {
        return await shipHero.webhook.subscribe(poData, headerAuth, urlParamComponents);
      },
      unsubscribe: async (poData: unknown, headerAuth: unknown, urlParamComponents: UrlParamComponents) => {
        return await shipHero.webhook.unsubscribe(poData, headerAuth, urlParamComponents);
      },
      update: async (poData: unknown, headerAuth: unknown, urlParamComponents: UrlParamComponents) => {
        return await shipHero.webhook.update(poData, headerAuth, urlParamComponents);
      },
    },
  },
}
