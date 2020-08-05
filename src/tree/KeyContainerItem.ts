// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AzExtParentTreeItem, AzExtTreeItem } from 'vscode-azureextensionui';
import { ParsedRedisResource } from '../../src-shared/ParsedRedisResource';
import { RedisClient } from '../clients/RedisClient';
import { AzureCacheItem } from './azure/AzureCacheItem';
import { RedisHashItem } from './redis/RedisHashItem';
import { RedisListItem } from './redis/RedisListItem';
import { RedisOtherItem } from './redis/RedisOtherItem';
import { RedisSetItem } from './redis/RedisSetItem';
import { RedisStringItem } from './redis/RedisStringItem';
import { RedisZSetItem } from './redis/RedisZSetItem';

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

    protected async createKeyItem(client: RedisClient, key: string): Promise<AzExtTreeItem> {
        const type = await client.type(key, this.db);

        if (type === 'string') {
            return new RedisStringItem(this, key);
        } else if (type === 'list') {
            return new RedisListItem(this, key);
        } else if (type === 'hash') {
            return new RedisHashItem(this, key);
        } else if (type === 'set') {
            return new RedisSetItem(this, key);
        } else if (type === 'zset') {
            return new RedisZSetItem(this, key);
        } else {
            return new RedisOtherItem(this, key, type);
        }
    }
}
