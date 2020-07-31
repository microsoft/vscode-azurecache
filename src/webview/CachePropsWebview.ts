// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { ParsedRedisResource } from '../../src-shared/ParsedRedisResource';
import { WebviewCommand } from '../../src-shared/WebviewCommand';
import { WebviewMessage } from '../../src-shared/WebviewMessage';
import { WebviewView } from '../../src-shared/WebviewView';
import { getConnectionString } from '../utils/ResourceUtils';
import { BaseWebview } from './BaseWebview';

/**
 * Webview for the cache properties view.
 */
export class CachePropsWebview extends BaseWebview {
    protected viewType = 'cacheProps';

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

    /**
     * Handle incoming messages.
     */
    protected onDidReceiveMessage(message: WebviewMessage): void {
        if (message.command === WebviewCommand.CopyText && message.value) {
            vscode.env.clipboard.writeText(message.value as string);
        }
    }

    /**
     * Sends all the necessary data for the Cache Properties view.

     * @param parsedRedisResource The Redis resource
     */
    protected async sendData(parsedRedisResource: ParsedRedisResource): Promise<void> {
        this.postMessage(WebviewCommand.View, WebviewView.CacheProperties);
        this.postMessage(WebviewCommand.ParsedRedisResource, parsedRedisResource);
        this.postMessage(WebviewCommand.AccessKey, await parsedRedisResource.accessKey);
        this.postMessage(WebviewCommand.ConnectionString, await getConnectionString(parsedRedisResource));
    }
}
