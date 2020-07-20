// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { RedisManagementClient } from 'azure-arm-rediscache';
import { createAzureClient, IActionContext, SubscriptionTreeItemBase } from 'vscode-azureextensionui';
import { RedisResourceClient } from '../../clients/RedisResourceClient';
import { ParsedRedisListResult } from '../../parsed/ParsedRedisListResult';
import { AzureCacheItem } from './AzureCacheItem';

/**
 * Tree item for an Azure subscription.
 */
export class AzureSubscriptionTreeItem extends SubscriptionTreeItemBase {
    private nextLink?: string;

    public hasMoreChildrenImpl(): boolean {
        return this.nextLink !== undefined;
    }

    public async loadMoreChildrenImpl(clearCache: boolean, _context: IActionContext): Promise<AzureCacheItem[]> {
        if (clearCache) {
            this.nextLink = undefined;
        }

        const rmClient = createAzureClient(this.root, RedisManagementClient);
        const resClient = new RedisResourceClient(rmClient);
        const redisCollection: ParsedRedisListResult =
            typeof this.nextLink === 'undefined'
                ? await resClient.listResources()
                : await resClient.listNextResources(this.nextLink);
        this.nextLink = redisCollection.nextLink;

        return redisCollection.map((parsedRedisResource) => new AzureCacheItem(this, resClient, parsedRedisResource));
    }
}
