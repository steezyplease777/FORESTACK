import { shipHero } from './integrations/shiphero.ts';
import { type UrlParamComponents } from './utils.ts';

export const integrations = {
    shiphero: {
        bulk: {
            initiate: async (_inventoryData: unknown, headerAuth: unknown, urlParamComponents: UrlParamComponents) => {
                return await shipHero.bulk.start(headerAuth, urlParamComponents);
            },
            sync: async (inventoryData: unknown, _headerAuth: unknown, urlParamComponents: UrlParamComponents) => {
                const snapshotUrl =
                  (inventoryData as { data?: { inventory_generate_snapshot?: { snapshot?: { snapshot_url?: string } } }; snapshot?: { snapshot_url?: string }; snapshot_url?: string })?.data?.inventory_generate_snapshot?.snapshot?.snapshot_url ??
                  (inventoryData as { snapshot?: { snapshot_url?: string } })?.snapshot?.snapshot_url ??
                  (inventoryData as { snapshot_url?: string })?.snapshot_url ??
                  null;

                if (!snapshotUrl) {
                    throw new Error('Missing snapshot_url in integration sync payload');
                }

                const response = await fetch(snapshotUrl, { method: 'GET' });
                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`Failed to fetch ShipHero snapshot: ${response.status} ${errorBody}`);
                }
                const snapshotBody = await response.json();
                return await shipHero.bulk.sync(snapshotBody, urlParamComponents);
            }
        },
        data_map_sync: {
            warehouse: async (inventoryData: unknown, headerAuth: unknown, urlParamComponents: UrlParamComponents) => {
                return await shipHero.dataMapSync.warehouse(inventoryData, headerAuth, urlParamComponents);
            }
        },
        webhook: {
            subscribe: async (inventoryData: unknown, headerAuth: unknown, urlParamComponents: UrlParamComponents) => {
                return await shipHero.webhook.subscribe(inventoryData, headerAuth, urlParamComponents);
            },
            unsubscribe: async (inventoryData: unknown, headerAuth: unknown, urlParamComponents: UrlParamComponents) => {
                return await shipHero.webhook.unsubscribe(inventoryData, headerAuth, urlParamComponents);
            },
            update: async (inventoryData: unknown, _headerAuth: unknown, urlParamComponents: UrlParamComponents) => {
                return await shipHero.webhook.update(inventoryData, urlParamComponents);
            }
        }
    }
}
