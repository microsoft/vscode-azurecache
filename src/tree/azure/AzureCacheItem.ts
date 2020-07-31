// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    AzExtTreeItem,
    AzureParentTreeItem,
    GenericTreeItem,
    IActionContext,
    TreeItemIconPath,
} from 'vscode-azureextensionui';
import { CachePropsWebview } from '../../webview/CachePropsWebview';
import { RedisClient } from '../../clients/RedisClient';
import { RedisResourceClient } from '../../clients/RedisResourceClient';
import { ExtVars } from '../../ExtensionVariables';
import { ParsedRedisResource } from '../../../src-shared/ParsedRedisResource';
import { ErrorEmptyCache } from '../../Strings';
import * as ResourceUtils from '../../utils/ResourceUtils';
import { KeyFilterItem } from '../filter/KeyFilterItem';
import { FilterParentItem } from '../FilterParentItem';
import { RedisClusterNodeItem } from '../redis/RedisClusterNodeItem';
import { RedisDbItem } from '../redis/RedisDbItem';
import { AzureSubscriptionTreeItem } from './AzureSubscriptionTreeItem';
import path = require('path');

/**
 * Tree item for an Azure cache.
 */
export class AzureCacheItem extends AzureParentTreeItem implements FilterParentItem {
    public static contextValue = 'redisCache';
    private static commandId = 'azureCache.viewCacheInfoReact';

    private filterExpr: string;
    private isClustered: boolean;
    private webview: CachePropsWebview;

    constructor(
        parent: AzureSubscriptionTreeItem,
        readonly resClient: RedisResourceClient,
        public parsedRedisResource: ParsedRedisResource
    ) {
        super(parent);
        this.filterExpr = '*';
        this.isClustered = this.parsedRedisResource.cluster;
        this.webview = new CachePropsWebview();
    }

    get commandId(): string {
        return AzureCacheItem.commandId;
    }

    get commandArgs(): unknown[] {
        return [this];
    }

    get contextValue(): string {
        return AzureCacheItem.contextValue;
    }

    get description(): string {
        return `(${this.parsedRedisResource.hostName})`;
    }

    get iconPath(): TreeItemIconPath {
        return path.join(ExtVars.context.asAbsolutePath('resources'), 'azure-cache.svg');
    }

    get id(): string {
        return this.parsedRedisResource.resourceId;
    }

    get label(): string {
        return this.parsedRedisResource.name;
    }

    public async loadMoreChildrenImpl(clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource, true);

        if (this.isClustered) {
            const treeItems = [];
            const clusterNodeIds = client.clusterNodeIds;

            for (const nodeId of clusterNodeIds) {
                const port = (await client.getClusterNodeOptions(nodeId)).port;
                if (port) {
                    treeItems.push(new RedisClusterNodeItem(this, nodeId, port));
                }
            }

            treeItems.push(new KeyFilterItem(this));
            return treeItems;
        } else {
            // Parse active databases from INFO KEYSPACE command
            const dbRegex = /db([0-9]+)/gm;
            const infoKeyspace = await client.info('keyspace');
            const matches = infoKeyspace.match(dbRegex);

            if (!matches) {
                return [
                    new GenericTreeItem(this, {
                        label: ErrorEmptyCache,
                        contextValue: 'emptyCache',
                    }),
                ];
            }

            // Extract DB number (e.g. 'db20' to 20)
            const activeDbs = matches.map((match) => parseInt(match.split('db')[1]));
            // Map DB numbers to TreeItems
            const treeItems = activeDbs.map((db) => new RedisDbItem(this, db));
            return treeItems;
        }
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public compareChildrenImpl(item1: AzExtTreeItem, item2: AzExtTreeItem): number {
        // Always place the filter tree item as the first item
        if (item1 instanceof KeyFilterItem) {
            return -1;
        } else if (item2 instanceof KeyFilterItem) {
            return 1;
        }

        // Order cluster node tree items by their port numbers
        if (item1 instanceof RedisClusterNodeItem && item2 instanceof RedisClusterNodeItem) {
            return item1.port - item2.port;
        }

        // Otherwise for DB tree items, they are inherently ordered so just use the insertion order
        return 0;
    }

    public async refreshImpl(): Promise<void> {
        // Get updated ParsedRedisResource
        const { name, resourceGroup } = this.parsedRedisResource;
        this.parsedRedisResource = await this.resClient.getRedisResourceByName(resourceGroup, name);
        // Refresh webview (if open) with the new ParsedRedisResource
        await this.webview.refresh(this.parsedRedisResource);
    }

    public getFilter(): string {
        return this.filterExpr;
    }

    public updateFilter(filterExpr: string): void {
        if (this.filterExpr !== filterExpr) {
            this.filterExpr = filterExpr;
            this.refresh();
        }
    }

    public showCacheProperties(): void {
        this.webview.reveal(this.parsedRedisResource.name, this.parsedRedisResource);
    }

    public async getConnectionString(): Promise<string | undefined> {
        return ResourceUtils.getConnectionString(this.parsedRedisResource);
    }

    public disposeWebview(): void {
        this.webview.dispose();
    }
}
