// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { AzExtTreeItem, IActionContext, TreeItemIconPath } from 'vscode-azureextensionui';
import { RedisClient } from '../../clients/RedisClient';
import { CollectionKeyItem } from '../CollectionKeyItem';
import { RedisListElemItem } from './RedisListElemItem';

/**
 * Tree item for a list.
 */
export class RedisListItem extends CollectionKeyItem {
    public static readonly contextValue = 'redisListItem';
    public static readonly description = '(list)';
    private static readonly incrementCount = 10;

    private elementsShown = 0;
    private length = 0;

    get contextValue(): string {
        return RedisListItem.contextValue;
    }

    get description(): string {
        return RedisListItem.description;
    }

    get iconPath(): TreeItemIconPath {
        return new ThemeIcon('key');
    }

    get label(): string {
        return this.key;
    }

    /**
     * Loads additional list elements as children by keeping track of the list length and number of elements loaded so far.
     */
    public async loadMoreChildrenImpl(clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        if (clearCache) {
            const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);
            this.length = await client.llen(this.key, this.db);
            this.elementsShown = 0;
        }

        if (this.elementsShown === this.length) {
            return [];
        }

        // Construct tree items such that the numbering continues from the previously loaded items
        const min = this.elementsShown;
        const max = Math.min(this.elementsShown + RedisListItem.incrementCount, this.length);
        const treeItems = Array.from({ length: max - min }, (_, index) => new RedisListElemItem(this, index + min));
        this.elementsShown = max;
        return treeItems;
    }

    public hasMoreChildrenImpl(): boolean {
        return this.elementsShown !== this.length;
    }

    public compareChildrenImpl(item1: RedisListElemItem, item2: RedisListElemItem): number {
        return 0;
    }
}
