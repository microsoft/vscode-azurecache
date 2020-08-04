// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { AzExtTreeItem, IActionContext, TreeItemIconPath } from 'vscode-azureextensionui';
import { RedisClient } from '../../clients/RedisClient';
import { StrDatabaseAbbrv } from '../../Strings';
import { KeyFilterItem } from '../KeyFilterItem';
import { FilterParentItem } from '../FilterParentItem';
import { KeyContainerItem } from '../KeyContainerItem';
import { RedisHashItem } from './RedisHashItem';
import { RedisListItem } from './RedisListItem';
import { RedisOtherItem } from './RedisOtherItem';
import { RedisSetItem } from './RedisSetItem';
import { RedisStringItem } from './RedisStringItem';
import { RedisZSetItem } from './RedisZSetItem';

/**
 * Tree item for a database in a non-clustered cache.
 */
export class RedisDbItem extends KeyContainerItem implements FilterParentItem {
    private static readonly contextValue = 'redisDb';

    private filterExpr = '*';
    private scanCursor?: string = '0';

    get contextValue(): string {
        return RedisDbItem.contextValue;
    }

    get iconPath(): TreeItemIconPath {
        return new ThemeIcon('database');
    }

    get label(): string {
        return `${StrDatabaseAbbrv} ${this.db}`;
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
            [curCursor, scannedKeys] = await client.scan(curCursor, 'MATCH', this.filterExpr, this.db);
        } while (curCursor !== '0' && scannedKeys.length === 0);

        this.scanCursor = curCursor === '0' ? undefined : curCursor;
        const treeItems = await Promise.all(scannedKeys.map(async (key) => this.createLocalRedisKey(client, key)));

        if (clearCache || this.scanCursor === '0') {
            treeItems.push(new KeyFilterItem(this));
        }

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
        const type = await client.type(key, this.db);

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

    public getFilter(): string {
        return this.filterExpr;
    }

    public updateFilter(filterExpr: string): void {
        if (this.filterExpr !== filterExpr) {
            this.filterExpr = filterExpr;
            this.refresh();
        }
    }
}
