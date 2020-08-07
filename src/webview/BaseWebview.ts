// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as path from 'path';
import * as vscode from 'vscode';
import { WebviewCommand } from '../../src-shared/WebviewCommand';
import { WebviewMessage } from '../../src-shared/WebviewMessage';
import { ExtVars } from '../ExtensionVariables';
import { ErrorWebviewUninit, StrProperties } from '../Strings';
import crypto = require('crypto');

/**
 * Base webview class that handles the creation of webview panels and injecting the React JavaScript bundle into the webview.
 */
export abstract class BaseWebview {
    protected webviewPanel?: vscode.WebviewPanel;

    /**
     * To be implemented by subclasses.
     */
    protected abstract readonly viewType: string;
    public abstract async refresh(data: unknown): Promise<void>;
    protected abstract async sendData(data: unknown): Promise<void>;
    protected onDidReceiveMessage?(message: WebviewMessage): void;
    protected onDidDispose?(): void;

    /**
     * Reveals webview in new editor tab.
     *
     * @param title Title of webview
     * @param data Initial data to be sent to the webview
     */
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
     * Disposes the webview.
     */
    public dispose(): void {
        this.webviewPanel?.dispose();
    }

    /**
     * Creates and opens a new webview panel.
     *
     * @param title Title of webview
     * @param data Initial data to be sent to the webview
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
        this.postMessage(WebviewCommand.FontUri, fontPathWebviewUri);

        // Send data to webview
        this.sendData(data);

        // Listen for messages from webview
        this.webviewPanel.webview.onDidReceiveMessage((message) => this.onDidReceiveMessage?.(message));

        this.webviewPanel.onDidDispose(() => {
            this.webviewPanel = undefined;
            this.onDidDispose?.();
        });
    }

    /**
     * Sends message to webview using a consistent format.
     *
     * @param key The message key
     * @param value The message value
     */
    protected postMessage(command: WebviewCommand, value: unknown): void {
        const outgoingMessage: WebviewMessage = {
            command,
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
