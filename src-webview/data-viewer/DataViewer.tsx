// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { PrimaryButton, TextField } from '@fluentui/react';
import * as React from 'react';
import { CollectionWebviewPayload } from '../../src-shared/CollectionWebviewPayload';
import { WebviewCommand } from '../../src-shared/WebviewCommand';
import { WebviewMessage } from '../../src-shared/WebviewMessage';
import { vscode } from '../vscode';
import { CollectionElement, SelectableCollectionElement } from './CollectionElement';
import { CollectionType } from './CollectionType';
import { CollectionView } from './CollectionView';
import './DataViewer.css';
import { HashFilterField } from './HashFilterField';

interface State {
    currentIndex?: number;
    currentValue?: string;
    key?: string;
    data?: SelectableCollectionElement[];
    type?: CollectionType;
    size?: number;
    hasMore: boolean;
    isLoading: boolean;
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
            isLoading: false,
        };
    }

    componentDidMount(): void {
        window.addEventListener('message', (event) => {
            const message: WebviewMessage = event.data;

            if (message.command === WebviewCommand.CollectionData) {
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
                            isLoading: false,
                        };
                    } else {
                        return {
                            data: selectableData,
                            hasMore,
                            isLoading: false,
                        };
                    }
                });
            } else if (message.command === WebviewCommand.KeyType) {
                const type = message.value as CollectionType;
                this.setState({ type });
            } else if (message.command === WebviewCommand.KeyName) {
                const key = message.value as string;
                this.setState({ key });
            } else if (message.command === WebviewCommand.CollectionSize) {
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

    onScrollToBottom = (): void => {
        this.setState({
            isLoading: true,
        });
        vscode.postMessage({
            command: WebviewCommand.LoadMore,
        });
    };

    loadMore = (): void => {
        this.setState({
            isLoading: true,
        });
        vscode.postMessage({
            command: WebviewCommand.LoadMore,
        });
    };

    onFilterChanged = (
        event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
        newValue?: string | undefined
    ): void => {
        if (this.state.type !== 'hash') {
            return;
        }
        this.setState({
            currentIndex: undefined,
            currentValue: undefined,
            data: [],
            isLoading: true,
        });
        if (!newValue) {
            newValue = '*';
        }
        vscode.postMessage({
            command: WebviewCommand.FilterChange,
            value: newValue,
        });
    };

    render(): JSX.Element | null {
        if (!this.state.data) {
            return null;
        }

        const { currentValue, data, hasMore, isLoading, type, key, size } = this.state;

        // <Split direction="vertical" gutterSize={5} sizes={[50, 50]} minSize={100}></Split>
        return (
            <div className="container">
                <div className="list-container">
                    <h2>
                        {key} ({type})
                    </h2>
                    <h4 style={{ marginTop: 0, marginBottom: 5 }}>Size: {size}</h4>
                    {this.state.type === 'hash' && (
                        <HashFilterField onChange={this.onFilterChanged} isLoading={isLoading} />
                    )}

                    <CollectionView
                        className="list-view"
                        data={data}
                        type={type}
                        onScrollToBottom={this.onScrollToBottom}
                        onItemClick={this.onItemClick}
                    />
                    <PrimaryButton
                        disabled={!hasMore}
                        text="Load More"
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
