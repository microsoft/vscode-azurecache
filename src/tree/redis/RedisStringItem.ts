// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { TreeItemIconPath } from 'vscode-azureextensionui';
import { RedisClient } from '../../clients/RedisClient';
import { StringWebview } from '../../webview/StringWebview';
import { KeyContentItem } from '../KeyContentItem';

/**
 * Tree item for a string.
 */
export class RedisStringItem extends KeyContentItem {
    private static readonly contextValue = 'redisStringItem';
    private static readonly commandId = 'azureCache.viewString';
    private static readonly description = '(string)';

    private readonly webview = new StringWebview(this, this.key);

    get commandId(): string {
        return RedisStringItem.commandId;
    }

    get commandArgs(): unknown[] {
        return [this];
    }

    get contextValue(): string {
        return RedisStringItem.contextValue;
    }

    get iconPath(): TreeItemIconPath {
        return new ThemeIcon('key');
    }

    get description(): string {
        return RedisStringItem.description;
    }

    get label(): string {
        return this.key;
    }

    public showWebview(): Promise<void> {
        return this.webview.reveal(this.key);
    }

    public refreshImpl(): Promise<void> {
        return this.webview.refresh();
    }

    public async getValue(): Promise<string | null> {
        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);
        return client.get(this.key, this.db);
    }
}
