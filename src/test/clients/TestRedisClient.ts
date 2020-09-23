// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { RedisClient } from '../../clients/RedisClient';
import IORedis = require('ioredis');
import sinon = require('sinon');

export class TestRedisClient extends RedisClient {
    public static connectCalled = 0;
    private static stubbedConnect?: sinon.SinonStub;
    private static execResponse: Array<[Error | null, unknown]> = [];

    public static setup(): void {
        this.stubbedConnect = sinon.stub(RedisClient, 'connect' as any).callsFake(this.connect);
    }

    public static teardown(): void {
        this.clients.clear();
        this.stubbedConnect?.restore();
        this.stubbedConnect = undefined;
        this.execResponse = [];
    }

    /**
     * Stubs the response for exec.
     * @param val The value
     */
    public static stubExecResponse<T>(val: T): void {
        this.execResponse = [[null, val]];
    }

    public constructor(client?: IORedis.Redis | IORedis.Cluster) {
        if (!client) {
            client = new IORedis();
            client.disconnect();
        }
        super(client);
    }

    protected static async connect(
        isCluster: boolean,
        server: string,
        password: string,
        port: number
    ): Promise<TestRedisClient> {
        // Track how many times connect is called
        this.connectCalled += 1;

        let client: IORedis.Redis | IORedis.Cluster;

        // Initialize client but do not establish connection
        if (isCluster) {
            client = new IORedis.Cluster([]);
            client.disconnect();
        } else {
            client = new IORedis();
            client.disconnect();
        }
        sinon.stub(client, 'connect').resolves();

        const clientPromise: Promise<TestRedisClient> = new Promise((resolve, reject) => {
            // This is a one-time function that resolves to a new RedisClient instance
            const redisClient = new TestRedisClient(client);
            resolve(redisClient);
        });

        return clientPromise;
    }

    protected async exec<T>(transaction: IORedis.Pipeline): Promise<T> {
        sinon.stub(transaction, 'exec').resolves(TestRedisClient.execResponse);
        return super.exec(transaction);
    }
}
