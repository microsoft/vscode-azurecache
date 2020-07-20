// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { RedisClient } from '../clients/RedisClient';
import { KeyContentProvider } from '../KeyContentProvider';
import { ParsedRedisResource } from '../parsed/ParsedRedisResource';
import { createKeyContentUri } from '../utils/UriUtils';
import { TestRedisClient } from './clients/TestRedisClient';
import sinon = require('sinon');
import assert = require('assert');

describe('KeyContentProvider', () => {
    let sandbox: sinon.SinonSandbox;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    const invalidUri = vscode.Uri.parse('azureCache://bad-uri');
    const validUri = vscode.Uri.parse(
        'azureCache:mycache.net/mykey?payload%3DeyJyZXNvdXJjZUlkIjoiL3N1YnNjcmlwdGlvbnMvMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwL3Jlc291cmNlR3JvdXBzL3Jlcy1ncm91cC9wcm92aWRlcnMvTWljcm9zb2Z0LkNhY2hlL1JlZGlzL215LWNhY2hlIiwiZGIiOjAsInR5cGUiOiJzdHJpbmciLCJrZXkiOiJteWtleSJ9'
    );
    const sampleParsedRedisResource: ParsedRedisResource = {
        resourceId:
            '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/res-group/providers/Microsoft.Cache/Redis/my-cache',
        subscriptionId: '00000000-0000-0000-0000-000000000000',
        resourceGroup: 'res-group',
        name: 'my-cache',
        hostName: 'mycache.net',
        enableNonSslPort: true,
        port: 6379,
        sslPort: 6380,
        sku: 'Premium P1',
        location: 'West US',
        redisVersion: 'Unknown',
        provisioningState: 'Unknown',
        cluster: false,
        shardCount: 0,
        linkedServers: [],
        accessKey: Promise.resolve('key'),
    };

    it('should return value of string key', async () => {
        // Setup stubs
        sandbox.stub(vscode.workspace, 'openTextDocument');
        sandbox.stub(vscode.window, 'showTextDocument');
        const stubRedisClient = new TestRedisClient();
        sandbox.stub(stubRedisClient, 'get').resolves('myValue');
        sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);

        const keyContentProvider = new KeyContentProvider();
        const uri = createKeyContentUri(sampleParsedRedisResource, 0, 'string', 'mykey');
        /**
         * Normally, calling showKey() will call vscode.workspace.openTextDocument, which will prompt VS Code to call
         * provideTextDocumentContent(), but since the tests run without the extension being activated, we call
         * provideTextDocumentContent() manually.
         */
        keyContentProvider.showKey(sampleParsedRedisResource, 0, 'string', 'mykey');
        const value = await keyContentProvider.provideTextDocumentContent(uri);
        assert.strictEqual(value, 'myValue');
        // Calling it again should fail as the Redis resource client property is cleared
        assert.rejects(keyContentProvider.provideTextDocumentContent(uri), Error);
    });

    it('should return value of list element', async () => {
        // Setup stubs
        sandbox.stub(vscode.workspace, 'openTextDocument');
        sandbox.stub(vscode.window, 'showTextDocument');
        const stubRedisClient = new TestRedisClient();
        sandbox.stub(stubRedisClient, 'lindex').resolves('myListValue');
        sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);

        const keyContentProvider = new KeyContentProvider();
        const uri = createKeyContentUri(sampleParsedRedisResource, 0, 'list', 'mykey', '0');

        keyContentProvider.showKey(sampleParsedRedisResource, 0, 'list', 'mykey');
        const value = await keyContentProvider.provideTextDocumentContent(uri);

        assert.strictEqual(value, 'myListValue');
        // Calling it again should fail as the currentResource property is cleared
        assert.rejects(keyContentProvider.provideTextDocumentContent(uri), Error);
    });

    it('should throw error if showing list element without index', async () => {
        // Setup stubs
        sandbox.stub(vscode.workspace, 'openTextDocument');
        sandbox.stub(vscode.window, 'showTextDocument');
        const stubRedisClient = new TestRedisClient();
        sandbox.stub(stubRedisClient, 'lindex').resolves('myListValue');
        sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);

        const keyContentProvider = new KeyContentProvider();
        // Leave out subkey parameter
        const uri = createKeyContentUri(sampleParsedRedisResource, 0, 'list', 'mykey');
        keyContentProvider.showKey(sampleParsedRedisResource, 0, 'list', 'mykey');

        assert.rejects(keyContentProvider.provideTextDocumentContent(uri), Error);
    });

    it('should return value of hash item', async () => {
        // Setup stubs
        sandbox.stub(vscode.workspace, 'openTextDocument');
        sandbox.stub(vscode.window, 'showTextDocument');
        const stubRedisClient = new TestRedisClient();
        sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);

        const keyContentProvider = new KeyContentProvider();
        const uri = createKeyContentUri(sampleParsedRedisResource, 0, 'hash', 'mykey', 'hashfield');
        keyContentProvider.showKey(sampleParsedRedisResource, 0, 'hash', 'mykey', 'hashValue', 'hashField');
        const value = await keyContentProvider.provideTextDocumentContent(uri);

        assert.strictEqual(value, 'hashValue');
        // Calling it again should fail as the currentResource property is cleared
        assert.rejects(keyContentProvider.provideTextDocumentContent(uri), Error);
    });

    it('should throw error if showing hash element without passing the value', async () => {
        // Setup stubs
        sandbox.stub(vscode.workspace, 'openTextDocument');
        sandbox.stub(vscode.window, 'showTextDocument');
        const stubRedisClient = new TestRedisClient();
        sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);

        const keyContentProvider = new KeyContentProvider();
        const uri = createKeyContentUri(sampleParsedRedisResource, 0, 'hash', 'mykey', 'hashfield');
        // Leave out hash item value
        keyContentProvider.showKey(sampleParsedRedisResource, 0, 'hash', 'mykey');

        assert.rejects(keyContentProvider.provideTextDocumentContent(uri), Error);
    });

    it('should return value of set element', async () => {
        // Setup stubs
        sandbox.stub(vscode.workspace, 'openTextDocument');
        sandbox.stub(vscode.window, 'showTextDocument');
        const stubRedisClient = new TestRedisClient();
        sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);

        const keyContentProvider = new KeyContentProvider();
        const uri = createKeyContentUri(sampleParsedRedisResource, 0, 'set', 'mykey', '0');
        keyContentProvider.showKey(sampleParsedRedisResource, 0, 'set', 'mykey', 'setValue', '0');
        const value = await keyContentProvider.provideTextDocumentContent(uri);

        assert.strictEqual(value, 'setValue');
        // Calling it again should fail as the currentResource property is cleared
        assert.rejects(keyContentProvider.provideTextDocumentContent(uri), Error);
    });

    it('should throw error if showing set element without passing the value', async () => {
        // Setup stubs
        sandbox.stub(vscode.workspace, 'openTextDocument');
        sandbox.stub(vscode.window, 'showTextDocument');
        const stubRedisClient = new TestRedisClient();
        sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);

        const keyContentProvider = new KeyContentProvider();
        const uri = createKeyContentUri(sampleParsedRedisResource, 0, 'set', 'mykey', '0');
        // Leave out the set element value
        keyContentProvider.showKey(sampleParsedRedisResource, 0, 'set', 'mykey');

        assert.rejects(keyContentProvider.provideTextDocumentContent(uri), Error);
    });

    it('should return value of zset element', async () => {
        // Setup stubs
        sandbox.stub(vscode.workspace, 'openTextDocument');
        sandbox.stub(vscode.window, 'showTextDocument');
        const stubRedisClient = new TestRedisClient();
        sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);

        const keyContentProvider = new KeyContentProvider();
        const uri = createKeyContentUri(sampleParsedRedisResource, 0, 'zset', 'mykey', '-100', '0');
        keyContentProvider.showKey(sampleParsedRedisResource, 0, 'zset', 'mykey', 'zsetValue', '-100', '0');
        const value = await keyContentProvider.provideTextDocumentContent(uri);

        assert.strictEqual(value, 'zsetValue');
        // Calling it again should fail as the currentResource property is cleared
        assert.rejects(keyContentProvider.provideTextDocumentContent(uri), Error);
    });

    it('should throw error if showing zset element without passing the value', async () => {
        // Setup stubs
        sandbox.stub(vscode.workspace, 'openTextDocument');
        sandbox.stub(vscode.window, 'showTextDocument');
        const stubRedisClient = new TestRedisClient();
        sandbox.stub(RedisClient, 'connectToRedisResource').resolves(stubRedisClient);

        const keyContentProvider = new KeyContentProvider();
        const uri = createKeyContentUri(sampleParsedRedisResource, 0, 'zset', 'mykey', '-100');
        // Leave out the set element value
        keyContentProvider.showKey(sampleParsedRedisResource, 0, 'zset', 'mykey');

        assert.rejects(keyContentProvider.provideTextDocumentContent(uri), Error);
    });

    it('should throw error if given invalid URI', () => {
        const keyContentProvider = new KeyContentProvider();
        assert.rejects(keyContentProvider.provideTextDocumentContent(invalidUri), Error);
    });

    it('should throw error if Redis resource client is not set prior to opening URI', () => {
        const keyContentProvider = new KeyContentProvider();
        assert.rejects(keyContentProvider.provideTextDocumentContent(validUri), Error);
    });
});
