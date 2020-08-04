// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { BaseWebview } from './BaseWebview';
import { CollectionKeyItem } from '../tree/CollectionKeyItem';
import { SupportedKeyType } from '../SupportedKeyType';
import { CollectionWebviewData } from '../../src-shared/CollectionWebviewData';
import { RedisHashItem } from '../tree/redis/RedisHashItem';
import { WebviewCommand } from '../../src-shared/WebviewCommand';
import { WebviewMessage } from '../../src-shared/WebviewMessage';
import { WebviewView } from '../../src-shared/WebviewView';

/**
 * Webview for viewing collection type keys (lists, hashes, sets, zsets).
 */
export class CollectionWebview extends BaseWebview {
    protected viewType = this.type;

    constructor(private readonly parent: CollectionKeyItem, private readonly type: SupportedKeyType) {
        super();
    }

    /**
     * Sends all the necessary data for the Cache Properties view.
     * @param parsedRedisResource The Redis resource
     */
    protected async sendData(): Promise<void> {
        this.postMessage(WebviewCommand.View, WebviewView.CollectionKey);
        this.postMessage(WebviewCommand.KeyType, this.type);
        this.postMessage(WebviewCommand.KeyName, this.parent.key);
        this.postMessage(WebviewCommand.CollectionSize, await this.parent.getSize());
        await this.loadAndSendNextChildren(true);
    }

    /**
     * Processes incoming messages from webview.
     * @param message Webview message
     */
    protected async onDidReceiveMessage(message: WebviewMessage): Promise<void> {
        if (message.command === WebviewCommand.LoadMore) {
            // Load more elements, continuing from previous scan
            await this.loadAndSendNextChildren(false);
        } else if (message.command === WebviewCommand.FilterChange) {
            // Hash filter changed
            if (this.parent instanceof RedisHashItem) {
                this.parent.updateFilter(message.value as string);
                await this.loadAndSendNextChildren(true);
            }
        }
    }

    /**
     * Sends the next batch of collection elements to the webview.
     * @param clearCache Whether to load from the beginning
     */
    private async loadAndSendNextChildren(clearCache: boolean): Promise<void> {
        const elements = await this.parent.loadNextChildren(clearCache);
        const hasMore = this.parent.hasNextChildren();
        const collectionData = {
            data: elements,
            clearCache,
            hasMore,
        } as CollectionWebviewData;
        this.postMessage(WebviewCommand.CollectionData, collectionData);
    }

    /**
     * Refreshes the webview by re-sending collection elements to the webview.
     */
    public async refresh(): Promise<void> {
        if (this.webviewPanel) {
            const elements = await this.parent.loadNextChildren(true);
            const hasMore = this.parent.hasNextChildren();
            const collectionData = {
                data: elements,
                clearCache: true,
                hasMore,
            } as CollectionWebviewData;
            this.postMessage(WebviewCommand.CollectionData, collectionData);
        }
    }

    /**
     * Called when webview is disposed.
     */
    protected onDidDispose(): void {
        if (this.parent instanceof RedisHashItem) {
            this.parent.reset();
        }
    }
}
