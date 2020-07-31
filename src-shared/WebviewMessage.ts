// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { WebviewCommand } from './WebviewCommand';

/**
 * Represents data passed between the extension and webview.
 */
export interface WebviewMessage {
    command: WebviewCommand;
    value: unknown;
}
