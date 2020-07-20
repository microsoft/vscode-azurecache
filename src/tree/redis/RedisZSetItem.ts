// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { AzExtTreeItem, IActionContext, TreeItemIconPath } from 'vscode-azureextensionui';
import { RedisClient } from '../../clients/RedisClient';
import { CollectionKeyItem } from '../CollectionKeyItem';
import { RedisZSetElemItem } from './RedisZSetElemItem';

/**
 * Tree item for a sorted set.
 */
export class RedisZSetItem extends CollectionKeyItem {
    public static readonly contextValue = 'redisZSetItem';
    public static readonly description = '(zset)';
    private static readonly incrementCount = 10;

    private filterExpr = '*';
    private length = 0;
    private elementsShown = 0;

    get contextValue(): string {
        return RedisZSetItem.contextValue;
    }

    get description(): string {
        return RedisZSetItem.description;
    }

    get iconPath(): TreeItemIconPath {
        return new ThemeIcon('key');
    }

    get label(): string {
        return this.key;
    }

    /**
     * Loads additional sorted set elements as children by running the ZRANGE command and keeping track of the current cursor.
     */
    public async loadMoreChildrenImpl(clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);

        if (clearCache) {
            this.length = await client.zcard(this.key, this.db);
            this.elementsShown = 0;
        }

        if (this.elementsShown === this.length) {
            return [];
        }

        // Want to show elements X through element min(length, X + 10) - 1
        const minIndex = this.elementsShown;
        const maxIndex = Math.min(this.elementsShown + RedisZSetItem.incrementCount, this.length) - 1;
        const scannedElems = await client.zrange(this.key, this.elementsShown, maxIndex, this.db);
        const treeItems = [];

        let value = '';

        // zrange returns a single list alternating between the key value and the key score
        for (let index = 0; index < scannedElems.length; index++) {
            if (index % 2 === 0) {
                // Even indices contain the key value
                value = scannedElems[index];
            } else {
                // Odd indices contain the key score, so construct the tree item here as the associated value is saved
                const position = minIndex + Math.floor(index / 2);
                treeItems.push(new RedisZSetElemItem(this, position, value, scannedElems[index]));
            }
        }

        this.elementsShown = maxIndex + 1;
        return treeItems;
    }

    public hasMoreChildrenImpl(): boolean {
        return this.elementsShown !== this.length;
    }

    public compareChildrenImpl(item1: AzExtTreeItem, item2: AzExtTreeItem): number {
        return 0;
    }

    public updateFilter(filterExpr: string): void {
        if (this.filterExpr !== filterExpr) {
            this.filterExpr = filterExpr;
            this.refresh();
        }
    }
}
