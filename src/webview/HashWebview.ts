// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AbstractWebview, IncomingMessage } from './AbstractWebview';
import { RedisClient } from '../clients/RedisClient';
import { CollectionElement } from '../../shared/CollectionElement';
import { RedisHashItem } from '../tree/redis/RedisHashItem';

interface HashElement {
    field: string;
    value: string;
}

/**
 * Webview for viewing set elements.
 */
export class HashWebview extends AbstractWebview {
    viewType = 'hash';
    title = 'hashWebview';
    private scanCursor: string | undefined = '0';
    private elements: HashElement[] = [];

    constructor(private readonly treeItem: RedisHashItem) {
        super();
    }

    private async getCardinality(): Promise<number> {
        const client = await RedisClient.connectToRedisResource(this.treeItem.parsedRedisResource);
        return client.hlen(this.treeItem.key, this.treeItem.db);
    }

    private async loadMoreChildren(clearCache: boolean): Promise<HashElement[]> {
        if (clearCache) {
            this.scanCursor = '0';
        }

        if (typeof this.scanCursor === 'undefined') {
            return [];
        }

        const client = await RedisClient.connectToRedisResource(this.treeItem.parsedRedisResource);

        // Sometimes SCAN returns no results, so continue SCANNING until we receive results or we reach the end
        let curCursor = this.scanCursor;
        let scannedFields: string[] = [];

        do {
            [curCursor, scannedFields] = await client.hscan(
                this.treeItem.key,
                curCursor,
                'MATCH',
                this.treeItem.getFilter(),
                this.treeItem.db
            );
        } while (curCursor !== '0' && scannedFields.length === 0);

        this.scanCursor = curCursor === '0' ? undefined : curCursor;

        const treeItems: HashElement[] = [];
        let field = '';

        // hscan returns a single list alternating between the hash field name and the hash field value
        for (let index = 0; index < scannedFields.length; index++) {
            if (index % 2 === 0) {
                // Even indices contain the hash field name
                field = scannedFields[index];
            } else {
                // Odd indices contain the hash field value
                const hashElement = {
                    field,
                    value: scannedFields[index],
                } as HashElement;
                treeItems.push(hashElement);
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
        this.postMessage('type', 'hash');
        this.postMessage('key', this.treeItem.key);
        this.postMessage('size', await this.getCardinality());

        this.elements = await this.loadMoreChildren(true);
        const collectionElements = this.elements.map((elem) => {
            return {
                id: elem.field,
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
                    id: elem.field,
                    value: elem.value,
                } as CollectionElement;
            });
            this.postMessage('data', collectionElements);
        }
    }
}
