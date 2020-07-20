// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { KeyContentItem } from '../KeyContentItem';
import { RedisSetItem } from './RedisSetItem';

/**
 * Tree item for a set element.
 */
export class RedisSetElemItem extends KeyContentItem {
    public static readonly contextValue = 'redisSetElemItem';
    public static readonly commandId = 'azureCache.showSetItem';

    constructor(parent: RedisSetItem, private readonly index: number, private readonly value: string) {
        super(parent, parent.key);
    }

    get commandId(): string {
        return RedisSetElemItem.commandId;
    }

    get commandArgs(): unknown[] {
        return [this.parsedRedisResource, this.db, this.key, this.index, this.value];
    }

    get contextValue(): string {
        return RedisSetElemItem.contextValue;
    }

    get label(): string {
        return this.index.toString();
    }
}
