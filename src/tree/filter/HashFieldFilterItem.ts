// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { AzExtTreeItem, TreeItemIconPath } from 'vscode-azureextensionui';
import { StrHashFieldFilter } from '../../Strings';
import { RedisHashItem } from '../redis/RedisHashItem';

/**
 * Tree item for a hash field filter.
 */
export class HashFieldFilterItem extends AzExtTreeItem {
    public static readonly contextValue = 'hashFieldFilterItem';
    public static readonly commandId = 'azureCache.setHashFieldFilter';

    constructor(readonly parent: RedisHashItem) {
        super(parent);
    }

    get commandId(): string {
        return HashFieldFilterItem.commandId;
    }

    get commandArgs(): unknown[] {
        return [this.parent];
    }

    get contextValue(): string {
        return HashFieldFilterItem.contextValue;
    }

    get iconPath(): TreeItemIconPath {
        return new ThemeIcon('filter');
    }

    get label(): string {
        return `${StrHashFieldFilter}: ${this.parent.getFilter()}`;
    }
}
