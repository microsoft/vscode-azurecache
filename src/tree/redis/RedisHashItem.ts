// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { TreeItemIconPath } from 'vscode-azureextensionui';
import { CollectionElement } from '../../../src-shared/CollectionElement';
import { RedisClient } from '../../clients/RedisClient';
import { CollectionWebview } from '../../webview/CollectionWebview';
import { CollectionKeyItem } from '../CollectionKeyItem';
import { FilterParentItem } from '../FilterParentItem';

/**
 * Tree item for a hash.
 */
export class RedisHashItem extends CollectionKeyItem implements FilterParentItem {
    private static readonly commandId = 'azureCache.viewHash';
    private static readonly contextValue = 'redisHashItem';
    private static readonly description = '(hash)';
    private static readonly incrementCount = 10;

    protected webview: CollectionWebview = new CollectionWebview(this, 'hash');
    private filterExpr = '*';
    private scanCursor?: string = '0';

    get contextValue(): string {
        return RedisHashItem.contextValue;
    }

    get commandId(): string {
        return RedisHashItem.commandId;
    }

    get commandArgs(): unknown[] {
        return [this];
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

    public async getSize(): Promise<number> {
        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);
        return client.hlen(this.key, this.db);
    }

    /**
     * Loads additional hash elements as children by running the HSCAN command and keeping track of the current cursor.
     */
    public async loadNextChildren(clearCache: boolean): Promise<CollectionElement[]> {
        if (clearCache) {
            this.scanCursor = '0';
        }

        if (typeof this.scanCursor === 'undefined') {
            return [];
        }

        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);

        let curCursor = this.scanCursor;
        const scannedFields: string[] = [];

        // Keep scanning until a total of at least 10 elements have been returned
        do {
            const result = await client.hscan(this.key, curCursor, 'MATCH', this.filterExpr, this.db);
            curCursor = result[0];
            scannedFields.push(...result[1]);
            // scannedFields contains field name and value, so divide by 2 to get number of values scanned
        } while (curCursor !== '0' && scannedFields.length / 2 < RedisHashItem.incrementCount);

        this.scanCursor = curCursor === '0' ? undefined : curCursor;

        const collectionElements: CollectionElement[] = [];
        let field = '';

        // HSCAN returns a single list alternating between the hash field name and the hash field value
        for (let index = 0; index < scannedFields.length; index++) {
            if (index % 2 === 0) {
                // Even indices contain the hash field name
                field = scannedFields[index];
            } else {
                // Odd indices contain the hash field value
                const collectionElement = {
                    id: field,
                    value: scannedFields[index],
                } as CollectionElement;
                collectionElements.push(collectionElement);
            }
        }

        return collectionElements;
    }

    public hasNextChildren(): boolean {
        return typeof this.scanCursor === 'string';
    }

    public getFilter(): string {
        return this.filterExpr;
    }

    public updateFilter(filterExpr: string): void {
        if (this.filterExpr !== filterExpr) {
            this.filterExpr = filterExpr;
        }
    }

    public reset(): void {
        this.filterExpr = '*';
        this.scanCursor = '0';
    }
}
