// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as path from 'path';
import * as vscode from 'vscode';
import { ExtVars } from './ExtensionVariables';
import { ParsedRedisResource } from './parsed/ParsedRedisResource';
import { ErrorWebviewUninit, StrProperties } from './Strings';
import { getConnectionString } from './utils/ResourceUtils';
import crypto = require('crypto');

/**
 * Represents data passed from webview to extension.
 */
interface IncomingMessage {
    command: string;
    text: string;
}

/**
 * Represents data passed from extension to webview.
 */
interface OutgoingMessage {
    key: string;
    value: unknown;
}

/**
 * Wrapper around a cache properties webview.
 */
export class CachePropsWebview {
    private webviewPanel?: vscode.WebviewPanel;

    /**
     * Reveals the Cache properties webview for the given Redis resource.
     * @param parsedRedisResource The Redis resource
     */
    public async reveal(parsedRedisResource: ParsedRedisResource): Promise<void> {
        if (this.webviewPanel) {
            try {
                // Show webview panel if it exists
                this.webviewPanel.reveal();
            } catch {
                // Sometimes webview may still exist while in a disposed state without onDidDispose ever being called, so
                // handle this scenario by recreating the webview panel
                this.webviewPanel.dispose();
                await this.createWebviewPanel(parsedRedisResource);
            }
        } else {
            // Create new webview panel and add it to the list of opened panels
            await this.createWebviewPanel(parsedRedisResource);
        }
    }

    /**
     * Refreshes the current webview with the given Redis resource information, if the webview is active.
     * @param parsedRedisResource The Redis resource
     */
    public async refresh(parsedRedisResource: ParsedRedisResource): Promise<void> {
        if (!this.webviewPanel) {
            return;
        }
        // Send resource, access key data to webview
        await this.sendData(parsedRedisResource);
    }

    /**
     * Creates a new webview panel for the given cache
     * @param resourceGroup Resource group name
     * @param name Resource name
     * @param resClient RedisResourceClient
     */
    private async createWebviewPanel(parsedRedisResource: ParsedRedisResource): Promise<void> {
        this.webviewPanel = vscode.window.createWebviewPanel(
            'cacheProps',
            parsedRedisResource.name,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(path.join(ExtVars.context.extensionPath, 'dist'))],
            }
        );

        this.webviewPanel.webview.html = this.getHtml();

        // Pass the vscode-resource URI of the 'fonts' directory
        const fontPathUri = vscode.Uri.file(path.join(ExtVars.context.extensionPath, 'dist', 'fonts'));
        const fontPathWebviewUri = this.webviewPanel.webview.asWebviewUri(fontPathUri).toString();
        this.postMessage('fontUri', fontPathWebviewUri);

        // Send resource, access key data to webview
        await this.sendData(parsedRedisResource);

        // Listen for messages from webview
        this.webviewPanel.webview.onDidReceiveMessage((message: IncomingMessage) => {
            if (message.command === 'copy' && message.text) {
                vscode.env.clipboard.writeText(message.text);
            }
        });

        this.webviewPanel.onDidDispose(() => {
            this.webviewPanel = undefined;
        });
    }

    /**
     * Sends all the necessary data for the Cache Properties view.
     *
     * @param parsedRedisResource The Redis resource
     */
    private async sendData(parsedRedisResource: ParsedRedisResource): Promise<void> {
        this.postMessage('parsedRedisResource', parsedRedisResource);
        this.postMessage('accessKey', await parsedRedisResource.accessKey);
        this.postMessage('connectionString', await getConnectionString(parsedRedisResource));
    }

    /**
     * Sends message to webview using a consistent format.
     *
     * @param key The message key
     * @param value The message value
     */
    private postMessage(key: string, value: unknown): void {
        const outgoingMessage: OutgoingMessage = {
            key,
            value,
        };

        this.webviewPanel?.webview.postMessage(outgoingMessage);
    }

    /**
     * Generates HTML code for the webview by injecting the React JavaScript bundle.
     * A content security policy is used along with a nonce to restrict the content that can be loaded.
     */
    private getHtml(): string {
        if (!this.webviewPanel) {
            throw new Error(ErrorWebviewUninit);
        }

        const webview = this.webviewPanel.webview;
        const scriptPathOnDisk = vscode.Uri.file(path.join(ExtVars.context.extensionPath, 'dist', 'webview.js'));
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
        const nonce = this.generateNonce();

        return `<!DOCTYPE html>
            <html lang="${vscode.env.language}">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src 'self' vscode-resource: https://static2.sharepointonline.com; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${StrProperties}</title>
            </head>
            <body>
                <div id="app"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }

    /**
     * Generates a random nonce of at least 128 bits.
     */
    private generateNonce(): string {
        return crypto.randomBytes(16).toString('hex');
    }
}
