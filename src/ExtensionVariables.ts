// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable @typescript-eslint/no-namespace */
import { ExtensionContext, TreeView } from 'vscode';
import { AzExtTreeDataProvider, AzExtTreeItem, IAzExtOutputChannel, IAzureUserInput } from 'vscode-azureextensionui';

/**
 * Namespace for common variables used throughout the extension. They must be initialized in the activate() method of extension.ts
 */
export namespace ExtVars {
    export const prefix = 'azureCache';

    export let context: ExtensionContext;
    export let outputChannel: IAzExtOutputChannel;
    export let ui: IAzureUserInput;
    export let ignoreBundle: boolean | undefined;

    export let treeDataProvider: AzExtTreeDataProvider;
    export let treeView: TreeView<AzExtTreeItem>;
}
