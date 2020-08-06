// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { AzExtTreeItem, IActionContext, TreeItemIconPath } from 'vscode-azureextensionui';
import { RedisClient } from '../../clients/RedisClient';
import { StrShard, StrUnknownShard } from '../../Strings';
import { AzureCacheItem } from '../azure/AzureCacheItem';
import { KeyFilterItem } from '../filter/KeyFilterItem';
import { FilterParentItem } from '../FilterParentItem';
import { KeyContainerItem } from '../KeyContainerItem';
import { RedisHashItem } from './RedisHashItem';
import { RedisListItem } from './RedisListItem';
import { RedisOtherItem } from './RedisOtherItem';
import { RedisSetItem } from './RedisSetItem';
import { RedisStringItem } from './RedisStringItem';
import { RedisZSetItem } from './RedisZSetItem';

/**
 * Tree item for a shard in a clustered cache.
 */
export class RedisClusterNodeItem extends KeyContainerItem {
    private static readonly contextValue = 'redisClusterNode';
    private static readonly description = '(node)';

    private scanCursor?: string;
    private shard?: number;

    constructor(
        parent: AzureCacheItem & FilterParentItem,
        filterChangeEmitter: vscode.EventEmitter<void>,
        readonly nodeId: string,
        readonly port: number
    ) {
        super(parent);
        this.scanCursor = '0';

        if (port >= 10000) {
            /**
             * Determine shard number from the port number.
             * E.g. Ports 13000-13001 => Shard 0
             *            13002-13003 => Shard 1
             *            etc.
             */
            const lastTwoDigits = this.port % 100;
            const shardNumber = Math.floor(lastTwoDigits / 2);
            this.shard = shardNumber;
        }

        // Refresh tree item after filter expression changes
        filterChangeEmitter.event(() => {
            this.refresh();
        });
    }

    get id(): string {
        return this.nodeId;
    }

    get contextValue(): string {
        return RedisClusterNodeItem.contextValue;
    }

    get description(): string {
        if (this.port) {
            return `(${this.port})`;
        }
        return RedisClusterNodeItem.description;
    }

    get iconPath(): TreeItemIconPath {
        return new vscode.ThemeIcon('server');
    }

    get label(): string {
        if (typeof this.shard === 'number') {
            return `${StrShard} ${this.shard}`;
        }

        return StrUnknownShard;
    }

    /**
     * Loads additional keys as child elements by running the SCAN command and keeping track of the current cursor.
     */
    public async loadMoreChildrenImpl(clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        if (clearCache) {
            this.scanCursor = '0';
        }

        if (typeof this.scanCursor === 'undefined') {
            return [];
        }

        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);

        // Sometimes SCAN returns no results, so continue SCANNING until we receive results or we reach the end
        // TODO: Sometimes the # elements returned is very little, so we can do additional scans if needed
        let curCursor = this.scanCursor;
        let scannedKeys: string[] = [];

        do {
            [curCursor, scannedKeys] = await client.clusterScan(
                this.nodeId,
                curCursor,
                'MATCH',
                this.parent.getFilter()
            );
        } while (curCursor !== '0' && scannedKeys.length === 0);

        this.scanCursor = curCursor === '0' ? undefined : curCursor;
        const treeItems = await Promise.all(scannedKeys.map((key) => this.createLocalRedisKey(client, key)));

        return treeItems;
    }

    public hasMoreChildrenImpl(): boolean {
        return typeof this.scanCursor === 'string';
    }

    public compareChildrenImpl(item1: AzExtTreeItem, item2: AzExtTreeItem): number {
        if (item1 instanceof KeyFilterItem) {
            return -1;
        } else if (item2 instanceof KeyFilterItem) {
            return 1;
        }

        return 0;
    }

    private async createLocalRedisKey(client: RedisClient, key: string): Promise<AzExtTreeItem> {
        const type = await client.type(key);

        if (type === 'string') {
            return new RedisStringItem(this, key);
        } else if (type === 'list') {
            return new RedisListItem(this, key);
        } else if (type === 'hash') {
            return new RedisHashItem(this, key);
        } else if (type === 'set') {
            return new RedisSetItem(this, key);
        } else if (type === 'zset') {
            return new RedisZSetItem(this, key);
        } else {
            return new RedisOtherItem(this, key, type);
        }
    }
}
