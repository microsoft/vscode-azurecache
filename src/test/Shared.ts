import { ParsedRedisResource } from '../../src-shared/ParsedRedisResource';
import { ParsedAccessKeys } from '../../src-shared/ParsedAccessKeys';

const accessKeys: ParsedAccessKeys = {
    primaryKey: 'key1',
    secondaryKey: 'key2',
};

export const createResourceWithKey = (): ParsedRedisResource => ({
    resourceId:
        '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/res-group/providers/Microsoft.Cache/Redis/my-cache',
    subscriptionId: '00000000-0000-0000-0000-000000000000',
    resourceGroup: 'res-group',
    name: 'my-cache',
    hostName: 'my-cache.redis.cache.windows.net',
    port: 6379,
    enableNonSslPort: true,
    sslPort: 6380,
    sku: 'Premium P1',
    location: 'East US',
    redisVersion: '4.0.0',
    provisioningState: 'Succeeded',
    cluster: false,
    shardCount: 0,
    linkedServers: [],
    accessKeys: Promise.resolve(accessKeys),
});

export const createResourceWithKey2 = (): ParsedRedisResource => ({
    resourceId:
        '/subscriptions/11111111-0000-0000-0000-000000000000/resourceGroups/res-group/providers/Microsoft.Cache/Redis/my-cache',
    subscriptionId: '11111111-0000-0000-0000-000000000000',
    resourceGroup: 'res-group',
    name: 'my-cache2',
    hostName: 'mycache2.net',
    enableNonSslPort: true,
    port: 6379,
    sslPort: 6380,
    sku: 'Premium P1',
    location: 'West US',
    redisVersion: 'Unknown',
    provisioningState: 'Unknown',
    cluster: false,
    shardCount: 0,
    linkedServers: [],
    accessKeys: Promise.resolve(accessKeys),
});

export const createResourceWithoutKey = (): ParsedRedisResource => ({
    resourceId:
        '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/res-group/providers/Microsoft.Cache/Redis/my-cache',
    subscriptionId: '00000000-0000-0000-0000-000000000000',
    resourceGroup: 'res-group',
    name: 'my-cache',
    hostName: 'my-cache.redis.cache.windows.net',
    port: 6379,
    enableNonSslPort: true,
    sslPort: 6380,
    sku: 'Premium P1',
    location: 'East US',
    redisVersion: '4.0.0',
    provisioningState: 'Succeeded',
    cluster: false,
    shardCount: 0,
    linkedServers: [],
    accessKeys: Promise.resolve(undefined),
});
