// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Common interface for a tree item that contains a child filter item.
 */
export interface FilterParentItem {
    getFilter(): string;
    updateFilter(filterExpr: string): void;
}
