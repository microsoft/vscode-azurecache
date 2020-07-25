// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { RedisSetItem } from '../tree/redis/RedisSetItem';
import { AbstractWebview, IncomingMessage } from './AbstractWebview';
import { RedisClient } from '../clients/RedisClient';
import { CollectionElement } from '../CollectionElement';

/**
 * Webview for viewing set elements.
 */
export class SetWebview extends AbstractWebview {
    viewType = 'set';
    title = 'setWebview';
    private scanCursor: string | undefined = '0';
    private elements: string[] = [];

    constructor(private readonly treeItem: RedisSetItem) {
        super();
    }

    private async getCardinality(): Promise<number> {
        const client = await RedisClient.connectToRedisResource(this.treeItem.parsedRedisResource);
        return client.scard(this.treeItem.key, this.treeItem.db);
    }

    private async loadMoreChildren(clearCache: boolean): Promise<string[]> {
        if (clearCache) {
            this.scanCursor = '0';
        }

        if (typeof this.scanCursor === 'undefined') {
            return [];
        }

        const client = await RedisClient.connectToRedisResource(this.treeItem.parsedRedisResource);

        // Sometimes SCAN returns no results, so continue SCANNING until we receive results or we reach the end
        let curCursor = this.scanCursor;
        let scannedElems: string[] = [];

        do {
            [curCursor, scannedElems] = await client.sscan(
                this.treeItem.key,
                curCursor,
                'MATCH',
                '*',
                this.treeItem.db
            );
        } while (curCursor !== '0' && scannedElems.length === 0);

        this.scanCursor = curCursor === '0' ? undefined : curCursor;
        return scannedElems;
    }

    /**
     * Sends all the necessary data for the Cache Properties view.
     *
     * @param parsedRedisResource The Redis resource
     */
    protected async sendData(): Promise<void> {
        this.postMessage('contentType', 'key');
        this.postMessage('type', 'set');
        this.postMessage('key', this.treeItem.key);
        this.postMessage('size', await this.getCardinality());

        this.elements = await this.loadMoreChildren(true);
        const collectionElements = this.elements.map((elem) => {
            return {
                value: elem,
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
                    value: elem,
                } as CollectionElement;
            });
            this.postMessage('data', collectionElements);
        }
    }
}