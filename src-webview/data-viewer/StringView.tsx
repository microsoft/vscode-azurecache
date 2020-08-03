// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TextField } from '@fluentui/react';
import * as React from 'react';
import { WebviewCommand } from '../../src-shared/WebviewCommand';
import { WebviewMessage } from '../../src-shared/WebviewMessage';
import './styles.css';

interface State {
    key?: string;
    value?: string;
}

export class StringView extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);
        this.state = {};
    }

    componentDidMount(): void {
        // Listen for messages from extension
        window.addEventListener('message', (event) => {
            const message: WebviewMessage = event.data;
            if (message.command === WebviewCommand.KeyName) {
                const key = message.value as string;
                this.setState({ key });
            } else if (message.command === WebviewCommand.StringData) {
                const value = message.value as string;
                this.setState({ value });
            }
        });
    }

    render(): JSX.Element | null {
        const { key, value } = this.state;

        if (typeof key === 'undefined' || typeof value === 'undefined') {
            return null;
        }

        return (
            <div className="container">
                <div className="content-container" style={{ flex: 1 }}>
                    <h2>{key} (string)</h2>
                    <TextField
                        label="Contents"
                        multiline
                        autoAdjustHeight
                        readOnly
                        style={{ fontFamily: 'var(--vscode-editor-font-family)' }}
                        value={value}
                        resizable={false}
                        inputClassName="contents-input"
                    />
                </div>
            </div>
        );
    }
}
