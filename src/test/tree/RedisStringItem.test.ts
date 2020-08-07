// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ParsedRedisResource } from '../../../src-shared/ParsedRedisResource';
import { RedisClient } from '../../clients/RedisClient';
import { RedisResourceClient } from '../../clients/RedisResourceClient';
import { AzureCacheItem } from '../../tree/azure/AzureCacheItem';
import { AzureSubscriptionTreeItem } from '../../tree/azure/AzureSubscriptionTreeItem';
import { RedisDbItem } from '../../tree/redis/RedisDbItem';
import { RedisStringItem } from '../../tree/redis/RedisStringItem';
import { TestRedisClient } from '../clients/TestRedisClient';
import sinon = require('sinon');
import assert = require('assert');

describe('RedisStringItem', () => {
    let sandbox: sinon.SinonSandbox;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

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

    const cacheItem = new AzureCacheItem(
        {} as AzureSubscriptionTreeItem,
        {} as RedisResourceClient,
        sampleParsedRedisResource
    );
    const db = 3;
    const testDb = new RedisDbItem(cacheItem, db);

    const theories = [null, 'value'];
    theories.forEach((val) => {
        it(`should return result of GET (${val})`, async () => {
            const stubRedisClient = new TestRedisClient();
            sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);

            // Stub GET call
            const getStub = sandbox.stub(stubRedisClient, 'get');
            getStub.withArgs('mystring', db).resolves(val);

            const stringItem = new RedisStringItem(testDb, 'mystring');
            const keyValue = await stringItem.getValue();
            assert.strictEqual(keyValue, val);
        });
    });
});
