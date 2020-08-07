// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AzExtTreeItem } from 'vscode-azureextensionui';
import { CollectionElement } from '../../src-shared/CollectionElement';
import { ParsedRedisResource } from '../../src-shared/ParsedRedisResource';
import { CollectionWebview } from '../webview/CollectionWebview';
import { KeyContainerItem } from './KeyContainerItem';

/**
 * Base class for tree items that represent a collection-type key, like lists, sets, and hashes.
 */
export abstract class CollectionKeyItem extends AzExtTreeItem {
    /**
     * The Redis resource that the key is in.
     */
    readonly parsedRedisResource: ParsedRedisResource;
    /**
     * The DB number the key is in. For clustered caches this is undefined.
     */
    readonly db?: number;
    /**
     * The associated webview.
     */
    protected abstract readonly webview: CollectionWebview;

    constructor(readonly parent: KeyContainerItem, readonly key: string) {
        super(parent);
        this.parsedRedisResource = parent.parsedRedisResource;
        this.db = parent.db;
    }

    public showWebview(): Promise<void> {
        return this.webview.reveal(this.key);
    }

    public refreshImpl(): Promise<void> {
        return this.webview.refresh();
    }

    public abstract getSize(): Promise<number>;
    public abstract hasNextChildren(): boolean;
    public abstract loadNextChildren(clearCache: boolean): Promise<CollectionElement[]>;
}
