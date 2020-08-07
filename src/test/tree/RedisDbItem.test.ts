// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { stubInterface } from 'ts-sinon';
import { IActionContext } from 'vscode-azureextensionui';
import { ParsedRedisResource } from '../../../src-shared/ParsedRedisResource';
import { RedisClient } from '../../clients/RedisClient';
import { RedisResourceClient } from '../../clients/RedisResourceClient';
import { AzureCacheItem } from '../../tree/azure/AzureCacheItem';
import { AzureSubscriptionTreeItem } from '../../tree/azure/AzureSubscriptionTreeItem';
import { KeyFilterItem } from '../../tree/KeyFilterItem';
import { RedisDbItem } from '../../tree/redis/RedisDbItem';
import { RedisHashItem } from '../../tree/redis/RedisHashItem';
import { RedisListItem } from '../../tree/redis/RedisListItem';
import { RedisOtherItem } from '../../tree/redis/RedisOtherItem';
import { RedisSetItem } from '../../tree/redis/RedisSetItem';
import { RedisStringItem } from '../../tree/redis/RedisStringItem';
import { RedisZSetItem } from '../../tree/redis/RedisZSetItem';
import { TestRedisClient } from '../clients/TestRedisClient';
import sinon = require('sinon');
import assert = require('assert');

describe('RedisDbItem', () => {
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

    it('should load child elements in continuous manner', async () => {
        // Setup stubs
        const stubRedisClient = new TestRedisClient();
        sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);

        // Stub SCAN calls
        const firstScanRes: [string, string[]] = ['1', ['key1', 'key2', 'key3']];
        const secondScanRes: [string, string[]] = ['0', ['key4']];
        const scanStub = sandbox.stub(stubRedisClient, 'scan');
        scanStub.withArgs('0', 'MATCH', '*', 0).resolves(firstScanRes);
        scanStub.withArgs('1', 'MATCH', '*', 0).resolves(secondScanRes);

        // Stub TYPE calls
        sandbox.stub(stubRedisClient, 'type').resolves('string');

        const context = stubInterface<IActionContext>();
        const redisDbItem = new RedisDbItem(cacheItem, 0);
        let childItems = await redisDbItem.loadMoreChildrenImpl(true, context);

        // One of the child items is the filter item
        assert.strictEqual(childItems.length, 4);
        assert.strictEqual(childItems.filter((item) => item instanceof KeyFilterItem).length, 1);
        assert.strictEqual(childItems[0].label, 'key1');
        assert.strictEqual(childItems[2].label, 'key3');
        assert(redisDbItem.hasMoreChildrenImpl());

        // Load last batch of child elements
        childItems = await redisDbItem.loadMoreChildrenImpl(false, context);
        assert.strictEqual(childItems.length, 1);
        // The label value should continue from previously loaded elements
        assert.strictEqual(childItems[0].label, 'key4');
        assert(!redisDbItem.hasMoreChildrenImpl());
    });

    it('should create child elements of proper type', async () => {
        // Setup stubs
        const stubRedisClient = new TestRedisClient();
        sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);

        // Stub SCAN call
        const scanRes: [string, string[]] = ['0', ['key1', 'key2', 'key3', 'key4', 'key5', 'key6']];
        const scanStub = sandbox.stub(stubRedisClient, 'scan');
        scanStub.withArgs('0', 'MATCH', '*', 0).resolves(scanRes);

        // Stub TYPE calls, each returning a different type of tree item
        const typeStub = sandbox.stub(stubRedisClient, 'type');
        typeStub.withArgs('key1', 0).resolves('string');
        typeStub.withArgs('key2', 0).resolves('list');
        typeStub.withArgs('key3', 0).resolves('hash');
        typeStub.withArgs('key4', 0).resolves('set');
        typeStub.withArgs('key5', 0).resolves('zset');
        typeStub.withArgs('key6', 0).resolves('other');

        const context = stubInterface<IActionContext>();
        const redisDbItem = new RedisDbItem(cacheItem, 0);
        const childItems = await redisDbItem.loadMoreChildrenImpl(true, context);

        assert.strictEqual(childItems.length, 7);
        assert(childItems[0] instanceof RedisStringItem);
        assert.strictEqual(childItems[0].label, 'key1');
        assert(childItems[1] instanceof RedisListItem);
        assert.strictEqual(childItems[1].label, 'key2');
        assert(childItems[2] instanceof RedisHashItem);
        assert.strictEqual(childItems[2].label, 'key3');
        assert(childItems[3] instanceof RedisSetItem);
        assert.strictEqual(childItems[3].label, 'key4');
        assert(childItems[4] instanceof RedisZSetItem);
        assert.strictEqual(childItems[4].label, 'key5');
        assert(childItems[5] instanceof RedisOtherItem);
        assert.strictEqual(childItems[5].label, 'key6');
        assert(childItems[6] instanceof KeyFilterItem);
    });

    it('should handle filter change', () => {
        const redisDbItem = new RedisDbItem(cacheItem, 0);
        assert(redisDbItem.getFilter(), '*');
        redisDbItem.updateFilter('test');
        assert(redisDbItem.getFilter(), 'test');
    });
});
