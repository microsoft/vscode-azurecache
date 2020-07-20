// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Interface that guarentees non-null properties of a RedisResource.
 *
 * Where possible, use ParsedRedisResource instead of RedisResource because all of the RedisResource proeprties
 * are optional and using it would involve having to do a bunch of null-checks and error handling.
 */
export interface ParsedRedisResource {
    /**
     * Resource ID.
     */
    resourceId: string;
    /**
     * Azure subscription ID.
     */
    subscriptionId: string;
    /**
     * Resource group name.
     */
    resourceGroup: string;
    /**
     * Resource name.
     */
    name: string;
    /**
     * Host name.
     */
    hostName: string;
    /**
     * Whether non-SSL port is enabled.
     */
    enableNonSslPort: boolean;
    /**
     * Non-SSL port (the same even if enableNonSslPort is false).
     */
    port: number;
    /**
     * SSL port.
     */
    sslPort: number;
    /**
     * Full SKU.
     */
    sku: string;
    /**
     * Cache location.
     */
    location: string;
    /**
     * Version string of the Redis version. May have value of 'Unknown' if undetermined.
     */
    redisVersion: string;
    /**
     * Redis instance provisioning status. May have value of 'Unknown' if undetermined.
     */
    provisioningState: string;
    /**
     * Whether it is a clustered cache.
     */
    cluster: boolean;
    /**
     * Number of shards (0 for a non-clustered cache).
     */
    shardCount: number;
    /**
     * List of the resource IDs of the linked servers associated with the cache.
     */
    linkedServers: string[];
    /**
     * Access key for the resource. Promise may resolve with undefined if user does not have write access to resource.
     */
    accessKey: Promise<string | undefined>;
}
