// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { TreeItemIconPath } from 'vscode-azureextensionui';
import { RedisClient } from '../../clients/RedisClient';
import { CollectionElement } from '../../../src-shared/CollectionElement';
import { CollectionWebview } from '../../webview/CollectionWebview';
import { CollectionKeyItem } from '../CollectionKeyItem';

/**
 * Tree item for a sorted set.
 */
export class RedisZSetItem extends CollectionKeyItem {
    private static readonly commandId = 'azureCache.viewZSet';
    private static readonly contextValue = 'redisZSetItem';
    private static readonly description = '(zset)';
    private static readonly incrementCount = 10;

    protected webview: CollectionWebview = new CollectionWebview(this, 'zset');
    private length = 0;
    private elementsShown = 0;

    get contextValue(): string {
        return RedisZSetItem.contextValue;
    }

    get commandId(): string {
        return RedisZSetItem.commandId;
    }

    get commandArgs(): unknown[] {
        return [this];
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

    public async getSize(): Promise<number> {
        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);
        return client.zcard(this.key, this.db);
    }

    /**
     * Loads additional sorted set elements as children by running the ZRANGE command and keeping track of the current cursor.
     */
    public async loadNextChildren(clearCache: boolean): Promise<CollectionElement[]> {
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
        const scannedElems = await client.zrange(this.key, minIndex, maxIndex, this.db);
        const collectionElements: CollectionElement[] = [];

        let value = '';

        // zrange returns a single list alternating between the key value and the key score
        for (let index = 0; index < scannedElems.length; index++) {
            if (index % 2 === 0) {
                // Even indices contain the key value
                value = scannedElems[index];
            } else {
                // Odd indices contain the key score, so construct the tree item here as the associated value is saved
                const collectionElement = {
                    id: scannedElems[index],
                    value,
                } as CollectionElement;
                collectionElements.push(collectionElement);
            }
        }

        this.elementsShown = maxIndex + 1;
        return collectionElements;
    }

    public hasNextChildren(): boolean {
        return this.elementsShown !== this.length;
    }
}
