// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { WebviewCommand } from '../../src-shared/WebviewCommand';
import { WebviewView } from '../../src-shared/WebviewView';
import { ErrorReadKey } from '../Strings';
import { RedisStringItem } from '../tree/redis/RedisStringItem';
import { BaseWebview } from './BaseWebview';

/**
 * Webview for viewing string keys.
 */
export class StringWebview extends BaseWebview {
    protected viewType = 'string';

    constructor(private readonly parent: RedisStringItem, private readonly key: string) {
        super();
    }

    /**
     * Sends all the necessary data for the Cache Properties view.
     * @param parsedRedisResource The Redis resource
     */
    protected async sendData(): Promise<void> {
        this.postMessage(WebviewCommand.View, WebviewView.StringKey);
        this.postMessage(WebviewCommand.KeyType, 'string');
        this.postMessage(WebviewCommand.KeyName, this.key);
        await this.loadAndSendKey();
    }

    private async loadAndSendKey(): Promise<void> {
        const value = await this.parent.getValue();
        if (value === null) {
            vscode.window.showErrorMessage(ErrorReadKey);
            return;
        }
        this.postMessage(WebviewCommand.StringData, value);
    }

    /**
     * Refreshes the webview by retrieving the key again and resending it.
     */
    public async refresh(): Promise<void> {
        if (this.webviewPanel) {
            await this.loadAndSendKey();
        }
    }
}
