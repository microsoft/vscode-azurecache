// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ParsedRedisResource } from '../../shared/ParsedRedisResource';

/**
 * Returns StackExchange.Redis connection string.
 *
 * @param parsedRedisResource The Redis resource.
 * @param accessKey The access key/password
 */
export async function getConnectionString(parsedRedisResource: ParsedRedisResource): Promise<string | undefined> {
    const accessKey = await parsedRedisResource.accessKey;
    if (!accessKey) {
        return undefined;
    }

    const { hostName, sslPort } = parsedRedisResource;
    return `${hostName}:${sslPort},password=${accessKey},ssl=True,abortConnect=False`;
}
