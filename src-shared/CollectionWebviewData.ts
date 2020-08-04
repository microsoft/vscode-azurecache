// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CollectionElement } from './CollectionElement';

export interface CollectionWebviewData {
    data: CollectionElement[];
    clearCache: boolean;
    hasMore: boolean;
}
