// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AbstractWebview, IncomingMessage } from './AbstractWebview';
import { RedisClient } from '../clients/RedisClient';
import { CollectionElement } from '../../shared/CollectionElement';
import { RedisZSetItem } from '../tree/redis/RedisZSetItem';

interface ZSetElement {
    value: string;
    score: string;
}

/**
 * Webview for viewing set elements.
 */
export class ZSetWebview extends AbstractWebview {
    viewType = 'zset';
    title = 'zsetWebview';
    private elements: ZSetElement[] = [];
    private size = 0;

    constructor(private readonly treeItem: RedisZSetItem) {
        super();
    }

    private async getCardinality(): Promise<number> {
        const client = await RedisClient.connectToRedisResource(this.treeItem.parsedRedisResource);
        return client.zcard(this.treeItem.key, this.treeItem.db);
    }

    private async loadMoreChildren(clearCache: boolean): Promise<ZSetElement[]> {
        const client = await RedisClient.connectToRedisResource(this.treeItem.parsedRedisResource);
        if (clearCache) {
            this.size = await client.zcard(this.treeItem.key, this.treeItem.db);
            this.elements = [];
        }

        if (this.elements.length === this.size) {
            return [];
        }

        // Want to show elements X through element min(length, X + 10) - 1
        const minIndex = this.elements.length;
        const maxIndex = Math.min(minIndex + 10, this.size) - 1;
        const scannedElems = await client.zrange(this.treeItem.key, minIndex, maxIndex, this.treeItem.db);
        const treeItems: ZSetElement[] = [];

        let value = '';

        // zrange returns a single list alternating between the key value and the key score
        for (let index = 0; index < scannedElems.length; index++) {
            if (index % 2 === 0) {
                // Even indices contain the key value
                value = scannedElems[index];
            } else {
                // Odd indices contain the key score, so construct the tree item here as the associated value is saved
                const element = {
                    value,
                    score: scannedElems[index],
                } as ZSetElement;
                treeItems.push(element);
            }
        }

        return treeItems;
    }

    /**
     * Sends all the necessary data for the Cache Properties view.
     *
     * @param parsedRedisResource The Redis resource
     */
    protected async sendData(): Promise<void> {
        this.postMessage('contentType', 'key');
        this.postMessage('type', 'zset');
        this.postMessage('key', this.treeItem.key);
        this.postMessage('size', await this.getCardinality());

        this.elements = await this.loadMoreChildren(true);
        const collectionElements = this.elements.map((elem) => {
            return {
                id: elem.score,
                value: elem.value,
            } as CollectionElement;
        });
        this.postMessage('data', collectionElements);
    }

    protected async onDidReceiveMessage(message: IncomingMessage): Promise<void> {
        if (message.command === 'loadMore') {
            const nextChildren = await this.loadMoreChildren(false);
            this.elements.push(...nextChildren);
            const collectionElements = this.elements.map((elem) => {
                return {
                    id: elem.score,
                    value: elem.value,
                } as CollectionElement;
            });
            this.postMessage('data', collectionElements);
        }
    }
}
