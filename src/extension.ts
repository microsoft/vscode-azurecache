// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import {
    AzExtTreeDataProvider,
    AzExtTreeItem,
    AzureUserInput,
    createAzExtOutputChannel,
    IActionContext,
    registerCommand,
    registerUIExtensionVariables,
} from 'vscode-azureextensionui';
import { ExtVars } from './ExtensionVariables';
import { textInput } from './Input';
import { KeyContentProvider } from './KeyContentProvider';
import { ParsedRedisResource } from './parsed/ParsedRedisResource';
import * as Strings from './Strings';
import { AzureAccountTreeItem } from './tree/azure/AzureAccountTreeItem';
import { AzureCacheItem } from './tree/azure/AzureCacheItem';
import { FilterParentItem } from './tree/FilterParentItem';
import { RedisClient } from './clients/RedisClient';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    ExtVars.context = context;
    ExtVars.ignoreBundle = false;
    ExtVars.ui = new AzureUserInput(context.globalState);
    ExtVars.outputChannel = createAzExtOutputChannel('Azure Cache', ExtVars.prefix);
    context.subscriptions.push(ExtVars.outputChannel);
    registerUIExtensionVariables(ExtVars);

    ExtVars.keyContentProvider = new KeyContentProvider();
    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(ExtVars.prefix, ExtVars.keyContentProvider)
    );

    const azureAccountTreeItem = new AzureAccountTreeItem();
    context.subscriptions.push(azureAccountTreeItem);

    ExtVars.treeDataProvider = new AzExtTreeDataProvider(azureAccountTreeItem, `${ExtVars.prefix}.loadMore`);
    ExtVars.treeView = vscode.window.createTreeView(ExtVars.prefix, { treeDataProvider: ExtVars.treeDataProvider });
    context.subscriptions.push(ExtVars.treeView);

    context.subscriptions.push(
        vscode.commands.registerCommand('azureCache.setKeyFilter', async (treeItem: FilterParentItem) => {
            const currentFilterExpr = treeItem.getFilter();
            const input = await textInput(
                '*',
                Strings.StrPromptKeyFilter,
                /**
                 * TODO: Here and elsewhere: make this more localization-friendly as some localities might put things
                 *       in a different order (e.g. filter expression text going before the 'Current:' string).
                 */
                `${Strings.StrCurrent}: ${currentFilterExpr}`
            );
            if (input) {
                treeItem.updateFilter(input);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('azureCache.setHashFieldFilter', async (redisHashItem: FilterParentItem) => {
            const currentFilterExpr = redisHashItem.getFilter();
            const input = await textInput(
                '*',
                Strings.StrPromptHashFieldFilter,
                `${Strings.StrCurrent}: ${currentFilterExpr}`
            );
            if (input) {
                redisHashItem.updateFilter(input);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('azureCache.viewCacheInfoReact', async (azureCacheItem: AzureCacheItem) => {
            azureCacheItem.showCacheProperties();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'azureCache.showStringItem',
            async (parsedRedisResource: ParsedRedisResource, db: number | undefined, key: string) => {
                await ExtVars.keyContentProvider.showKey(parsedRedisResource, db, 'string', key);
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'azureCache.showHashItem',
            async (
                parsedRedisResource: ParsedRedisResource,
                db: number | undefined,
                key: string,
                field: string,
                value: string
            ) => {
                await ExtVars.keyContentProvider.showKey(parsedRedisResource, db, 'hash', key, value, field);
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'azureCache.showListItem',
            async (parsedRedisResource: ParsedRedisResource, db: number | undefined, key: string, index: number) => {
                await ExtVars.keyContentProvider.showKey(
                    parsedRedisResource,
                    db,
                    'list',
                    key,
                    undefined,
                    index.toString()
                );
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'azureCache.showSetItem',
            async (
                parsedRedisResource: ParsedRedisResource,
                db: number | undefined,
                key: string,
                index: number,
                value: string
            ) => {
                await ExtVars.keyContentProvider.showKey(parsedRedisResource, db, 'set', key, value, index.toString());
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'azureCache.showZSetItem',
            async (
                parsedRedisResource: ParsedRedisResource,
                db: number | undefined,
                key: string,
                position: number,
                value: string,
                score: string
            ) => {
                await ExtVars.keyContentProvider.showKey(
                    parsedRedisResource,
                    db,
                    'zset',
                    key,
                    value,
                    position.toString(),
                    score
                );
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('azureCache.showUnsupportedItem', () => {
            vscode.window.showInformationMessage(Strings.ErrorUnsupportedKeyType);
        })
    );

    registerCommand(
        'azureCache.copyConnectionString',
        async (actionContext: IActionContext, treeItem?: AzureCacheItem) => {
            if (!treeItem) {
                treeItem = (await ExtVars.treeDataProvider.showTreeItemPicker(
                    AzureCacheItem.contextValue,
                    actionContext
                )) as AzureCacheItem;
            }

            const connectionString = await treeItem.getConnectionString();
            if (connectionString) {
                vscode.env.clipboard.writeText(connectionString);
            } else {
                vscode.window.showErrorMessage(Strings.ErrorConnectionString);
            }
        }
    );

    registerCommand('azureCache.loadMore', (actionContext: IActionContext, treeItem: AzExtTreeItem) =>
        ExtVars.treeDataProvider.loadMore(treeItem, actionContext)
    );

    registerCommand('azureCache.refresh', (_actionContext: IActionContext, treeItem?: AzExtTreeItem) =>
        ExtVars.treeDataProvider.refresh(treeItem)
    );

    registerCommand('azureCache.openInPortal', async (actionContext: IActionContext, treeItem?: AzureCacheItem) => {
        if (!treeItem) {
            treeItem = (await ExtVars.treeDataProvider.showTreeItemPicker(
                AzureCacheItem.contextValue,
                actionContext
            )) as AzureCacheItem;
        }

        await treeItem.openInPortal();
    });

    registerCommand('azureCache.selectSubscriptions', () => {
        vscode.commands.executeCommand('azure-account.selectSubscriptions');
    });
}

// This method is called when extension is deactivated
export function deactivate(): Promise<void> {
    // Disconnect active Redis connections
    return RedisClient.disposeClients();
}
