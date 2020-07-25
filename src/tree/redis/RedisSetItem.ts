// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { AzExtTreeItem, IActionContext, TreeItemIconPath } from 'vscode-azureextensionui';
import { RedisClient } from '../../clients/RedisClient';
import { CollectionKeyItem } from '../CollectionKeyItem';
import { HashFieldFilterItem } from '../filter/HashFieldFilterItem';
import { RedisSetElemItem } from './RedisSetElemItem';
import { SetWebview } from '../../webview/SetWebview';

/**
 * Tree item for a set.
 */
export class RedisSetItem extends CollectionKeyItem {
    public static readonly contextValue = 'redisSetItem';
    public static readonly description = '(set)';

    private webview = new SetWebview(this);
    private elementsShown = 0;
    private scanCursor?: string = '0';

    get contextValue(): string {
        return RedisSetItem.contextValue;
    }

    get commandId(): string {
        return 'azureCache.viewSet';
    }

    get commandArgs(): unknown[] {
        return [this];
    }

    get description(): string {
        return RedisSetItem.description;
    }

    get iconPath(): TreeItemIconPath {
        return new ThemeIcon('key');
    }

    get label(): string {
        return this.key;
    }

    /**
     * Loads additional set elements as children by running the SSCAN command and keeping track of the current cursor.
     */
    public async loadMoreChildrenImpl(clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        if (clearCache) {
            this.scanCursor = '0';
            this.elementsShown = 0;
        }

        if (typeof this.scanCursor === 'undefined') {
            return [];
        }

        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);

        // Sometimes SCAN returns no results, so continue SCANNING until we receive results or we reach the end
        let curCursor = this.scanCursor;
        let scannedElems: string[] = [];

        do {
            [curCursor, scannedElems] = await client.sscan(this.key, curCursor, 'MATCH', '*', this.db);
        } while (curCursor !== '0' && scannedElems.length === 0);

        this.scanCursor = curCursor === '0' ? undefined : curCursor;

        const treeItems = scannedElems.map(
            (elem, index) => new RedisSetElemItem(this, this.elementsShown + index, elem)
        );

        this.elementsShown += scannedElems.length;
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

    public async showWebview(): Promise<void> {
        this.webview.reveal(this.key);
    }
}
