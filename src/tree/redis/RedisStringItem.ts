// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { TreeItemIconPath } from 'vscode-azureextensionui';
import { KeyContentItem } from '../KeyContentItem';

/**
 * Tree item for a string.
 */
export class RedisStringItem extends KeyContentItem {
    private static readonly contextValue = 'redisStringItem';
    private static readonly commandId = 'azureCache.showStringItem';
    private static readonly description = '(string)';

    get commandId(): string {
        return RedisStringItem.commandId;
    }

    get commandArgs(): unknown[] {
        return [this.parsedRedisResource, this.db, this.key];
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
}
