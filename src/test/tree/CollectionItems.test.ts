// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ParsedRedisResource } from '../../../src-shared/ParsedRedisResource';
import { RedisClient } from '../../clients/RedisClient';
import { RedisResourceClient } from '../../clients/RedisResourceClient';
import { AzureCacheItem } from '../../tree/azure/AzureCacheItem';
import { AzureSubscriptionTreeItem } from '../../tree/azure/AzureSubscriptionTreeItem';
import { RedisDbItem } from '../../tree/redis/RedisDbItem';
import { RedisHashItem } from '../../tree/redis/RedisHashItem';
import { RedisListItem } from '../../tree/redis/RedisListItem';
import { RedisSetItem } from '../../tree/redis/RedisSetItem';
import { RedisZSetItem } from '../../tree/redis/RedisZSetItem';
import { TestRedisClient } from '../clients/TestRedisClient';
import sinon = require('sinon');
import assert = require('assert');

/**
 * Tests for collection type tree items (list, hash, set, zset).
 */
describe('CollectionItems', () => {
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

            // Stub LRANGE calls
            const lrangeStub = sandbox.stub(stubRedisClient, 'lrange');
            lrangeStub.withArgs('mylist', 0, 9, 0).resolves(Array.from(Array(10).keys()).map((num) => num.toString()));
            lrangeStub
                .withArgs('mylist', 10, 14, 0)
                .resolves(Array.from(Array(5).keys()).map((num) => (num + 10).toString()));

            const listItem = new RedisListItem(testDb, 'mylist');
            let childItems = await listItem.loadNextChildren(true);
            assert.strictEqual(childItems.length, 10);
            assert.strictEqual(childItems[0].value, '0');
            assert(listItem.hasNextChildren());

            // Load last batch of child elements
            childItems = await listItem.loadNextChildren(false);
            assert.strictEqual(childItems.length, 5);
            // The label value should continue from previously loaded elements
            assert.strictEqual(childItems[0].value, '10');
            assert(!listItem.hasNextChildren());
        });

        it('should return zero elements if empty', async () => {
            // Setup stubs
            const stubRedisClient = new TestRedisClient();
            sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);
            sandbox.stub(stubRedisClient, 'llen').resolves(0);

            const listItem = new RedisListItem(testDb, 'mylist');

            const childItems = await listItem.loadNextChildren(true);
            assert.strictEqual(childItems.length, 0);
            assert(!listItem.hasNextChildren());
        });
    });

    describe('RedisHashItem', async () => {
        it('should load child elements in continuous manner', async () => {
            // Setup stubs
            const stubRedisClient = new TestRedisClient();
            sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);
            // Stub first and second HSCAN responses to return 5 elements each
            const firstScanRes: [string, string[]] = [
                '1',
                // eslint-disable-next-line prettier/prettier
                ['f1', '1', 'f2', '2', 'f3', '3', 'f4', '4', 'f5', '5'],
            ];
            const secondScanRes: [string, string[]] = ['2', ['f6', '6', 'f7', '7', 'f8', '8', 'f9', '9', 'f10', '10']];
            // Stub third HSCAN response to return cursor of '0' and one element
            const thirdScanRes: [string, string[]] = ['0', ['f11', '1']];

            const hashStub = sandbox.stub(stubRedisClient, 'hscan');
            hashStub.withArgs('myhash', '0', 'MATCH', '*', 0).resolves(firstScanRes);
            hashStub.withArgs('myhash', '1', 'MATCH', '*', 0).resolves(secondScanRes);
            hashStub.withArgs('myhash', '2', 'MATCH', '*', 0).resolves(thirdScanRes);

            const hashItem = new RedisHashItem(testDb, 'myhash');

            // Should load first 10 hash values
            let childItems = await hashItem.loadNextChildren(true);
            assert.strictEqual(childItems.length, 10);
            assert.strictEqual(childItems[0].id, 'f1');
            assert.strictEqual(childItems[9].id, 'f10');
            assert(hashItem.hasNextChildren());

            // Should load the last remaining element
            childItems = await hashItem.loadNextChildren(false);
            assert.strictEqual(childItems.length, 1);
            assert.strictEqual(childItems[0].id, 'f11');
            assert(!hashItem.hasNextChildren());
        });

        it('should return zero elements if empty', async () => {
            // Setup stubs
            const stubRedisClient = new TestRedisClient();
            sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);
            const scanRes: [string, string[]] = ['0', []];

            sandbox.stub(stubRedisClient, 'hscan').withArgs('myhash', '0', 'MATCH', '*', 0).resolves(scanRes);

            const hashItem = new RedisHashItem(testDb, 'myhash');
            const childItems = await hashItem.loadNextChildren(true);
            assert.strictEqual(childItems.length, 0);
            assert(!hashItem.hasNextChildren());
        });

        it('should properly restore scan cursor when reset', async () => {
            // Setup stubs
            const stubRedisClient = new TestRedisClient();
            sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);
            const scanRes: [string, string[]] = ['0', []];

            sandbox.stub(stubRedisClient, 'hscan').withArgs('myhash', '0', 'MATCH', '*', 0).resolves(scanRes);

            const hashItem = new RedisHashItem(testDb, 'myhash');
            await hashItem.loadNextChildren(true);

            assert(!hashItem.hasNextChildren());
            hashItem.reset();
            assert(hashItem.hasNextChildren());
        });

        it('should properly handle filter change and reset', () => {
            const hashItem = new RedisHashItem(testDb, 'myhash');
            assert(hashItem.getFilter(), '*');
            hashItem.updateFilter('test');
            assert(hashItem.getFilter(), 'test');
            hashItem.reset();
            assert(hashItem.getFilter(), '*');
        });
    });

    describe('RedisSetItem', async () => {
        it('should load child elements in continuous manner', async () => {
            // Setup stubs
            const stubRedisClient = new TestRedisClient();
            sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);
            // Stub first and second SSCAN responses to return 5 elements each
            const firstScanRes: [string, string[]] = ['1', ['A', 'B', 'C', 'D', 'E']];
            const secondScanRes: [string, string[]] = ['2', ['F', 'G', 'H', 'I', 'J']];
            // Stub third SSCAN response to return cursor of '0' and one element
            const thirdScanRes: [string, string[]] = ['0', ['K']];

            const scanStub = sandbox.stub(stubRedisClient, 'sscan');
            scanStub.withArgs('myset', '0', 'MATCH', '*', 0).resolves(firstScanRes);
            scanStub.withArgs('myset', '1', 'MATCH', '*', 0).resolves(secondScanRes);
            scanStub.withArgs('myset', '2', 'MATCH', '*', 0).resolves(thirdScanRes);

            const setItem = new RedisSetItem(testDb, 'myset');

            // First call should load minimum 10 elements
            let childItems = await setItem.loadNextChildren(true);
            assert.strictEqual(childItems.length, 10);
            assert.strictEqual(childItems[0].value, 'A');
            assert.strictEqual(childItems[9].value, 'J');
            assert(setItem.hasNextChildren());

            // Next call should load last remaining element
            childItems = await setItem.loadNextChildren(false);
            assert.strictEqual(childItems.length, 1);
            assert.strictEqual(childItems[0].value, 'K');
            assert(!setItem.hasNextChildren());
        });

        it('should return zero elements if empty', async () => {
            // Setup stubs
            const stubRedisClient = new TestRedisClient();
            sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);
            const scanRes: [string, string[]] = ['0', []];

            sandbox.stub(stubRedisClient, 'sscan').withArgs('myset', '0', 'MATCH', '*', 0).resolves(scanRes);

            const setItem = new RedisSetItem(testDb, 'myset');
            const childItems = await setItem.loadNextChildren(true);
            assert.strictEqual(childItems.length, 0);
            assert(!setItem.hasNextChildren());
        });
    });

    describe('RedisZSetItem', async () => {
        it('should load child elements in continuous manner', async () => {
            // Setup stubs
            const stubRedisClient = new TestRedisClient();
            sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);
            // Stub first ZRANGE response to return first 10 elements
            const firstZrangeRes: string[] = [
                // eslint-disable-next-line prettier/prettier
                'A', '0', 'B', '1', 'C', '2', 'D', '3', 'E', '4', 'F', '5', 'G', '6', 'H', '7', 'I', '8', 'J', '9'
            ];
            // Stub second ZRANGE response to return 11th element
            const secondZrangeRes: string[] = ['K', '10'];
            const zcardStub = sandbox.stub(stubRedisClient, 'zcard').resolves(11);
            const zrangeStub = sandbox.stub(stubRedisClient, 'zrange');
            zrangeStub.withArgs('myzset', 0, 9, 0).resolves(firstZrangeRes);
            zrangeStub.withArgs('myzset', 10, 10, 0).resolves(secondZrangeRes);

            const zsetItem = new RedisZSetItem(testDb, 'myzset');

            let childItems = await zsetItem.loadNextChildren(true);
            assert.strictEqual(childItems.length, 10);
            assert.strictEqual(childItems[0].id, '0');
            assert.strictEqual(childItems[0].value, 'A');
            assert.strictEqual(childItems[9].id, '9');
            assert.strictEqual(childItems[9].value, 'J');
            assert(zsetItem.hasNextChildren());

            // Load last remaining element
            childItems = await zsetItem.loadNextChildren(false);
            assert.strictEqual(childItems.length, 1);
            // The label value should continue from previously loaded elements
            assert.strictEqual(childItems[0].id, '10');
            assert.strictEqual(childItems[0].value, 'K');
            assert(!zsetItem.hasNextChildren());
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

            const childItems = await zsetItem.loadNextChildren(true);
            assert(zrangeStub.notCalled);
            assert.strictEqual(childItems.length, 0);
            assert(!zsetItem.hasNextChildren());
        });
    });
});
