// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Interface that guarentees non-null properties of a RedisResource.
 * TODO: Figure out a way to use the same interface shared between webview-src and src.
 */
export interface ParsedRedisResource {
    resourceId: string;
    subscriptionId: string;
    resourceGroup: string;
    name: string;
    hostName: string;
    enableNonSslPort: boolean;
    port: number;
    sslPort: number;
    sku: string;
    location: string;
    redisVersion: string;
    provisioningState: string;
    cluster: boolean;
    shardCount: number;
    linkedServers: string[];
    accessKey: Promise<string | undefined>;
}
