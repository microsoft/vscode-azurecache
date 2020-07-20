// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { AzExtTreeItem, IActionContext, TreeItemIconPath } from 'vscode-azureextensionui';
import { RedisClient } from '../../clients/RedisClient';
import { CollectionKeyItem } from '../CollectionKeyItem';
import { HashFieldFilterItem } from '../filter/HashFieldFilterItem';
import { FilterParentItem } from '../FilterParentItem';
import { RedisHashElemItem } from './RedisHashElemItem';

/**
 * Tree item for a hash.
 */
export class RedisHashItem extends CollectionKeyItem implements FilterParentItem {
    public static readonly contextValue = 'redisHashItem';
    public static readonly description = '(hash)';

    private filterExpr = '*';
    private scanCursor?: string = '0';

    get contextValue(): string {
        return RedisHashItem.contextValue;
    }

    get description(): string {
        return RedisHashItem.description;
    }

    get iconPath(): TreeItemIconPath {
        return new ThemeIcon('key');
    }

    get label(): string {
        return this.key;
    }

    /**
     * Loads additional hash elements as children by running the HSCAN command and keeping track of the current cursor.
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
        let curCursor = this.scanCursor;
        let scannedFields: string[] = [];

        do {
            [curCursor, scannedFields] = await client.hscan(this.key, curCursor, 'MATCH', this.filterExpr, this.db);
        } while (curCursor !== '0' && scannedFields.length === 0);

        this.scanCursor = curCursor === '0' ? undefined : curCursor;

        const treeItems = [];
        let field = '';

        // hscan returns a single list alternating between the hash field name and the hash field value
        for (let index = 0; index < scannedFields.length; index++) {
            if (index % 2 === 0) {
                // Even indices contain the hash field name
                field = scannedFields[index];
            } else {
                // Odd indices contain the hash field value
                treeItems.push(new RedisHashElemItem(this, field, scannedFields[index]));
            }
        }

        if (clearCache || this.scanCursor === '0') {
            treeItems.push(new HashFieldFilterItem(this));
        }

        return treeItems;
    }

    public hasMoreChildrenImpl(): boolean {
        return typeof this.scanCursor === 'string';
    }

    public compareChildrenImpl(item1: AzExtTreeItem, item2: AzExtTreeItem): number {
        if (item1 instanceof HashFieldFilterItem) {
            return -1;
        } else if (item2 instanceof HashFieldFilterItem) {
            return 1;
        }

        return 0;
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
