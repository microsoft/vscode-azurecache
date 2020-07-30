// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AbstractWebview, IncomingMessage } from './AbstractWebview';
import { CollectionKeyItem } from '../tree/CollectionKeyItem';
import { SupportedKeyType } from '../SupportedKeyType';
import { CollectionWebviewPayload } from '../../shared/CollectionWebviewPayload';

/**
 * Webview for viewing set elements.
 */
export class CollectionWebview extends AbstractWebview {
    protected viewType = this.type;

    constructor(private readonly parent: CollectionKeyItem, private readonly type: SupportedKeyType) {
        super();
    }

    /*
    private async getCardinality(): Promise<number> {
        const client = await RedisClient.connectToRedisResource(this.treeItem.parsedRedisResource);
        return client.llen(this.treeItem.key, this.treeItem.db);
    }

    private async loadMoreChildren(clearCache: boolean): Promise<ListElement[]> {
        const client = await RedisClient.connectToRedisResource(this.treeItem.parsedRedisResource);

        if (clearCache) {
            this.length = await client.llen(this.treeItem.key, this.treeItem.db);
        }

        if (this.elements.length === this.length) {
            return [];
        }

        // Construct tree items such that the numbering continues from the previously loaded items
        const min = this.elements.length;
        const max = Math.min(this.elements.length + 10 - 1, this.length);
        const values = await client.lrange(this.treeItem.key, min, max, this.treeItem.db);

        return values.map(
            (val): ListElement => {
                return {
                    value: val,
                };
            }
        );
    }
    */

    /**
     * Sends all the necessary data for the Cache Properties view.
     *
     * @param parsedRedisResource The Redis resource
     */
    protected async sendData(): Promise<void> {
        this.postMessage('contentType', 'key');
        this.postMessage('type', this.type);
        this.postMessage('key', this.parent.key);
        this.postMessage('size', await this.parent.getSize());
        await this.loadAndSendNextChildren(true);
    }

    protected async onDidReceiveMessage(message: IncomingMessage): Promise<void> {
        if (message.command === 'loadMore') {
            await this.loadAndSendNextChildren(false);
        }
    }

    private async loadAndSendNextChildren(clearCache: boolean): Promise<void> {
        const elements = await this.parent.loadNextChildren(clearCache);
        const hasMore = this.parent.hasNextChildren();
        const collectionPayload = {
            data: elements,
            hasMore,
        } as CollectionWebviewPayload;
        this.postMessage('data', collectionPayload);
    }
}
