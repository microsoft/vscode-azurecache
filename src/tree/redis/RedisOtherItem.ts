// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { AzExtTreeItem, TreeItemIconPath } from 'vscode-azureextensionui';
import { RedisClusterNodeItem } from './RedisClusterNodeItem';
import { RedisDbItem } from './RedisDbItem';

/**
 * Tree item for any other datatypes.
 */
export class RedisOtherItem extends AzExtTreeItem {
    private static readonly contextValue = 'redisOtherItem';
    private static readonly commandId = 'azureCache.showUnsupportedItem';

    constructor(
        parent: RedisDbItem | RedisClusterNodeItem,
        private readonly key: string,
        private readonly type: string
    ) {
        super(parent);
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
