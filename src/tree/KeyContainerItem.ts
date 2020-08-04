// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AzExtParentTreeItem } from 'vscode-azureextensionui';
import { ParsedRedisResource } from '../../src-shared/ParsedRedisResource';
import { AzureCacheItem } from './azure/AzureCacheItem';

/**
 * Base class for tree items that are direct parents of tree items that hold Redis keys.
 */
export abstract class KeyContainerItem extends AzExtParentTreeItem {
    /**
     * The associated Redis resource.
     */
    readonly parsedRedisResource: ParsedRedisResource;
    /**
     * The associated DB number. For clustered caches this is undefined.
     */
    readonly db?: number;

    constructor(readonly parent: AzureCacheItem, db?: number) {
        super(parent);
        this.parsedRedisResource = parent.parsedRedisResource;
        this.db = db;
    }
}
