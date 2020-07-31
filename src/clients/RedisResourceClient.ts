// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import RedisManagementClient from 'azure-arm-rediscache';
import { RedisListResult, RedisResource } from 'azure-arm-rediscache/lib/models';
import { ExtVars } from '../ExtensionVariables';
import { ParsedRedisListResult } from '../parsed/ParsedRedisListResult';
import { ParsedRedisResource } from '../../src-shared/ParsedRedisResource';
import { ParsedResourceId } from '../parsed/ParsedResourceId';
import * as Strings from '../Strings';

/**
 * Type guard to ensure given value is defined.
 * @param value Value
 */
function isDefined<T>(value: T | undefined): value is T {
    return typeof value !== 'undefined';
}

/**
 * Wrapper class around a RedisManagementClient that handles retrieving Redis resources and access keys belonging
 * to an Azure subscription.
 *
 * Note that the get methods return ParsedRedisResource, which contains most of the important properties of
 * RedisResource except that all of the properties are not undefined.
 */
export class RedisResourceClient {
    constructor(private readonly rmClient: RedisManagementClient) {}

    /**
     * Retrieves the ParsedRedisResource associated with the given Redis resource ID.
     * @param resourceId The resource ID
     */
    public getRedisResourceById(resourceId: string): Promise<ParsedRedisResource> {
        const { resourceGroup, name } = this.parseResourceId(resourceId);
        return this.getRedisResourceByName(resourceGroup, name);
    }

    /**
     * Retrieves the ParsedRedisResource associated with the given resource group and resource name.
     * @param resourceGroup Resource group name
     * @param name Resource name
     */
    public async getRedisResourceByName(resourceGroup: string, name: string): Promise<ParsedRedisResource> {
        const redisResource = await this.rmClient.redis.get(resourceGroup, name);
        return this.parseRedisResource(redisResource);
    }

    /**
     * Retrieves an access key for the given Redis resource. Returns undefined if user does not have write access to cache.
     * @param resourceGroup Resource group name
     * @param name Resource name
     */
    public async getAccessKey(resourceGroup: string, name: string): Promise<string | undefined> {
        try {
            const allAccessKeys = await this.rmClient.redis.listKeys(resourceGroup, name);
            // Use the primary key or secondary key, whichever exists
            const accessKey = allAccessKeys.primaryKey ?? allAccessKeys.secondaryKey;
            return accessKey;
        } catch {
            return undefined;
        }
    }

    /**
     * Gets all Redis resources in the subscription.
     */
    public async listResources(): Promise<ParsedRedisListResult> {
        const resources = await this.rmClient.redis.list();
        return this.parseRedisListResult(resources);
    }

    /**
     * Gets all Redis resources in the subscription.
     * @param nextLink The NextLink from the previous successful list resources operation.
     */
    public async listNextResources(nextLink: string): Promise<ParsedRedisListResult> {
        const resources = await this.rmClient.redis.listNext(nextLink);
        return this.parseRedisListResult(resources);
    }

    /**
     * Parses RedisListResult into ParsedRedisListResult which contains ParsedRedisResources.
     * @param resources Response of a list Redis operation
     */
    private async parseRedisListResult(resources: RedisListResult): Promise<ParsedRedisListResult> {
        const parsedResources: ParsedRedisResource[] = [];

        for (const resource of resources) {
            try {
                const parsedRedisResource = await this.parseRedisResource(resource);
                parsedResources.push(parsedRedisResource);
            } catch (e) {
                ExtVars.outputChannel.appendLine(e);
            }
        }

        // Since the list/listNext methods are paginated, augment the list with nextLink (the next page of results)
        const listResult: ParsedRedisListResult = Object.assign(parsedResources, { nextLink: resources.nextLink });
        return listResult;
    }

    /**
     * Parses RedisResource into structure where properties are guarenteed to not be undefined.
     * Everywhere else in the extension should directly interact with ParsedRedisResource, not RedisResource.
     *
     * @param redisResource RedisResource
     */
    private async parseRedisResource(redisResource: RedisResource): Promise<ParsedRedisResource> {
        if (!redisResource.id) {
            throw new Error(Strings.ErrorMissingResourceId);
        }

        if (!redisResource.hostName) {
            throw new Error(Strings.ErrorMissingHostName);
        }

        if (!redisResource.name) {
            throw new Error(Strings.ErrorMissingName);
        }

        /**
         * Check if enableNonSslPort is undefined because boolean 'false' is falsy.
         * For port numbers, it's okay to throw the error if they are 0 or undefined.
         */
        if (typeof redisResource.enableNonSslPort === 'undefined' || !redisResource.port || !redisResource.sslPort) {
            throw new Error(Strings.ErrorMissingPortInfo);
        }

        const { name, resourceGroup, subscriptionId } = this.parseResourceId(redisResource.id);
        const accessKey = this.getAccessKey(resourceGroup, name);
        const linkedServers = redisResource.linkedServers;
        const linkedServerIds = linkedServers?.map((server) => server.id).filter(isDefined);

        let cluster: boolean;
        let shardCount: number;

        // Note: a shard count of 1 is still a clustered cache
        if (typeof redisResource.shardCount === 'number' && redisResource.shardCount > 0) {
            cluster = true;
            shardCount = redisResource.shardCount;
        } else {
            cluster = false;
            shardCount = 0;
        }

        return {
            resourceId: redisResource.id,
            subscriptionId,
            resourceGroup,
            name,
            hostName: redisResource.hostName,
            enableNonSslPort: redisResource.enableNonSslPort,
            port: redisResource.port,
            sslPort: redisResource.sslPort,
            sku: `${redisResource.sku.name} ${redisResource.sku.family}${redisResource.sku.capacity}`,
            location: redisResource.location,
            // TODO: These may need to be localized on the webview side
            redisVersion: redisResource.redisVersion ?? 'Unknown',
            provisioningState: redisResource.provisioningState ?? 'Unknown',
            cluster,
            shardCount,
            linkedServers: linkedServerIds ?? [],
            accessKey,
        };
    }

    /**
     * Parses the given resource ID into a ParsedResourceId structure.
     * @param resourceId Resource ID of an Azure cache
     */
    private parseResourceId(resourceId: string): ParsedResourceId {
        // E.g. /subscriptions/{my-subscription-guid}/resourceGroups/{my-resource-name}/providers/Microsoft.Cache/Redis/{my-cache-name}
        const regex = /\/subscriptions\/([^/]+)\/resourceGroups\/([^/]+)\/providers\/Microsoft\.Cache\/[^/]+\/([^/]+)/i;
        const matches = resourceId.match(regex);

        // There should be 4 matches: the entire match, subscription ID, resource group, and resource name
        if (!matches || matches.length < 4) {
            throw new Error(Strings.ErrorInvalidResourceId);
        }

        const subscriptionId = matches[1];
        const resourceGroup = matches[2];
        const name = matches[3];

        return {
            resourceId,
            subscriptionId,
            resourceGroup,
            name,
        };
    }
}
