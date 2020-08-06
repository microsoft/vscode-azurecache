// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { AzExtTreeItem, TreeItemIconPath, AzExtParentTreeItem } from 'vscode-azureextensionui';
import { StrKeyFilter } from '../../Strings';
import { FilterParentItem } from '../FilterParentItem';

/**
 * Tree item for a key filter, which is used in two situations:
 *
 * 1. As a child element of AzureCacheItem if it's a clustered cache.
 * 2. As a child element of RedisDbItem if it's a non-clustered cache.
 */
export class KeyFilterItem extends AzExtTreeItem {
    private static readonly contextValue = 'keyFilterItem';
    private static readonly commandId = 'azureCache.setKeyFilter';

    constructor(readonly parent: AzExtParentTreeItem & FilterParentItem) {
        super(parent);
    }

    get commandId(): string {
        return KeyFilterItem.commandId;
    }

    get commandArgs(): unknown[] {
        return [this.parent];
    }

    get contextValue(): string {
        return KeyFilterItem.contextValue;
    }

    get iconPath(): TreeItemIconPath {
        return new ThemeIcon('filter');
    }

    get label(): string {
        return `${StrKeyFilter}: ${this.parent.getFilter()}`;
    }
}
