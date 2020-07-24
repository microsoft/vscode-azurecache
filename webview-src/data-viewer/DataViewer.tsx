// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TextField } from '@fluentui/react';
import * as React from 'react';
import { vscode } from '../vscode';
import { CollectionElement } from './CollectionElement';
import { CollectionView } from './CollectionView';

interface Message {
    key: string;
    value: unknown;
}

interface State {
    currentIndex?: number;
    currentValue?: string;
    key?: string;
    setElements?: string[];
    data?: CollectionElement[];
    size?: number;
}

export class DataViewer extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);
        this.state = {
            currentValue: undefined,
            key: undefined,
            setElements: undefined,
            size: 0,
        };
    }

    componentDidMount(): void {
        window.addEventListener('message', (event) => {
            const message: Message = event.data;
            const { currentIndex } = this.state;

            if (message.key === 'setElements') {
                const setElements = message.value as string[];
                const data = setElements.map((elem, index) => {
                    const collectionElement: CollectionElement = {
                        score: '',
                        value: elem,
                        selected: index === currentIndex,
                    };
                    return collectionElement;
                });
                this.setState({ setElements, data });
            } else if (message.key === 'key') {
                const key = message.value as string;
                this.setState({ key });
            } else if (message.key === 'size') {
                const size = message.value as number;
                this.setState({ size });
            }
        });
    }

    onItemClick = (element: CollectionElement, index: number): void => {
        // Need to update entire data because FluentUI's Basic List re-renders based on changes in underlying data
        const data = this.state.data;
        const newData = data?.map((val, idx) => {
            // De-select previously selected item
            if (val.selected && idx !== index) {
                val.selected = false;
                return val;
            }
            // Select new item
            if (index === idx) {
                val.selected = true;
                return val;
            }
            // Otherwise return same item
            return val;
        });
        this.setState({
            currentValue: element.value,
            currentIndex: index,
            data: newData,
        });
    };

    onScrollToBottom(): void {
        vscode.postMessage({
            command: 'loadMore',
        });
    }

    render(): JSX.Element | null {
        if (!this.state.setElements) {
            return null;
        }

        const { currentValue, data, key, size } = this.state;

        return (
            <div className="container">
                <h2>{key}</h2>
                <h4>Size: {size}</h4>
                <CollectionView data={data} onScrollToBottom={this.onScrollToBottom} onItemClick={this.onItemClick} />
                <hr style={{ marginTop: 5 }} />
                <TextField
                    label="Contents"
                    multiline
                    autoAdjustHeight
                    readOnly
                    style={{ fontFamily: 'Consolas' }}
                    value={currentValue}
                />
            </div>
        );
    }
}
