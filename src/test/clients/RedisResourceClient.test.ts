// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as assert from 'assert';
import RedisManagementClient from 'azure-arm-rediscache';
import { RedisAccessKeys, RedisListResult, RedisResource } from 'azure-arm-rediscache/lib/models';
import { Redis } from 'azure-arm-rediscache/lib/operations';
import { ServiceClientCredentials } from 'ms-rest';
import * as sinon from 'sinon';
import { stubInterface } from 'ts-sinon';
import { RedisResourceClient } from '../../clients/RedisResourceClient';
import * as Shared from '../Shared';

describe('RedisResourceClient', () => {
    let sandbox: sinon.SinonSandbox;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    // Empty ServiceClientCredentials passed to the RedisManagementClient
    const credentials: ServiceClientCredentials = {
        signRequest: () => undefined,
    };
    const rmClient = new RedisManagementClient(credentials, '', '');

    // Shared valid RedisResource
    const sampleRedisResource = {
        id:
            '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/res-group/providers/Microsoft.Cache/Redis/my-cache',
        hostName: 'my-cache.redis.cache.windows.net',
        name: 'mycache',
        enableNonSslPort: true,
        port: 6379,
        sslPort: 6380,
        sku: {
            name: 'Premium',
            family: 'P',
            capacity: 1,
        },
        location: 'East US',
        provisioningState: 'Succeeded',
        redisVersion: '4.0.0',
    } as RedisResource;

    // Shared access keys for above resource
    const sampleAccessKeys: RedisAccessKeys = {
        primaryKey: 'key1',
        secondaryKey: 'key2',
    };

    describe('listResources', () => {
        it('should return list of parsed Redis resources', async () => {
            // Stub the rmClient.redis.list() method
            const redisListResult: RedisListResult = Object.assign([sampleRedisResource], { nextLink: 'someLink' });
            const stubbedRedis = stubInterface<Redis>();
            stubbedRedis.list.resolves(redisListResult);
            stubbedRedis.listKeys.resolves(sampleAccessKeys);
            sandbox.stub(rmClient, 'redis').value(stubbedRedis);

            const redisResourceClient = new RedisResourceClient(rmClient);
            const resourceList = await redisResourceClient.listResources();

            assert.strictEqual(resourceList.length, 1);
            assert.deepStrictEqual(resourceList[0], Shared.createResourceWithKey());
            assert.strictEqual(resourceList.nextLink, 'someLink');
            assert(stubbedRedis.list.calledOnce);
            assert(stubbedRedis.listKeys.calledOnce);
        });

        it('should handle empty response', async () => {
            // Stub the rmClient.redis.list() method
            const redisListResult: RedisListResult = Object.assign([], { nextLink: undefined });
            const stubbedRedis = stubInterface<Redis>();
            stubbedRedis.list.resolves(redisListResult);
            sandbox.stub(rmClient, 'redis').value(stubbedRedis);

            const redisResourceClient = new RedisResourceClient(rmClient);
            const resourceList = await redisResourceClient.listResources();

            assert.strictEqual(resourceList.length, 0);
            assert.strictEqual(resourceList.nextLink, undefined);
            assert(stubbedRedis.list.calledOnce);
            assert(stubbedRedis.listKeys.notCalled);
        });

        it('should ignore incomplete RedisResources', async () => {
            // Stub the rmClient.redis.list() method to return an incomplete RedisResource
            const redisListResult: RedisListResult = Object.assign(
                [
                    {
                        name: 'mycache',
                        port: 6379,
                        sslPort: 6380,
                    } as RedisResource,
                ],
                { nextLink: 'someLink' }
            );
            const stubbedRedis = stubInterface<Redis>();
            stubbedRedis.list.resolves(redisListResult);
            sandbox.stub(rmClient, 'redis').value(stubbedRedis);

            const redisResourceClient = new RedisResourceClient(rmClient);
            const resourceList = await redisResourceClient.listResources();

            assert.strictEqual(resourceList.length, 0);
            assert.strictEqual(resourceList.nextLink, 'someLink');
            assert(stubbedRedis.list.calledOnce);
            assert(stubbedRedis.listKeys.notCalled);
        });
    });

    describe('listNextResources', () => {
        it('should return next list of parsed Redis resources', async () => {
            // Stub the rmClient.redis.listNext() method
            const redisListResult: RedisListResult = Object.assign([sampleRedisResource], { nextLink: undefined });
            const stubbedRedis = stubInterface<Redis>();
            stubbedRedis.listNext.resolves(redisListResult);
            stubbedRedis.listKeys.resolves(sampleAccessKeys);
            sandbox.stub(rmClient, 'redis').value(stubbedRedis);

            const redisResourceClient = new RedisResourceClient(rmClient);
            const resourceList = await redisResourceClient.listNextResources('link');

            assert.strictEqual(resourceList.length, 1);
            assert.deepStrictEqual(resourceList[0], Shared.createResourceWithKey());
            assert.strictEqual(resourceList.nextLink, undefined);
            assert(stubbedRedis.listNext.calledOnce);
            assert(stubbedRedis.listKeys.calledOnce);
        });

        it('should handle empty response', async () => {
            // Stub the rmClient.redis.listNext() method
            const redisListResult: RedisListResult = Object.assign([], { nextLink: undefined });
            const stubbedRedis = stubInterface<Redis>();
            stubbedRedis.listNext.resolves(redisListResult);
            sandbox.stub(rmClient, 'redis').value(stubbedRedis);

            const redisResourceClient = new RedisResourceClient(rmClient);
            const resourceList = await redisResourceClient.listNextResources('link');

            assert.strictEqual(resourceList.length, 0);
            assert.strictEqual(resourceList.nextLink, undefined);
            assert(stubbedRedis.listNext.calledOnce);
            assert(stubbedRedis.listKeys.notCalled);
        });

        it('should ignore incomplete RedisResources', async () => {
            // Stub the rmClient.redis.listNext() method to return incomplete RedisResource
            const redisListResult: RedisListResult = Object.assign(
                [
                    {
                        name: 'mycache',
                        port: 6379,
                        sslPort: 6380,
                    } as RedisResource,
                ],
                { nextLink: undefined }
            );
            const stubbedRedis = stubInterface<Redis>();
            stubbedRedis.listNext.resolves(redisListResult);
            sandbox.stub(rmClient, 'redis').value(stubbedRedis);

            const redisResourceClient = new RedisResourceClient(rmClient);
            const resourceList = await redisResourceClient.listNextResources('link');

            assert.strictEqual(resourceList.length, 0);
            assert.strictEqual(resourceList.nextLink, undefined);
            assert(stubbedRedis.listNext.calledOnce);
            assert(stubbedRedis.listKeys.notCalled);
        });
    });

    describe('getAccessKey', () => {
        it('should return undefined if secondary key does not exist', async () => {
            // Stub the rmClient.redis.listKeys() method
            const allAccessKeys: RedisAccessKeys = {
                primaryKey: 'myPrimaryKey',
                secondaryKey: undefined,
            };
            const stubbedRedis = stubInterface<Redis>();
            stubbedRedis.listKeys.resolves(allAccessKeys);
            sandbox.stub(rmClient, 'redis').value(stubbedRedis);

            const redisResourceClient = new RedisResourceClient(rmClient);
            const accessKeys = await redisResourceClient.getAccessKeys('res-group', 'name');

            assert.strictEqual(accessKeys, undefined);
            assert(stubbedRedis.listKeys.calledOnce);
        });

        it('should return undefined if primary key does not exist', async () => {
            // Stub the rmClient.redis.listKeys() method
            const allAccessKeys: RedisAccessKeys = {
                primaryKey: undefined,
                secondaryKey: 'mySecKey',
            };
            const stubbedRedis = stubInterface<Redis>();
            stubbedRedis.listKeys.resolves(allAccessKeys);
            sandbox.stub(rmClient, 'redis').value(stubbedRedis);

            const redisResourceClient = new RedisResourceClient(rmClient);
            const accessKeys = await redisResourceClient.getAccessKeys('res-group', 'name');

            assert.strictEqual(accessKeys, undefined);
            assert(stubbedRedis.listKeys.calledOnce);
        });

        it('should throw an error if both keys are invalid', async () => {
            // Stub the rmClient.redis.listKeys() method
            const allAccessKeys: RedisAccessKeys = {
                primaryKey: undefined,
                secondaryKey: undefined,
            };
            const stubbedRedis = stubInterface<Redis>();
            stubbedRedis.listKeys.resolves(allAccessKeys);
            sandbox.stub(rmClient, 'redis').value(stubbedRedis);

            const redisResourceClient = new RedisResourceClient(rmClient);
            const accessKeys = await redisResourceClient.getAccessKeys('res-group', 'name');

            assert.strictEqual(accessKeys, undefined);
            assert(stubbedRedis.listKeys.calledOnce);
        });

        it('should throw an error if user has no permission to read keys', async () => {
            // Stub the rmClient.redis.listKeys() method
            const stubbedRedis = stubInterface<Redis>();
            stubbedRedis.listKeys.throws(Error);
            sandbox.stub(rmClient, 'redis').value(stubbedRedis);

            const redisResourceClient = new RedisResourceClient(rmClient);
            const accessKeys = await redisResourceClient.getAccessKeys('res-group', 'name');

            assert.strictEqual(accessKeys, undefined);
            assert(stubbedRedis.listKeys.calledOnce);
        });
    });

    describe('getRedisResourceById', () => {
        it('should return the parsed Redis resource', async () => {
            // Stub the rmClient.redis.get() method
            const stubbedRedis = stubInterface<Redis>();
            stubbedRedis.get.resolves(sampleRedisResource);
            stubbedRedis.listKeys.resolves(sampleAccessKeys);
            sandbox.stub(rmClient, 'redis').value(stubbedRedis);

            const redisResourceClient = new RedisResourceClient(rmClient);
            const parsedResource = await redisResourceClient.getRedisResourceByName('res-group', 'name');

            assert.deepStrictEqual(parsedResource, Shared.createResourceWithKey());
            assert(stubbedRedis.get.calledOnce);
        });

        it('should throw error if unable to find resource', async () => {
            // Stub the rmClient.redis.get() method to throw Error
            const resourceId =
                '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/res-group/providers/Microsoft.Cache/Redis/my-cache';
            const stubbedRedis = stubInterface<Redis>();
            stubbedRedis.get.throws(Error);
            sandbox.stub(rmClient, 'redis').value(stubbedRedis);

            const redisResourceClient = new RedisResourceClient(rmClient);

            assert.rejects(redisResourceClient.getRedisResourceById(resourceId), Error);
            assert(stubbedRedis.get.calledOnce);
        });

        it('should throw error if given invalid resource ID', async () => {
            // Stub the rmClient.redis.get() method
            const stubbedRedis = stubInterface<Redis>();
            stubbedRedis.get.resolves(sampleRedisResource);
            sandbox.stub(rmClient, 'redis').value(stubbedRedis);

            const redisResourceClient = new RedisResourceClient(rmClient);

            assert.rejects(async () => redisResourceClient.getRedisResourceById('invalid-id'), Error);
            assert(stubbedRedis.get.notCalled);
        });
    });

    describe('getRedisResourceByName', () => {
        it('should return the parsed Redis resource', async () => {
            // Stub the rmClient.redis.get() method
            const stubbedRedis = stubInterface<Redis>();
            stubbedRedis.get.resolves(sampleRedisResource);
            stubbedRedis.listKeys.resolves(sampleAccessKeys);
            sandbox.stub(rmClient, 'redis').value(stubbedRedis);

            const redisResourceClient = new RedisResourceClient(rmClient);
            const parsedResource = await redisResourceClient.getRedisResourceByName('res-group', 'name');

            assert.deepStrictEqual(parsedResource, Shared.createResourceWithKey());
            assert(stubbedRedis.get.calledOnce);
        });

        it('should throw error if unable to find resource', async () => {
            // Stub the rmClient.redis.get() method to throw Error
            const stubbedRedis = stubInterface<Redis>();
            stubbedRedis.get.throws(Error);
            sandbox.stub(rmClient, 'redis').value(stubbedRedis);

            const redisResourceClient = new RedisResourceClient(rmClient);

            assert.rejects(redisResourceClient.getRedisResourceByName('res-group', 'name'), Error);
            assert(stubbedRedis.get.calledOnce);
        });
    });
});
