// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export enum WebviewCommand {
    FontUri = 'fontUri',
    View = 'view',
    // Cache Properties
    ParsedRedisResource = 'parsedRedisResource',
    AccessKeys = 'accessKeys',
    ConnectionString = 'connectionString',
    CopyText = 'copyText',
    // Data viewer
    KeyType = 'keyType',
    KeyName = 'keyName',
    CollectionSize = 'collectionSize',
    CollectionData = 'collectionData',
    FilterChange = 'filterChange',
    LoadMore = 'loadMore',
}
