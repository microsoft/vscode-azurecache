// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ParsedRedisResource } from '../../src-shared/ParsedRedisResource';
import { ParsedConnectionStrings } from '../../src-shared/ParsedConnectionStrings';

/**
 * Returns primary and secondary StackExchange.Redis connection strings.
 *
 * @param parsedRedisResource The Redis resource
 */
export async function getConnectionStrings(
    parsedRedisResource: ParsedRedisResource
): Promise<ParsedConnectionStrings | undefined> {
    const accessKeys = await parsedRedisResource.accessKeys;
    if (typeof accessKeys === 'undefined') {
        return undefined;
    }

    const { hostName, sslPort } = parsedRedisResource;
    const { primaryKey, secondaryKey } = accessKeys;
    return {
        primaryConnectionString: `${hostName}:${sslPort},password=${primaryKey},ssl=True,abortConnect=False`,
        secondaryConnectionString: `${hostName}:${sslPort},password=${secondaryKey},ssl=True,abortConnect=False`,
    } as ParsedConnectionStrings;
}
