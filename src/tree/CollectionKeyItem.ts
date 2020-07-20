// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AzExtParentTreeItem } from 'vscode-azureextensionui';
import { ParsedRedisResource } from '../parsed/ParsedRedisResource';
import { RedisClusterNodeItem } from './redis/RedisClusterNodeItem';
import { RedisDbItem } from './redis/RedisDbItem';

/**
 * Base class for tree items that represent a collection-type key, like lists, sets, and hashes.
 */
export abstract class CollectionKeyItem extends AzExtParentTreeItem {
    /**
     * The Redis resource that the key is in.
     */
    readonly parsedRedisResource: ParsedRedisResource;
    /**
     * The DB number the key is in. For clustered caches this is undefined.
     */
    readonly db?: number;

    constructor(readonly parent: RedisDbItem | RedisClusterNodeItem, readonly key: string) {
        super(parent);
        this.parsedRedisResource = parent.parsedRedisResource;
        this.db = parent.db;
    }
}
