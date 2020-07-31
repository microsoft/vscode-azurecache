// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { TreeItemIconPath } from 'vscode-azureextensionui';
import { KeyContentItem } from '../KeyContentItem';
import { RedisClusterNodeItem } from './RedisClusterNodeItem';
import { RedisDbItem } from './RedisDbItem';

/**
 * Tree item for any other datatypes.
 */
export class RedisOtherItem extends KeyContentItem {
    private static readonly contextValue = 'redisOtherItem';
    private static readonly commandId = 'azureCache.showUnsupportedItem';

    constructor(parent: RedisDbItem | RedisClusterNodeItem, key: string, private readonly type: string) {
        super(parent, key);
    }

    get commandId(): string {
        return RedisOtherItem.commandId;
    }

    get commandArgs(): unknown[] {
        return [];
    }

    get contextValue(): string {
        return RedisOtherItem.contextValue;
    }

    get description(): string {
        return `(${this.type})`;
    }

    get iconPath(): TreeItemIconPath {
        return new ThemeIcon('key');
    }

    get label(): string {
        return this.key;
    }
}
