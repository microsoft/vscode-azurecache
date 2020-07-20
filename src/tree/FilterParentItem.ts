// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AzExtParentTreeItem } from 'vscode-azureextensionui';

/**
 * Common interface for a tree item that contains a child filter item.
 */
export interface FilterParentItem extends AzExtParentTreeItem {
    getFilter(): string;
    updateFilter(filterExpr: string): void;
}
