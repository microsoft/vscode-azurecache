// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AzExtTreeItem } from 'vscode-azureextensionui';
import { ParsedRedisResource } from '../parsed/ParsedRedisResource';
import { CollectionKeyItem } from './CollectionKeyItem';
import { RedisClusterNodeItem } from './redis/RedisClusterNodeItem';
import { RedisDbItem } from './redis/RedisDbItem';

/**
 * Base class for tree items that represents "leaf" nodes (items that hold the contents of a Redis key).
 * Although the properties are the same as in CollectionItem, this class extends from AzExtTreeItem
 * instead of AzExtParentTreeItem.
 */
export abstract class KeyContentItem extends AzExtTreeItem {
    /**
     * The Redis resource that the key is in.
     */
    protected readonly parsedRedisResource: ParsedRedisResource;
    /**
     * The DB number the key is in. For clustered caches this is undefined.
     */
    protected readonly db?: number;
    /**
     * The key name.
     */
    protected readonly key: string;

    constructor(readonly parent: RedisDbItem | RedisClusterNodeItem | CollectionKeyItem, key: string) {
        super(parent);
        this.parsedRedisResource = parent.parsedRedisResource;
        this.db = parent.db;
        this.key = key;
    }
}
