// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * All of the supported key data types.
 * Note: Bitmaps and HyperLogLogs count as 'string'.
 */
export type SupportedKeyType = 'string' | 'hash' | 'list' | 'set' | 'zset';
