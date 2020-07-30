// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TextField, PrimaryButton } from '@fluentui/react';
import * as React from 'react';
import { vscode } from '../vscode';
import { SelectableCollectionElement, CollectionElement } from './CollectionElement';
import { CollectionView } from './CollectionView';
import { CollectionType } from './CollectionType';
import { CollectionWebviewPayload } from '../../shared/CollectionWebviewPayload';
import './DataViewer.css';

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
    hasMore: boolean;
}

export class DataViewer extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);
        this.state = {
            currentValue: undefined,
            key: undefined,
            size: 0,
            type: undefined,
            hasMore: false,
        };
    }

    componentDidMount(): void {
        window.addEventListener('message', (event) => {
            const message: Message = event.data;

            if (message.key === 'data') {
                const { data, hasMore } = message.value as CollectionWebviewPayload;
                const selectableData = data.map(
                    (elem) =>
                        ({
                            id: elem.id,
                            value: elem.value,
                            selected: false,
                        } as SelectableCollectionElement)
                );
                this.setState((prevState) => {
                    if (prevState.data) {
                        return {
                            data: [...prevState.data, ...selectableData],
                            hasMore,
                        };
                    } else {
                        return {
                            data: selectableData,
                            hasMore,
                        };
                    }
                });
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

    loadMore = () => {
        vscode.postMessage({
            command: 'loadMore',
        });
    };

    onFilterChanged = (
        event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
        newValue?: string | undefined
    ) => {
        if (this.state.type !== 'hash') {
            return;
        }
        console.log('changed: ' + newValue);
    };

    render(): JSX.Element | null {
        if (!this.state.data) {
            return null;
        }

        const { currentValue, currentIndex, data, type, key, size } = this.state;
        const buttonDisabled = this.state.data.length === this.state.size;

        // <Split direction="vertical" gutterSize={5} sizes={[50, 50]} minSize={100}></Split>
        return (
            <div className="container">
                <div className="list-container">
                    <h2>
                        {key} ({type})
                    </h2>
                    <h4 style={{ marginTop: 0, marginBottom: 5 }}>Size: {size}</h4>
                    {this.state.type === 'hash' && (
                        <TextField
                            className="filter-textfield"
                            label={'Filter hash name'}
                            onChange={this.onFilterChanged}
                        />
                    )}

                    <CollectionView
                        className="list-view"
                        data={data}
                        type={type}
                        onScrollToBottom={this.onScrollToBottom}
                        onItemClick={this.onItemClick}
                    />
                    <PrimaryButton
                        disabled={buttonDisabled}
                        text="Load More..."
                        style={{ marginLeft: 'auto', marginRight: 0, marginTop: 5, textAlign: 'right' }}
                        onClick={this.loadMore}
                    />
                </div>
                <div className="content-container" style={{ flex: 1 }}>
                    <TextField
                        label="Contents"
                        multiline
                        autoAdjustHeight
                        readOnly
                        style={{ fontFamily: 'Consolas' }}
                        value={currentValue}
                        resizable={false}
                        inputClassName="contents-input"
                    />
                </div>
            </div>
        );
    }
}
