// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AzureAccountTreeItemBase, ISubscriptionContext, SubscriptionTreeItemBase } from 'vscode-azureextensionui';
import { AzureSubscriptionTreeItem } from './AzureSubscriptionTreeItem';

/**
 * Tree item for an Azure account (the root).
 */
export class AzureAccountTreeItem extends AzureAccountTreeItemBase {
    public createSubscriptionTreeItem(root: ISubscriptionContext): SubscriptionTreeItemBase {
        return new AzureSubscriptionTreeItem(this, root);
    }
}
