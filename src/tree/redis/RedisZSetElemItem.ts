// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { v4 } from 'uuid';
import { KeyContentItem } from '../KeyContentItem';
import { RedisZSetItem } from './RedisZSetItem';

/**
 * Tree item for a sorted set element.
 */
export class RedisZSetElemItem extends KeyContentItem {
    public static readonly contextValue = 'redisZSetElemItem';
    public static readonly commandId = 'azureCache.showZSetItem';

    constructor(
        parent: RedisZSetItem,
        private readonly position: number,
        private readonly value: string,
        private readonly score: string
    ) {
        super(parent, parent.key);
    }

    get commandId(): string {
        return RedisZSetElemItem.commandId;
    }

    get commandArgs(): unknown[] {
        return [this.parsedRedisResource, this.db, this.key, this.position, this.value, this.score];
    }

    get contextValue(): string {
        return RedisZSetElemItem.contextValue;
    }

    get id(): string {
        return v4();
    }

    get label(): string {
        return this.score;
    }
}
