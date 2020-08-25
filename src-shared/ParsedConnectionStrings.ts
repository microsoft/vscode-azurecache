// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Represents primary and secondary connection strings.
 */
export interface ParsedConnectionStrings {
    /**
     * Primary connection string.
     */
    primaryConnectionString: string;
    /**
     * Secondary connection string.
     */
    secondaryConnectionString: string;
}
