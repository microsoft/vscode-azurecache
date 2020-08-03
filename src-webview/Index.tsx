// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { WebviewCommand } from '../src-shared/WebviewCommand';
import { WebviewMessage } from '../src-shared/WebviewMessage';
import { WebviewView } from '../src-shared/WebviewView';
import { CollectionView } from './data-viewer/CollectionView';
import { initializeIcons } from './fabric-icons/src';
import { CacheProperties } from './properties/CacheProperties';
import { StringView } from './data-viewer/StringView';

interface State {
    type: WebviewView;
}

class Index extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);
        this.state = {
            type: WebviewView.Unknown,
        };
    }

    componentDidMount(): void {
        window.addEventListener('message', (event) => {
            const message: WebviewMessage = event.data;

            if (message.command === WebviewCommand.FontUri) {
                initializeIcons(message.value as string);
            } else if (message.command === WebviewCommand.View) {
                const type = message.value as WebviewView;
                this.setState({ type });
            }
        });
    }

    render(): JSX.Element | null {
        const { type } = this.state;

        if (type === WebviewView.CacheProperties) {
            return <CacheProperties />;
        } else if (type === WebviewView.StringKey) {
            return <StringView />;
        } else if (type === WebviewView.CollectionKey) {
            return <CollectionView />;
        } else {
            return null;
        }
    }
}

ReactDOM.render(<Index />, document.getElementById('app'));
