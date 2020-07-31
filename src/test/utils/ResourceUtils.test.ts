// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as assert from 'assert';
import { ParsedRedisResource } from '../../../src-shared/ParsedRedisResource';
import { getConnectionString } from '../../utils/ResourceUtils';

describe('ResourceUtils', () => {
    describe('getConnectionString', () => {
        it('should properly return connection string for resource with access key', async () => {
            const parsedRedisResource: ParsedRedisResource = {
                resourceId:
                    '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/res-group/providers/Microsoft.Cache/Redis/my-cache',
                subscriptionId: '00000000-0000-0000-0000-000000000000',
                resourceGroup: 'res-group',
                name: 'my-cache',
                hostName: 'my-cache.redis.cache.windows.net',
                port: 6379,
                enableNonSslPort: true,
                sslPort: 6380,
                sku: 'P1 Premium',
                location: 'East US',
                redisVersion: '4.0.0',
                provisioningState: 'Succeeded',
                cluster: false,
                shardCount: 0,
                linkedServers: [],
                accessKey: Promise.resolve('key'),
            };

            assert.strictEqual(
                await getConnectionString(parsedRedisResource),
                'my-cache.redis.cache.windows.net:6380,password=key,ssl=True,abortConnect=False'
            );
        });

        it('should return undefined if resource does not have access key', async () => {
            const parsedRedisResource: ParsedRedisResource = {
                resourceId:
                    '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/res-group/providers/Microsoft.Cache/Redis/my-cache',
                subscriptionId: '00000000-0000-0000-0000-000000000000',
                resourceGroup: 'res-group',
                name: 'my-cache',
                hostName: 'my-cache.redis.cache.windows.net',
                port: 6379,
                enableNonSslPort: true,
                sslPort: 6380,
                sku: 'P1 Premium',
                location: 'East US',
                redisVersion: '4.0.0',
                provisioningState: 'Succeeded',
                cluster: false,
                shardCount: 0,
                linkedServers: [],
                accessKey: Promise.resolve(undefined),
            };

            assert.strictEqual(await getConnectionString(parsedRedisResource), undefined);
            parsedRedisResource.accessKey = Promise.resolve('');
            assert.strictEqual(await getConnectionString(parsedRedisResource), undefined);
        });
    });
});
