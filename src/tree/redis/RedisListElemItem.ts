// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { KeyContentItem } from '../KeyContentItem';
import { RedisListItem } from './RedisListItem';

/**
 * Tree item for a list element.
 */
export class RedisListElemItem extends KeyContentItem {
    public static readonly contextValue = 'redisListElemItem';
    public static readonly commandId = 'azureCache.showListItem';

    constructor(parent: RedisListItem, private readonly index: number) {
        super(parent, parent.key);
    }

    get commandId(): string {
        return RedisListElemItem.commandId;
    }

    get commandArgs(): unknown[] {
        return [this.parsedRedisResource, this.db, this.key, this.index];
    }

    get contextValue(): string {
        return RedisListElemItem.contextValue;
    }

    get label(): string {
        return this.index.toString();
    }
}
