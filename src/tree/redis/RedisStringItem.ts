// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { AzExtTreeItem, TreeItemIconPath } from 'vscode-azureextensionui';
import { ParsedRedisResource } from '../../../src-shared/ParsedRedisResource';
import { RedisClient } from '../../clients/RedisClient';
import { StringWebview } from '../../webview/StringWebview';
import { KeyContainerItem } from '../KeyContainerItem';

/**
 * Tree item for a string.
 */
export class RedisStringItem extends AzExtTreeItem {
    private static readonly contextValue = 'redisStringItem';
    private static readonly commandId = 'azureCache.viewString';
    private static readonly description = '(string)';

    private readonly webview = new StringWebview(this, this.key);
    private readonly parsedRedisResource: ParsedRedisResource;
    private readonly db?: number;

    constructor(readonly parent: KeyContainerItem, private readonly key: string) {
        super(parent);
        this.parsedRedisResource = parent.parsedRedisResource;
        this.db = parent.db;
    }

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
