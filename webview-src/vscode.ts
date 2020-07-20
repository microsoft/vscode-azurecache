// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * acquireVsCodeApi() is a function that is provided by VS Code webview API.
 * We must assume that it exists for us to use in the webview JS.
 */
declare const acquireVsCodeApi: () => any;
export const vscode = acquireVsCodeApi();
