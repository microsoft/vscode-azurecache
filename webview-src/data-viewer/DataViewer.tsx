// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TextField } from '@fluentui/react';
import * as React from 'react';
import { vscode } from '../vscode';
import { SelectableCollectionElement, CollectionElement } from './CollectionElement';
import { CollectionView } from './CollectionView';
import { CollectionType } from './CollectionType';

interface Message {
    key: string;
    value: unknown;
}

interface State {
    currentIndex?: number;
    currentValue?: string;
    key?: string;
    data?: SelectableCollectionElement[];
    type?: CollectionType;
    size?: number;
}

export class DataViewer extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);
        this.state = {
            currentValue: undefined,
            key: undefined,
            size: 0,
            type: undefined,
        };
    }

    componentDidMount(): void {
        window.addEventListener('message', (event) => {
            const message: Message = event.data;
            const { currentIndex } = this.state;

            if (message.key === 'data') {
                const elements = message.value as CollectionElement[];
                const data = elements.map((elem, index) => {
                    return {
                        id: elem.id,
                        value: elem.value,
                        selected: index === currentIndex,
                    } as SelectableCollectionElement;
                });
                this.setState({ data });
            } else if (message.key === 'type') {
                const type = message.value as CollectionType;
                this.setState({ type });
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
        if (!this.state.data) {
            return null;
        }

        const { currentValue, data, type, key, size } = this.state;

        return (
            <div className="container">
                <h2>{key}</h2>
                <h4>Size: {size}</h4>
                <CollectionView
                    data={data}
                    type={type}
                    onScrollToBottom={this.onScrollToBottom}
                    onItemClick={this.onItemClick}
                />
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
