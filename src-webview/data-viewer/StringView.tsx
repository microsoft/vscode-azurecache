// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from 'react';
import { WebviewCommand } from '../../src-shared/WebviewCommand';
import { WebviewMessage } from '../../src-shared/WebviewMessage';
import { KeyContentsField } from './KeyContentsField';
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
                <h2>{key} (string)</h2>
                <KeyContentsField value={value} />
            </div>
        );
    }
}
