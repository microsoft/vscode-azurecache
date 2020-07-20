// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { RedisClient } from './clients/RedisClient';
import { ParsedRedisResource } from './parsed/ParsedRedisResource';
import * as Strings from './Strings';
import { SupportedKeyType } from './SupportedKeyType';
import { createKeyContentUri, decodeUri } from './utils/UriUtils';

/**
 * Provides the contents of Redis keys in TextDocuments.
 */
export class KeyContentProvider implements vscode.TextDocumentContentProvider {
    // Holds the ParsedRedisResource to be used for the next provideTextDocumentContent call
    private currentResource?: ParsedRedisResource;
    // Holds the key value to be used for the next provideTextDocumentContent call
    private currentValue?: string;
    // Event emitter
    private onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();

    /**
     * Used to prevent key contents from being cached.
     */
    onDidChange = this.onDidChangeEmitter.event;

    /**
     * Provides the contents of the key that is encoded in the given URI.
     * @param uri The URI
     */
    async provideTextDocumentContent(uri: vscode.Uri): Promise<string | null> {
        let value: string | null = null;

        try {
            // Parse URI to get the cache's resource ID and key information
            const { db, key, type, subkey } = decodeUri(uri);

            if (!this.currentResource) {
                throw new Error(Strings.ErrorCurrentResource);
            }

            // Establish connection to cache
            const client = await RedisClient.connectToRedisResource(this.currentResource);

            if (type === 'string') {
                value = await client.get(key, db);
            } else if (type === 'list') {
                if (!subkey) {
                    throw new Error(Strings.ErrorMissingSubkey);
                }
                value = await client.lindex(key, parseInt(subkey), db);
            } else if (type === 'hash' || type === 'set' || type === 'zset') {
                // For hash, set, and sorted set types, the key value must already be set in currentValue
                if (typeof this.currentValue === 'undefined') {
                    throw new Error(Strings.ErrorCurrentValue);
                }
                value = this.currentValue;
            }
            if (value === null) {
                await vscode.window.showErrorMessage(Strings.ErrorReadKey);
            }
        } catch (e) {
            await vscode.window.showErrorMessage(e.toString());
        } finally {
            // Reset values
            this.currentResource = undefined;
            this.currentValue = undefined;
        }

        return value;
    }

    /**
     * Shows the contents of the given key in a TextDocument.
     *
     * @param parsedRedisResource The ParsedRedisResource containing cache's info
     * @param db The database number (undefined if clustered cache)
     * @param type The key type
     * @param key The key
     * @param value The key's value (for certain datatypes)
     * @param subkey The subkey (for collection type keys)
     * @param displayedSubkey Alternative subkey that is displayed in the subkey part of the URI path (in [square brackets])
     */
    public async showKey(
        parsedRedisResource: ParsedRedisResource,
        db: number | undefined,
        type: SupportedKeyType,
        key: string,
        value?: string,
        subkey?: string,
        displayedSubkey?: string
    ): Promise<void> {
        this.currentValue = value;
        this.currentResource = parsedRedisResource;
        const uri = createKeyContentUri(parsedRedisResource, db, type, key, subkey, displayedSubkey);
        /**
         * Without the next line, if the user refreshes a list item after pushing a new element to it, accessing element 0 would
         * still show the previous element 0 value. Basically, it tells VS Code to not cache contents of keys.
         */
        this.onDidChangeEmitter.fire(uri);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, { preserveFocus: true, preview: false });
    }
}
