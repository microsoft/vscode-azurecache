// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { AzExtTreeItem, TreeItemIconPath } from 'vscode-azureextensionui';
import { StrKeyFilter } from '../../Strings';
import { FilterParentItem } from '../FilterParentItem';

/**
 * Tree item for a key filter.
 */
export class KeyFilterItem extends AzExtTreeItem {
    public static readonly contextValue = 'keyFilterItem';
    public static readonly commandId = 'azureCache.setKeyFilter';

    constructor(readonly parent: FilterParentItem) {
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
