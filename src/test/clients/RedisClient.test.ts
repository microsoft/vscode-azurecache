// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as assert from 'assert';
import * as sinon from 'sinon';
import { ParsedRedisResource } from '../../../src-shared/ParsedRedisResource';
import { TestRedisClient } from './TestRedisClient';

describe('RedisClient', () => {
    let sandbox: sinon.SinonSandbox;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        // Reset connect() count
        TestRedisClient.connectCalled = 0;
        // Restore stub to original functionality
        TestRedisClient.teardown();
        sandbox.restore();
    });

    // A sample Redis resource for which the user does not have write access
    const sampleParsedRedisResourceMissingKeys: ParsedRedisResource = {
        resourceId:
            '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/res-group/providers/Microsoft.Cache/Redis/my-cache',
        subscriptionId: '00000000-0000-0000-0000-000000000000',
        resourceGroup: 'res-group',
        name: 'my-cache',
        hostName: 'mycache.net',
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
        accessKey: Promise.resolve(undefined),
    };

    // A sample Redis resource for which the user has read and write access
    const sampleParsedRedisResource: ParsedRedisResource = {
        resourceId:
            '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/res-group/providers/Microsoft.Cache/Redis/my-cache',
        subscriptionId: '00000000-0000-0000-0000-000000000000',
        resourceGroup: 'res-group',
        name: 'my-cache',
        hostName: 'mycache.net',
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
        accessKey: Promise.resolve('key'),
    };

    // Another sample Redis resource for which the user has read and write access
    const sampleParsedRedisResource2: ParsedRedisResource = {
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
        accessKey: Promise.resolve('key'),
    };

    describe('connectToRedisResource', () => {
        it('should attempt to connect to the Redis cache if given valid parameters', async () => {
            // Setup TestRedisClient stubs
            TestRedisClient.setup();

            await TestRedisClient.connectToRedisResource(sampleParsedRedisResource);
            assert.strictEqual(TestRedisClient.connectCalled, 1);

            // Try connecting to different cache
            await TestRedisClient.connectToRedisResource(sampleParsedRedisResource2);
            assert.strictEqual(TestRedisClient.connectCalled, 2);
        });

        it('should not call connect again if already connected to the same cache', async () => {
            // Setup TestRedisClient stubs
            TestRedisClient.setup();

            await TestRedisClient.connectToRedisResource(sampleParsedRedisResource);
            assert.strictEqual(TestRedisClient.connectCalled, 1);

            // Try connecting again
            await TestRedisClient.connectToRedisResource(sampleParsedRedisResource);
            assert.strictEqual(TestRedisClient.connectCalled, 1);
        });

        it('should not call connect() if error is encountered', () => {
            // Setup TestRedisClient stubs
            TestRedisClient.setup();

            const promise = TestRedisClient.connectToRedisResource(sampleParsedRedisResourceMissingKeys);

            assert.rejects(promise, Error);
            assert.strictEqual(TestRedisClient.connectCalled, 0);
        });
    });

    describe('Redis commands', () => {
        it('should return proper values when connected to cache', async () => {
            const client = await TestRedisClient.connectToRedisResource(sampleParsedRedisResource);

            TestRedisClient.stubExecResponse('string');
            assert.strictEqual(await client.type('someKey'), 'string');

            TestRedisClient.stubExecResponse('someValue');
            assert.strictEqual(await client.get('someKey', 0), 'someValue');

            TestRedisClient.stubExecResponse(1);
            assert.strictEqual(await client.llen('someKey'), 1);

            TestRedisClient.stubExecResponse('someValue');
            assert.strictEqual(await client.lindex('someKey', 0), 'someValue');

            TestRedisClient.stubExecResponse(['a', 'b', 'c']);
            assert.deepStrictEqual(await client.lrange('someKey', 0, 2, 0), ['a', 'b', 'c']);

            TestRedisClient.stubExecResponse(5);
            assert.strictEqual(await client.hlen('someKey', 0), 5);

            TestRedisClient.stubExecResponse(2);
            assert.strictEqual(await client.scard('someKey', 0), 2);

            TestRedisClient.stubExecResponse(1);
            assert.strictEqual(await client.zcard('someKey', 0), 1);

            TestRedisClient.stubExecResponse(['someValue', '0']);
            assert.deepStrictEqual(await client.zrange('someKey', 0, 1), ['someValue', '0']);

            TestRedisClient.stubExecResponse(['0', ['someValue']]);
            assert.deepStrictEqual(await client.scan('0', 'MATCH', '*', 0), ['0', ['someValue']]);
            assert.deepStrictEqual(await client.hscan('someKey', '0', 'MATCH', '*', 0), ['0', ['someValue']]);
            assert.deepStrictEqual(await client.sscan('someKey', '0', 'MATCH', '*', 0), ['0', ['someValue']]);
            assert.deepStrictEqual(await client.zscan('someKey', '0', 'MATCH', '*', 0), ['0', ['someValue']]);
        });
    });
});
