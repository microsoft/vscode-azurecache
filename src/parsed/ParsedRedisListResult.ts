// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ParsedRedisResource } from '../../shared/ParsedRedisResource';

/**
 * The response of list Redis operation, which uses the ParsedRedisResource wrapper.
 */
export interface ParsedRedisListResult extends Array<ParsedRedisResource> {
    /**
     * Link for next page of results.
     */
    readonly nextLink?: string;
}
