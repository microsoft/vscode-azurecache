// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as assert from 'assert';
import { getConnectionStrings } from '../../utils/ResourceUtils';
import * as Shared from '../Shared';
import { ParsedConnectionStrings } from '../../../src-shared/ParsedConnectionStrings';

describe('ResourceUtils', () => {
    describe('getConnectionString', () => {
        it('should properly return connection string for resource with access key', async () => {
            const expectedConnectionStrings: ParsedConnectionStrings = {
                primaryConnectionString:
                    'my-cache.redis.cache.windows.net:6380,password=key1,ssl=True,abortConnect=False',
                secondaryConnectionString:
                    'my-cache.redis.cache.windows.net:6380,password=key2,ssl=True,abortConnect=False',
            };
            assert.deepStrictEqual(
                await getConnectionStrings(Shared.createResourceWithKey()),
                expectedConnectionStrings
            );
        });

        it('should return undefined if resource does not have access key', async () => {
            assert.strictEqual(await getConnectionStrings(Shared.createResourceWithoutKey()), undefined);
        });
    });
});
