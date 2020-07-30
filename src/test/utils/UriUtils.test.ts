// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as assert from 'assert';
import * as vscode from 'vscode';
import { ParsedRedisResource } from '../../../shared/ParsedRedisResource';
import { createKeyContentUri, decodeUri } from '../../utils/UriUtils';

describe('URI Utils', () => {
    const hostName = 'my-cache.redis.cache.windows.net';
    const parsedRedisResource: ParsedRedisResource = {
        resourceId:
            '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/res-group/providers/Microsoft.Cache/Redis/my-cache',
        subscriptionId: '00000000-0000-0000-0000-000000000000',
        resourceGroup: 'res-group',
        name: 'my-cache',
        hostName,
        port: 6379,
        enableNonSslPort: true,
        sslPort: 6380,
        sku: 'P1 Premium',
        location: 'East US',
        redisVersion: '4.0.0',
        provisioningState: 'Succeeded',
        cluster: false,
        shardCount: 0,
        linkedServers: [],
        accessKey: Promise.resolve('key'),
    };

    describe('createKeyContentUri', () => {
        it('should properly encode given parameters', () => {
            const uri = createKeyContentUri(parsedRedisResource, 12, 'zset', 'mykey', 'subkey', 'altsubkey');
            assert.strictEqual(
                uri.query,
                'payload=eyJyZXNvdXJjZUlkIjoiL3N1YnNjcmlwdGlvbnMvMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwL3Jlc291cmNlR3JvdXBzL3Jlcy1ncm91cC9wcm92aWRlcnMvTWljcm9zb2Z0LkNhY2hlL1JlZGlzL215LWNhY2hlIiwiZGIiOjEyLCJ0eXBlIjoienNldCIsImtleSI6Im15a2V5Iiwic3Via2V5Ijoic3Via2V5In0%3D'
            );
        });

        it('should sanitize URI path', () => {
            const uri = createKeyContentUri(parsedRedisResource, 0, 'string', 'a#b? c/d\\e');
            assert.strictEqual(uri.path, 'my-cache.redis.cache.windows.net/a_b_ c_d_e');
        });

        it('should generate valid URI for strings', () => {
            const uri = createKeyContentUri(parsedRedisResource, 0, 'string', 'mykey');
            assert.strictEqual(uri.path, 'my-cache.redis.cache.windows.net/mykey');
            assert.strictEqual(uri.scheme, 'azureCache');
        });

        it('should generate valid URI for lists', () => {
            const uri = createKeyContentUri(parsedRedisResource, 0, 'list', 'mykey', '10');
            assert.strictEqual(uri.path, 'my-cache.redis.cache.windows.net/mykey[10]');
            assert.strictEqual(uri.scheme, 'azureCache');
        });

        it('should generate valid URI for sets', () => {
            const uri = createKeyContentUri(parsedRedisResource, 0, 'set', 'mykey', '10');
            assert.strictEqual(uri.path, 'my-cache.redis.cache.windows.net/mykey[10]');
            assert.strictEqual(uri.scheme, 'azureCache');
        });

        it('should generate valid URI for hashes', () => {
            const uri = createKeyContentUri(parsedRedisResource, 0, 'hash', 'mykey', 'hashfield');
            assert.strictEqual(uri.path, 'my-cache.redis.cache.windows.net/mykey[hashfield]');
            assert.strictEqual(uri.scheme, 'azureCache');
        });

        it('should generate valid URI for sorted sets', () => {
            const uri = createKeyContentUri(parsedRedisResource, 0, 'zset', 'mykey', '5', '-100');
            assert.strictEqual(uri.path, 'my-cache.redis.cache.windows.net/mykey[-100]');
            assert.strictEqual(uri.scheme, 'azureCache');
        });
    });

    describe('decodeUri', () => {
        it('should throw error if given bad query params', () => {
            const uriMissingQuery = vscode.Uri.parse('azureCache:host.net/mykey', true);
            assert.throws(() => decodeUri(uriMissingQuery), Error);
            const uriMissingPayload = vscode.Uri.parse('azureCache:host.net/mykey?badpayload=test', true);
            assert.throws(() => decodeUri(uriMissingPayload), Error);
        });

        it('should properly encode given parameters', () => {
            const uriStr =
                'azureCache:host.net/mykey?payload=eyJyZXNvdXJjZUlkIjoicmVzLWlkIiwiZGIiOjEsInR5cGUiOiJrZXl0eXBlIiwia2V5IjoibXlrZXkiLCJzdWJrZXkiOiJteXN1YmtleSJ9';
            const uri = vscode.Uri.parse(uriStr, true);
            const expectedPayload = {
                resourceId: 'res-id',
                db: 1,
                type: 'keytype',
                key: 'mykey',
                subkey: 'mysubkey',
            };
            const payload = decodeUri(uri);
            assert.deepStrictEqual(payload, expectedPayload);
        });
    });
});
