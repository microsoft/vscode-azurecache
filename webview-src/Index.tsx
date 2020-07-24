// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { initializeIcons } from './fabric-icons/src';
import { CacheProperties } from './properties/CacheProperties';
import { DataViewer } from './data-viewer/DataViewer';

type ContentType = 'properties' | 'key' | undefined;

interface Message {
    key: string;
    value: unknown;
}

interface State {
    contentType: ContentType;
}

class Index extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);
        this.state = {
            contentType: undefined,
        };
    }

    componentDidMount(): void {
        window.addEventListener('message', (event) => {
            const message: Message = event.data;

            if (message.key === 'fontUri') {
                initializeIcons(message.value as string);
            } else if (message.key === 'contentType') {
                const contentType = message.value as ContentType;
                this.setState({ contentType });
            }
        });
    }

    render(): JSX.Element | null {
        const { contentType } = this.state;

        if (contentType === 'properties') {
            return <CacheProperties />;
        } else if (contentType === 'key') {
            return <DataViewer />;
        } else {
            return null;
        }
    }
}

ReactDOM.render(<Index />, document.getElementById('app'));
