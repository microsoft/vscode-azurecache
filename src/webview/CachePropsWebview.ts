// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { ParsedRedisResource } from '../parsed/ParsedRedisResource';
import { getConnectionString } from '../utils/ResourceUtils';
import { AbstractWebview, IncomingMessage } from './AbstractWebview';

/**
 * Wrapper around a cache properties webview.
 */
export class CachePropsWebview extends AbstractWebview {
    get viewType(): string {
        return 'cacheProps';
    }

    /**
     * Refreshes the current webview with the given Redis resource information, if the webview is active.
     * @param parsedRedisResource The Redis resource
     */
    public async refresh(parsedRedisResource: ParsedRedisResource): Promise<void> {
        if (!this.webviewPanel) {
            return;
        }
        // Send resource, access key data to webview
        await this.sendData(parsedRedisResource);
    }

    protected onDidReceiveMessage(message: IncomingMessage): void {
        if (message.command === 'copy' && message.text) {
            vscode.env.clipboard.writeText(message.text);
        }
    }

    /**
     * Sends all the necessary data for the Cache Properties view.
     *
     * @param parsedRedisResource The Redis resource
     */
    protected async sendData(parsedRedisResource: ParsedRedisResource): Promise<void> {
        this.postMessage('contentType', 'properties');
        this.postMessage('parsedRedisResource', parsedRedisResource);
        this.postMessage('accessKey', await parsedRedisResource.accessKey);
        this.postMessage('connectionString', await getConnectionString(parsedRedisResource));
    }
}
