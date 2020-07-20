// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { stubInterface } from 'ts-sinon';
import { IActionContext } from 'vscode-azureextensionui';
import { RedisClient } from '../clients/RedisClient';
import { RedisResourceClient } from '../clients/RedisResourceClient';
import { ParsedRedisResource } from '../parsed/ParsedRedisResource';
import { AzureCacheItem } from '../tree/azure/AzureCacheItem';
import { AzureSubscriptionTreeItem } from '../tree/azure/AzureSubscriptionTreeItem';
import { HashFieldFilterItem } from '../tree/filter/HashFieldFilterItem';
import { RedisDbItem } from '../tree/redis/RedisDbItem';
import { RedisHashItem } from '../tree/redis/RedisHashItem';
import { RedisListItem } from '../tree/redis/RedisListItem';
import { RedisSetItem } from '../tree/redis/RedisSetItem';
import { RedisZSetItem } from '../tree/redis/RedisZSetItem';
import { TestRedisClient } from './clients/TestRedisClient';
import sinon = require('sinon');
import assert = require('assert');

describe('TreeItems', () => {
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
    const testDb = new RedisDbItem(cacheItem, 0);

    describe('RedisListItem', async () => {
        it('should load child elements in continuous manner', async () => {
            // Setup stubs
            const stubRedisClient = new TestRedisClient();
            sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);
            sandbox.stub(stubRedisClient, 'llen').resolves(15);

            const listItem = new RedisListItem(testDb, 'mylist');
            const context = stubInterface<IActionContext>();

            let childItems = await listItem.loadMoreChildrenImpl(true, context);
            assert.strictEqual(childItems.length, 10);
            assert.strictEqual(childItems[0].label, '0');
            assert(listItem.hasMoreChildrenImpl());

            // Load last batch of child elements
            childItems = await listItem.loadMoreChildrenImpl(false, context);
            assert.strictEqual(childItems.length, 5);
            // The label value should continue from previously loaded elements
            assert.strictEqual(childItems[0].label, '10');
            assert(!listItem.hasMoreChildrenImpl());
        });

        it('should return zero elements if empty', async () => {
            // Setup stubs
            const stubRedisClient = new TestRedisClient();
            sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);
            sandbox.stub(stubRedisClient, 'llen').resolves(0);

            const listItem = new RedisListItem(testDb, 'mylist');
            const context = stubInterface<IActionContext>();

            const childItems = await listItem.loadMoreChildrenImpl(true, context);
            assert.strictEqual(childItems.length, 0);
            assert(!listItem.hasMoreChildrenImpl());
        });
    });

    describe('RedisHashItem', async () => {
        it('should load child elements in continuous manner', async () => {
            // Setup stubs
            const stubRedisClient = new TestRedisClient();
            sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);
            // Stub first HSCAN response to return cursor of '1' and three elements
            const firstScanRes: [string, string[]] = ['1', ['fieldA', 'A', 'fieldB', 'B', 'fieldC', 'C']];
            // Stub second HSCAN response to return cursor of '0' and one element
            const secondScanRes: [string, string[]] = ['0', ['fieldD', 'D']];

            const hashStub = sandbox.stub(stubRedisClient, 'hscan');
            hashStub.withArgs('myhash', '0', 'MATCH', '*', 0).resolves(firstScanRes);
            hashStub.withArgs('myhash', '1', 'MATCH', '*', 0).resolves(secondScanRes);

            const hashItem = new RedisHashItem(testDb, 'myhash');
            const context = stubInterface<IActionContext>();

            let childItems = await hashItem.loadMoreChildrenImpl(true, context);
            // One of the child items is the hash filter item
            assert.strictEqual(childItems.length, 4);
            assert.strictEqual(childItems.filter((item) => item instanceof HashFieldFilterItem).length, 1);
            assert.strictEqual(childItems[0].label, 'fieldA');
            assert(hashItem.hasMoreChildrenImpl());

            // Load last batch of child elements
            childItems = await hashItem.loadMoreChildrenImpl(false, context);
            assert.strictEqual(childItems.length, 1);
            // The label value should continue from previously loaded elements
            assert.strictEqual(childItems[0].label, 'fieldD');
            assert(!hashItem.hasMoreChildrenImpl());
        });

        it('should return zero elements if empty', async () => {
            // Setup stubs
            const stubRedisClient = new TestRedisClient();
            sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);
            const scanRes: [string, string[]] = ['0', []];

            sandbox.stub(stubRedisClient, 'hscan').withArgs('myhash', '0', 'MATCH', '*', 0).resolves(scanRes);

            const hashItem = new RedisHashItem(testDb, 'myhash');
            const context = stubInterface<IActionContext>();

            const childItems = await hashItem.loadMoreChildrenImpl(true, context);
            assert.strictEqual(childItems.length, 1);
            assert.strictEqual(childItems.filter((item) => item instanceof HashFieldFilterItem).length, 1);
            assert(!hashItem.hasMoreChildrenImpl());
        });
    });

    describe('RedisSetItem', async () => {
        it('should load child elements in continuous manner', async () => {
            // Setup stubs
            const stubRedisClient = new TestRedisClient();
            sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);
            // Stub first SSCAN response to return cursor of '1' and three elements
            const firstScanRes: [string, string[]] = ['1', ['A', 'B', 'C']];
            // Stub second SSCAN response to return cursor of '0' and one element
            const secondScanRes: [string, string[]] = ['0', ['D']];

            const scanStub = sandbox.stub(stubRedisClient, 'sscan');
            scanStub.withArgs('myset', '0', 'MATCH', '*', 0).resolves(firstScanRes);
            scanStub.withArgs('myset', '1', 'MATCH', '*', 0).resolves(secondScanRes);

            const setItem = new RedisSetItem(testDb, 'myset');
            const context = stubInterface<IActionContext>();

            let childItems = await setItem.loadMoreChildrenImpl(true, context);
            assert.strictEqual(childItems.length, 3);
            assert.strictEqual(childItems[0].label, '0');
            assert(setItem.hasMoreChildrenImpl());

            // Load last batch of child elements
            childItems = await setItem.loadMoreChildrenImpl(false, context);
            assert.strictEqual(childItems.length, 1);
            // The label value should continue from previously loaded elements
            assert.strictEqual(childItems[0].label, '3');
            assert(!setItem.hasMoreChildrenImpl());
        });

        it('should return zero elements if empty', async () => {
            // Setup stubs
            const stubRedisClient = new TestRedisClient();
            sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);
            const scanRes: [string, string[]] = ['0', []];

            sandbox.stub(stubRedisClient, 'sscan').withArgs('myset', '0', 'MATCH', '*', 0).resolves(scanRes);

            const setItem = new RedisSetItem(testDb, 'myset');
            const context = stubInterface<IActionContext>();

            const childItems = await setItem.loadMoreChildrenImpl(true, context);
            assert.strictEqual(childItems.length, 0);
            assert(!setItem.hasMoreChildrenImpl());
        });
    });

    describe('RedisZSetItem', async () => {
        it('should load child elements in continuous manner', async () => {
            // Setup stubs
            const stubRedisClient = new TestRedisClient();
            sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);
            // Stub first ZRANGE response to return first 10 elements
            const firstZrangeRes: string[] = [
                'A',
                '0',
                'B',
                '1',
                'C',
                '2',
                'D',
                '3',
                'E',
                '4',
                'F',
                '5',
                'G',
                '6',
                'H',
                '7',
                'I',
                '8',
                'J',
                '9',
            ];
            // Stub second ZRANGE response to return 11th element
            const secondZrangeRes: string[] = ['K', '10'];
            const zcardStub = sandbox.stub(stubRedisClient, 'zcard').resolves(11);
            const zrangeStub = sandbox.stub(stubRedisClient, 'zrange');
            zrangeStub.withArgs('myzset', 0, 9, 0).resolves(firstZrangeRes);
            zrangeStub.withArgs('myzset', 10, 10, 0).resolves(secondZrangeRes);

            const zsetItem = new RedisZSetItem(testDb, 'myzset');
            const context = stubInterface<IActionContext>();

            let childItems = await zsetItem.loadMoreChildrenImpl(true, context);
            assert.strictEqual(childItems.length, 10);
            assert.strictEqual(childItems[0].label, '0');
            assert(zsetItem.hasMoreChildrenImpl());

            // Load last batch of child elements
            childItems = await zsetItem.loadMoreChildrenImpl(false, context);
            assert.strictEqual(childItems.length, 1);
            // The label value should continue from previously loaded elements
            assert.strictEqual(childItems[0].label, '10');
            assert(!zsetItem.hasMoreChildrenImpl());
            // ZCARD should only be called once, when 'clearCache' set to true
            assert(zcardStub.calledOnce);
        });

        it('should return zero elements if empty', async () => {
            // Setup stubs
            const stubRedisClient = new TestRedisClient();
            sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);
            sandbox.stub(stubRedisClient, 'zcard').resolves(0);
            const zrangeStub = sandbox.stub(stubRedisClient, 'zrange');

            const zsetItem = new RedisZSetItem(testDb, 'myzset');
            const context = stubInterface<IActionContext>();

            const childItems = await zsetItem.loadMoreChildrenImpl(true, context);
            assert(zrangeStub.notCalled);
            assert.strictEqual(childItems.length, 0);
            assert(!zsetItem.hasMoreChildrenImpl());
        });
    });
});
