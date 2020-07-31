// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { URLSearchParams } from 'url';
import * as vscode from 'vscode';
import { ExtVars } from '../ExtensionVariables';
import { ParsedRedisResource } from '../../src-shared/ParsedRedisResource';
import { ErrorInvalidUri } from '../Strings';
import { SupportedKeyType } from '../SupportedKeyType';

/**
 * Represents the data included in a show-key request.
 */
interface ShowKeyPayload {
    /**
     * The resource ID of the Azure cache
     */
    resourceId: string;
    /**
     * The database number (undefined for a clustered cache)
     */
    db?: number;
    /**
     * The type of the key
     */
    type: SupportedKeyType;
    /**
     * The Redis key
     */
    key: string;
    /**
     * The subkey in the context of collection types (hash field, list index, set/zset position)
     * The value is undefined for a string key.
     */
    subkey?: string;
}

/**
 * Generates a URI for a request to show the contents of a Redis key.
 *
 * An example of a valid URI:
 * azureCache:mycache.redis.cache.windows.net/uri-friendly-keyname[uri-friendly-subkey]?payload={Base64-encoded ShowKeyPayload}
 *
 * @param parsedRedisResource The Redis resource
 * @param db DB number if non-clustered cache, otherwise undefined
 * @param type Key type
 * @param key Key name
 * @param subkey The subkey for collection type keys (lists => index number, hashes => field name, sets => position number)
 * @param displayedSubkey An alternative subkey that is displayed in the subkey part of the URI path (uri-friendly-subkey in above example)
 */
export function createKeyContentUri(
    parsedRedisResource: ParsedRedisResource,
    db: number | undefined,
    type: SupportedKeyType,
    key: string,
    subkey?: string,
    displayedSubkey?: string
): vscode.Uri {
    // If displayedSubkey is not provided, then just use subkey
    displayedSubkey = displayedSubkey ?? subkey;
    const { resourceId, hostName } = parsedRedisResource;
    /**
     * The text that appears as the text document's title. If the key happens to be the empty string (which is allowed),
     * then the title is set to a blank space. This is because otherwise, the tab's title would show as the cache's host name.
     */
    const uriSafeKey = sanitizeString(key) || ' ';
    // The subkey that is displayed in square brackets after uriSafeKey. This is not shown for string keys.
    const uriSafeSubkey = displayedSubkey ? `[${sanitizeString(displayedSubkey)}]` : '';

    // Construct payload to be passed in the query params as Base64
    const payload: ShowKeyPayload = {
        resourceId,
        db,
        type,
        key,
        subkey,
    };
    const payloadStr = JSON.stringify(payload);
    const payloadB64 = Buffer.from(payloadStr).toString('base64');

    /**
     * Need to encode the Base64 because the '+' character is valid in Base64 but represents a space in the query string.
     * It is double-encoded because:
     *   1. The URI passed in KeyContentProvider.provideTextDocumentContent will already have been implicitly decoded once
     *   2. In the decodeUri function, it uses URLSearchParams to parse the query string which, does another round of decoding
     */
    const encodedB64 = encodeURIComponent(encodeURIComponent(payloadB64));
    const uriString = `${ExtVars.prefix}:${hostName}/${uriSafeKey}${uriSafeSubkey}?payload=${encodedB64}`;
    return vscode.Uri.parse(uriString, true);
}

/**
 * Parses a URI into its components.
 *
 * Example URI:
 * azureCache:mycache.redis.cache.windows.net/uri-friendly-keyname[uri-friendly-subkey]?payload={base64-encoded payload}
 *
 * @param uri URI
 */
export function decodeUri(uri: vscode.Uri): ShowKeyPayload {
    if (!uri.query) {
        throw new Error(ErrorInvalidUri);
    }

    /**
     * Note that decodeURIComponent is not called here because the uri parameter will already have been decoded once implicitly.
     * Secondly, constructing the URLSearchParams below implicitly decodes the given string another time.
     */
    const urlParams = new URLSearchParams(uri.query);
    const payloadB64 = urlParams.get('payload');

    if (!payloadB64) {
        throw new Error(ErrorInvalidUri);
    }

    const payloadStr = Buffer.from(payloadB64, 'base64').toString('utf8');
    const payload: ShowKeyPayload = JSON.parse(payloadStr);
    return payload;
}

/**
 * Replaces problematic URI characters ('#', '?', '/', '\') with underscore.
 * @param contents The string to be sanitized
 */
function sanitizeString(contents: string): string {
    return contents.replace(/[#?/\\]/gi, '_');
}
