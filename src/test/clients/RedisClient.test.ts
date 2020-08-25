// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as Shared from '../Shared';
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

    describe('connectToRedisResource', () => {
        it('should attempt to connect to the Redis cache if given valid parameters', async () => {
            // Setup TestRedisClient stubs
            TestRedisClient.setup();

            await TestRedisClient.connectToRedisResource(Shared.createResourceWithKey());
            assert.strictEqual(TestRedisClient.connectCalled, 1);

            // Try connecting to different cache
            await TestRedisClient.connectToRedisResource(Shared.createResourceWithKey2());
            assert.strictEqual(TestRedisClient.connectCalled, 2);
        });

        it('should not call connect again if already connected to the same cache', async () => {
            // Setup TestRedisClient stubs
            TestRedisClient.setup();

            await TestRedisClient.connectToRedisResource(Shared.createResourceWithKey());
            assert.strictEqual(TestRedisClient.connectCalled, 1);

            // Try connecting again
            await TestRedisClient.connectToRedisResource(Shared.createResourceWithKey());
            assert.strictEqual(TestRedisClient.connectCalled, 1);
        });

        it('should not call connect() if error is encountered', () => {
            // Setup TestRedisClient stubs
            TestRedisClient.setup();

            const promise = TestRedisClient.connectToRedisResource(Shared.createResourceWithoutKey());

            assert.rejects(promise, Error);
            assert.strictEqual(TestRedisClient.connectCalled, 0);
        });
    });

    describe('Redis commands', () => {
        it('should return proper values when connected to cache', async () => {
            const client = await TestRedisClient.connectToRedisResource(Shared.createResourceWithKey());

            TestRedisClient.stubExecResponse('someValue');
            assert.strictEqual(await client.get('someKey', 0), 'someValue');

            TestRedisClient.stubExecResponse('someValue');
            assert.strictEqual(await client.lindex('someKey', 0), 'someValue');

            TestRedisClient.stubExecResponse(['0', ['someValue']]);
            assert.deepStrictEqual(await client.scan('0', 'MATCH', '*', 0), ['0', ['someValue']]);
            assert.deepStrictEqual(await client.hscan('someKey', '0', 'MATCH', '*', 0), ['0', ['someValue']]);
            assert.deepStrictEqual(await client.sscan('someKey', '0', 'MATCH', '*', 0), ['0', ['someValue']]);
            assert.deepStrictEqual(await client.zscan('someKey', '0', 'MATCH', '*', 0), ['0', ['someValue']]);

            TestRedisClient.stubExecResponse(1);
            assert.strictEqual(await client.zcard('someKey', 0), 1);

            TestRedisClient.stubExecResponse(['someValue', '0']);
            assert.deepStrictEqual(await client.zrange('someKey', 0, 1), ['someValue', '0']);

            TestRedisClient.stubExecResponse(1);
            assert.strictEqual(await client.llen('someKey'), 1);

            TestRedisClient.stubExecResponse('string');
            assert.strictEqual(await client.type('someKey'), 'string');
        });
    });
});
