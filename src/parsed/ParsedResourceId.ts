// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Represents components of an Azure cache resource ID.
 */
export interface ParsedResourceId {
    /**
     * Resource ID.
     */
    resourceId: string;
    /**
     * Subscription ID.
     */
    subscriptionId: string;
    /**
     * Resource group name.
     */
    resourceGroup: string;
    /**
     * Resource name.
     */
    name: string;
}
