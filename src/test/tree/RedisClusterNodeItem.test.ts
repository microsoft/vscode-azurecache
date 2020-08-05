// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { stubInterface } from 'ts-sinon';
import { IActionContext } from 'vscode-azureextensionui';
import { ParsedRedisResource } from '../../../src-shared/ParsedRedisResource';
import { RedisClient } from '../../clients/RedisClient';
import { RedisResourceClient } from '../../clients/RedisResourceClient';
import { AzureCacheItem } from '../../tree/azure/AzureCacheItem';
import { AzureSubscriptionTreeItem } from '../../tree/azure/AzureSubscriptionTreeItem';
import { RedisClusterNodeItem } from '../../tree/redis/RedisClusterNodeItem';
import { RedisHashItem } from '../../tree/redis/RedisHashItem';
import { RedisListItem } from '../../tree/redis/RedisListItem';
import { RedisOtherItem } from '../../tree/redis/RedisOtherItem';
import { RedisSetItem } from '../../tree/redis/RedisSetItem';
import { RedisStringItem } from '../../tree/redis/RedisStringItem';
import { RedisZSetItem } from '../../tree/redis/RedisZSetItem';
import { TestRedisClient } from '../clients/TestRedisClient';
import sinon = require('sinon');
import assert = require('assert');

describe('RedisClusterNodeItem', () => {
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
        cluster: true,
        shardCount: 2,
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
        const scanStub = sandbox.stub(stubRedisClient, 'clusterScan');
        scanStub.withArgs('nodeId', '0', 'MATCH', '*').resolves(firstScanRes);
        scanStub.withArgs('nodeId', '1', 'MATCH', '*').resolves(secondScanRes);

        // Stub TYPE calls
        sandbox.stub(stubRedisClient, 'type').resolves('string');

        const context = stubInterface<IActionContext>();
        const clusterNodeItem = new RedisClusterNodeItem(cacheItem, 'nodeId', 13000);
        let childItems = await clusterNodeItem.loadMoreChildrenImpl(true, context);

        assert.strictEqual(childItems.length, 3);
        assert.strictEqual(childItems[0].label, 'key1');
        assert.strictEqual(childItems[1].label, 'key2');
        assert.strictEqual(childItems[2].label, 'key3');
        assert(clusterNodeItem.hasMoreChildrenImpl());

        // Load last batch of child elements
        childItems = await clusterNodeItem.loadMoreChildrenImpl(false, context);
        assert.strictEqual(childItems.length, 1);
        // The label value should continue from previously loaded elements
        assert.strictEqual(childItems[0].label, 'key4');
        assert(!clusterNodeItem.hasMoreChildrenImpl());
    });

    it('should create child elements of proper type', async () => {
        // Setup stubs
        const stubRedisClient = new TestRedisClient();
        sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);

        // Stub SCAN call
        const scanRes: [string, string[]] = ['0', ['key1', 'key2', 'key3', 'key4', 'key5', 'key6']];
        const hashStub = sandbox.stub(stubRedisClient, 'clusterScan');
        hashStub.withArgs('nodeId', '0', 'MATCH', '*').resolves(scanRes);

        // Stub TYPE calls, each returning a different type of tree item
        const typeStub = sandbox.stub(stubRedisClient, 'type');
        typeStub.withArgs('key1').resolves('string');
        typeStub.withArgs('key2').resolves('list');
        typeStub.withArgs('key3').resolves('hash');
        typeStub.withArgs('key4').resolves('set');
        typeStub.withArgs('key5').resolves('zset');
        typeStub.withArgs('key6').resolves('other');

        const context = stubInterface<IActionContext>();
        const clusterNodeItem = new RedisClusterNodeItem(cacheItem, 'nodeId', 13000);
        const childItems = await clusterNodeItem.loadMoreChildrenImpl(true, context);

        assert.strictEqual(childItems.length, 6);
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
    });
});
