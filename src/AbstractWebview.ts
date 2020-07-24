// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as path from 'path';
import * as vscode from 'vscode';
import { ExtVars } from './ExtensionVariables';
import { ErrorWebviewUninit, StrProperties } from './Strings';
import crypto = require('crypto');

/**
 * Represents data passed from webview to extension.
 */
export interface IncomingMessage {
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
export abstract class AbstractWebview {
    protected webviewPanel?: vscode.WebviewPanel;
    protected abstract readonly viewType: string;

    protected abstract async sendData(data: unknown): Promise<void>;
    protected abstract onDidReceiveMessage(message: IncomingMessage): void;

    public async reveal(title: string, data?: unknown): Promise<void> {
        if (this.webviewPanel) {
            try {
                // Show webview panel if it exists
                this.webviewPanel.reveal();
            } catch {
                // Sometimes webview may still exist while in a disposed state without onDidDispose ever being called, so
                // handle this scenario by recreating the webview panel
                this.webviewPanel.dispose();
                await this.createWebviewPanel(title, data);
            }
        } else {
            // Create new webview panel and add it to the list of opened panels
            await this.createWebviewPanel(title, data);
        }
    }

    /**
     * Creates a new webview panel for the given cache
     * @param resourceGroup Resource group name
     * @param name Resource name
     * @param resClient RedisResourceClient
     */
    private async createWebviewPanel(title: string, data: unknown): Promise<void> {
        this.webviewPanel = vscode.window.createWebviewPanel(this.viewType, title, vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(path.join(ExtVars.context.extensionPath, 'dist'))],
        });

        this.webviewPanel.webview.html = this.getHtml();

        // Pass the vscode-resource URI of the 'fonts' directory
        const fontPathUri = vscode.Uri.file(path.join(ExtVars.context.extensionPath, 'dist', 'fonts'));
        const fontPathWebviewUri = this.webviewPanel.webview.asWebviewUri(fontPathUri).toString();
        this.postMessage('fontUri', fontPathWebviewUri);

        // Send resource, access key data to webview
        this.sendData(data);

        // Listen for messages from webview
        this.webviewPanel.webview.onDidReceiveMessage((message) => this.onDidReceiveMessage(message));

        this.webviewPanel.onDidDispose(() => {
            this.webviewPanel = undefined;
        });
    }

    /**
     * Sends message to webview using a consistent format.
     *
     * @param key The message key
     * @param value The message value
     */
    protected postMessage(key: string, value: unknown): void {
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
