// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { KeyContentItem } from '../KeyContentItem';
import { RedisHashItem } from './RedisHashItem';

/**
 * Tree item for a hash element.
 */
export class RedisHashElemItem extends KeyContentItem {
    public static readonly contextValue = 'redisHashElemItem';
    public static readonly commandId = 'azureCache.showHashItem';

    constructor(parent: RedisHashItem, private readonly field: string, private readonly value: string) {
        super(parent, parent.key);
    }

    get commandId(): string {
        return RedisHashElemItem.commandId;
    }

    get commandArgs(): unknown[] {
        return [this.parsedRedisResource, this.db, this.key, this.field, this.value];
    }

    get contextValue(): string {
        return RedisHashElemItem.contextValue;
    }

    get label(): string {
        return this.field;
    }
}
