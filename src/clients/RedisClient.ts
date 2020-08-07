// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as IORedis from 'ioredis';
import * as vscode from 'vscode';
import { ExtVars } from '../ExtensionVariables';
import { ParsedRedisResource } from '../../src-shared/ParsedRedisResource';
import * as Strings from '../Strings';

/**
 * Wrapper class around the IORedis client that handles connecting to clustered and non-clustered caches.
 *
 * Use the RedisClient.connectToRedisResource static method to get an instance of RedisClient.
 */
export class RedisClient {
    /**
     * Internal memoized map from resource ID to RedisClient.
     * This prevents multiple clients being created to connect to the same cache.
     */
    protected static clients: Map<string, Thenable<RedisClient>> = new Map();

    /**
     * List of cluster node IDs.
     */
    public clusterNodeIds: string[];

    /**
     * Retrieves the current IORedis client as a MULTI-EXEC transaction (IORedis.Pipeline).
     */
    private getClient: {
        /**
         * this.getClient() accepts an optional db parameter:
         *
         * If passed a number, it interprets it as a DB number and will add a select command to the transaction before returning it.
         * If passed a string, it interprets it as a cluster node ID and will return an empty transaction corresponding to that node's client.
         * If passed nothing, it will return an empty transaction corresponding to the cache's client.
         */
        (dbOrNodeId?: number | string): Promise<IORedis.Pipeline>;
        disconnect: { (): void };
    };

    /**
     * Cannot be initialized from outside this class.
     *
     * @param client IORedis client
     * @param clusterClients Mapping from cluster node IDs to IORedis client
     */
    protected constructor(client: IORedis.Redis | IORedis.Cluster, clusterClients?: Map<string, IORedis.Redis>) {
        this.clusterNodeIds = clusterClients ? Array.from(clusterClients.keys()) : [];
        this.getClient = Object.assign(
            async (dbOrNodeId?: number | string) => {
                // Reconnect the client if disconnected
                if (client.status !== 'ready') {
                    /**
                     * After this await, the client should be in 'ready' state and will trigger:
                     * 1. The client.on('ready') in the connect() method
                     * 2. The client.on('ready') right after this getClient assignment
                     */
                    await client.connect();
                }

                /**
                 * Use Redis transactions (MULTI, EXEC) to ensure that select is called (where necessary) prior to executing the requested command.
                 *
                 * Directly calling 'await client.select()' followed by 'await client.command()' can result in nondeterministic behaviour how
                 * async/await works (e.g. all the selects might execute one after another, followed by all the requested commands).
                 */
                let transaction = client.multi();

                if (typeof dbOrNodeId === 'string') {
                    // Arg is string, so interpret as cluster node ID
                    const clusterNodeClient = clusterClients?.get(dbOrNodeId);
                    if (!clusterNodeClient) {
                        vscode.window.showErrorMessage(Strings.ErrorNotConnectToShard);
                        throw new Error(Strings.ErrorNotConnectToShard);
                    }
                    // Reconnect the cluster node's client if disconnected
                    if (clusterNodeClient.status !== 'ready') {
                        await clusterNodeClient.connect();
                    }
                    return clusterNodeClient.multi();
                } else if (typeof dbOrNodeId === 'number') {
                    // Arg is number, so interpret as DB number
                    // This does not execute until exec() is called on the transaction
                    transaction = transaction.select(dbOrNodeId);
                }
                return transaction;
            },
            {
                disconnect: () => {
                    client.disconnect();
                },
            }
        );

        /**
         * This refreshes the cluster clients. Unlike the on('ready') in connect(), this is not called when the cache
         * is first connected to. It is only called on *subsequent* reconnects.
         */
        client.on('ready', async () => {
            // Update clusterClients in constructor's scope so that this.getClient can access the updated clusterClients
            clusterClients = await RedisClient.createClusterNodeMap(client);
            this.clusterNodeIds = Array.from(clusterClients.keys());
        });
    }

    /**
     * Connects to Redis cache for the given ParsedRedisResource while showing progress dialog.
     * Returns a Promise that resolves to a RedisClient.
     *
     * @param parsedRedisResource The Redis resource
     * @param ignoreCache Whether to skip returning the memoized client
     */
    public static async connectToRedisResource(
        parsedRedisResource: ParsedRedisResource,
        ignoreCache = false
    ): Promise<RedisClient> {
        const existingClient = this.clients.get(parsedRedisResource.resourceId);
        if (!ignoreCache && existingClient) {
            return existingClient;
        }

        // Show notification in bottom-right saying "Connecting to Redis cache..."
        const newRedisClient = vscode.window.withProgress<RedisClient>(
            {
                location: vscode.ProgressLocation.Notification,
                title: Strings.StrConnectingToCache,
            },
            async () => {
                // Dispose old client if exists
                if (existingClient) {
                    try {
                        (await existingClient).getClient.disconnect();
                    } catch (e) {
                        ExtVars.outputChannel.appendLine(e);
                    }
                }

                const { accessKey, cluster, hostName, port, sslPort, provisioningState } = parsedRedisResource;
                const password = await accessKey;
                if (typeof password === 'undefined') {
                    throw new Error(Strings.ErrorReadAccessKey);
                }

                if (provisioningState !== 'Succeeded') {
                    vscode.window.showWarningMessage(`${Strings.StrCurrentProvStateIs}: ${provisioningState}`);
                }

                // TODO: Support connecting over SSL (bug in IORedis)
                const connectPort = cluster ? port : sslPort;
                return this.connect(cluster, hostName, password, connectPort, !cluster);
            }
        );

        // Memoize client by resource ID
        this.clients.set(parsedRedisResource.resourceId, newRedisClient);
        return newRedisClient;
    }

    /**
     * Connects to Redis cache given connection details and returns promise that resolves to a RedisClient.
     *
     * @param isCluster Whether connection will be made using clustered client
     * @param server Host name
     * @param password Access key
     * @param port Port
     * @param ssl Whether SSL is enabled
     */
    protected static async connect(
        isCluster: boolean,
        server: string,
        password: string,
        port: number,
        ssl: boolean
    ): Promise<RedisClient> {
        let client: IORedis.Redis | IORedis.Cluster;

        if (isCluster) {
            // Initialize cluster client
            client = new IORedis.Cluster(
                [
                    {
                        host: server,
                        port: port,
                    },
                ],
                {
                    enableReadyCheck: true,
                    scaleReads: 'master',
                    slotsRefreshTimeout: 2000,
                    clusterRetryStrategy: function (times): null {
                        // Do not retry
                        return null;
                    },
                    redisOptions: {
                        password: password,
                        tls: ssl ? { host: server, port: port } : undefined,
                    },
                }
            );
        } else {
            client = new IORedis(port, server, {
                password: password,
                tls: ssl ? { host: server, port: port } : undefined,
                retryStrategy: function (times): null {
                    // Do not retry
                    return null;
                },
            });
        }

        const clientPromise: Promise<RedisClient> = new Promise((resolve, reject) => {
            // This is a one-time function that resolves to a new RedisClient instance
            client.on('ready', async function onReady() {
                const clusterClients = await RedisClient.createClusterNodeMap(client);
                const redisClient = new RedisClient(client, clusterClients);
                resolve(redisClient);
                // Prevent from being called again
                client.removeListener('ready', onReady);
            });

            client.on('error', reject);
        });

        client.on('connect', () => ExtVars.outputChannel.appendLine('Redis connection established'));
        client.on('reconnecting', () => ExtVars.outputChannel.appendLine('Redis connection re-established'));

        // Interval to periodically ping the cache (to avoid timeouts)
        let pingInterval: NodeJS.Timeout | undefined;

        // This is called when the client first connects and on subsequent reconnects
        client.on('ready', async () => {
            ExtVars.outputChannel.appendLine('Redis connection ready');
            pingInterval = setInterval(() => {
                client.ping().catch(() => {
                    // Client might be disconnected
                    ExtVars.outputChannel.appendLine('Ping failed');
                });
            }, 60000); // 60 seconds
        });

        // Called when Redis connection ends
        client.on('end', () => {
            ExtVars.outputChannel.appendLine('Redis connection ended');
            if (pingInterval) {
                clearInterval(pingInterval);
                pingInterval = undefined;
            }
        });

        client.on('error', (error) => {
            ExtVars.outputChannel.appendLine('Redis error:');
            ExtVars.outputChannel.appendLine(error);
            vscode.window.showErrorMessage(
                `Azure Cache error: ${error.message.toString()}\n${Strings.StrPromptRefreshCache}`
            );
        });

        return clientPromise;
    }

    private static async createClusterNodeMap(
        client: IORedis.Redis | IORedis.Cluster
    ): Promise<Map<string, IORedis.Redis>> {
        const clusterClients = new Map<string, IORedis.Redis>();

        // Create mapping between the primary node IDs and their Redis clients
        if (client instanceof IORedis.Cluster) {
            const primaryNodeClients = client.nodes('master');
            for (const primaryNodeClient of primaryNodeClients) {
                const id = await primaryNodeClient.cluster('MYID');
                clusterClients.set(id, primaryNodeClient);
            }
        }

        return clusterClients;
    }

    /**
     * Disconnects all active clients.
     */
    public static async disposeClients(): Promise<void> {
        RedisClient.clients.forEach(async (client) => {
            try {
                (await client).getClient.disconnect();
            } catch (e) {
                ExtVars.outputChannel.appendLine(e);
            }
        });
    }

    /**
     * Executes the given transaction (IORedis.Pipeline) and returns the value of the last command if succeeded.
     * Otherwise, throws the error included in the response.
     *
     * @param transaction Transaction to execute
     */
    protected async exec<T>(transaction: IORedis.Pipeline): Promise<T> {
        const entireResult = await transaction.exec();
        const lastCmdResult = entireResult[entireResult.length - 1];

        if (!lastCmdResult || lastCmdResult.length < 2) {
            throw new Error(Strings.ErrorUnknown);
        }

        // Find the first error (if any) and throw it
        const firstError = entireResult.find((r) => !!r[0]);
        if (firstError?.[0]) {
            throw firstError[0];
        }

        // Otherwise, return the result
        return lastCmdResult[1] as T;
    }

    /**
     * Client commands.
     */
    public async clusterScan(
        clusterNodeId: string,
        cursor: number | string,
        matchOption: 'match' | 'MATCH',
        pattern: string
    ): Promise<[string, string[]]> {
        return this.exec((await this.getClient(clusterNodeId)).scan(cursor, matchOption, pattern));
    }

    public async get(key: string, db?: number): Promise<string | null> {
        return this.exec((await this.getClient(db)).get(key));
    }

    public async getClusterNodeOptions(clusterNodeId: string): Promise<IORedis.RedisOptions> {
        const client = (await this.getClient(clusterNodeId)) as IORedis.Pipeline;
        return client.options;
    }

    public async info(section: string): Promise<string> {
        return this.exec((await this.getClient()).info(section));
    }

    public async lindex(key: string, index: number, db?: number): Promise<string> {
        return this.exec((await this.getClient(db)).lindex(key, index));
    }

    public async lrange(key: string, start: number, stop: number, db?: number): Promise<string[]> {
        return this.exec((await this.getClient(db)).lrange(key, start, stop));
    }

    public async hlen(key: string, db?: number): Promise<number> {
        return this.exec((await this.getClient(db)).hlen(key));
    }

    public async hscan(
        key: string,
        cursor: number | string,
        matchOption: 'match' | 'MATCH',
        pattern: string,
        db?: number
    ): Promise<[string, string[]]> {
        return this.exec((await this.getClient(db)).hscan(key, cursor, matchOption, pattern));
    }

    public async llen(key: string, db?: number): Promise<number> {
        return this.exec((await this.getClient(db)).llen(key));
    }

    public async scan(
        cursor: number | string,
        matchOption: 'match' | 'MATCH',
        pattern: string,
        db?: number
    ): Promise<[string, string[]]> {
        return this.exec((await this.getClient(db)).scan(cursor, matchOption, pattern));
    }

    public async scard(key: string, db?: number): Promise<number> {
        return this.exec((await this.getClient(db)).scard(key));
    }

    public async sscan(
        key: string,
        cursor: number | string,
        matchOption: 'match' | 'MATCH',
        pattern: string,
        db?: number
    ): Promise<[string, string[]]> {
        return this.exec((await this.getClient(db)).sscan(key, cursor, matchOption, pattern));
    }

    public async type(key: string, db?: number): Promise<string> {
        return this.exec((await this.getClient(db)).type(key));
    }

    public async zcard(key: string, db?: number): Promise<number> {
        return this.exec((await this.getClient(db)).zcard(key));
    }

    public async zrange(key: string, start: number, stop: number, db?: number): Promise<string[]> {
        return this.exec((await this.getClient(db)).zrange(key, start, stop, 'WITHSCORES'));
    }

    public async zscan(
        key: string,
        cursor: number | string,
        matchOption: 'match' | 'MATCH',
        pattern: string,
        db?: number
    ): Promise<[string, string[]]> {
        return this.exec((await this.getClient(db)).zscan(key, cursor, matchOption, pattern));
    }
}
