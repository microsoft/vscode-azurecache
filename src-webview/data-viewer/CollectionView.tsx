// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { PrimaryButton, TextField } from '@fluentui/react';
import * as React from 'react';
import { CollectionWebviewData } from '../../src-shared/CollectionWebviewData';
import { WebviewCommand } from '../../src-shared/WebviewCommand';
import { WebviewMessage } from '../../src-shared/WebviewMessage';
import { vscode } from '../vscode';
import { CollectionList } from './CollectionList';
import { CollectionType } from './CollectionType';
import './CollectionView.css';
import { HashFilterField } from './HashFilterField';
import { SelectableCollectionElement } from './SelectableCollectionElement';

interface State {
    currentIndex?: number;
    currentValue?: string;
    type?: CollectionType;
    key?: string;
    data: SelectableCollectionElement[];
    size: number;
    hasMore: boolean;
    isLoading: boolean;
}

export class DataViewer extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);
        this.state = {
            data: [],
            size: 0,
            hasMore: false,
            isLoading: false,
        };
    }

    componentDidMount(): void {
        // Listen for messages from extension
        window.addEventListener('message', (event) => {
            const message: WebviewMessage = event.data;
            if (message.command === WebviewCommand.CollectionData) {
                const { data, hasMore, clearCache } = message.value as CollectionWebviewData;
                const selectableData = data.map(
                    (elem) =>
                        ({
                            id: elem.id,
                            value: elem.value,
                            selected: false,
                        } as SelectableCollectionElement)
                );

                this.setState((prevState) => ({
                    // Clear previous data if clearCache is true
                    data: clearCache ? selectableData : [...prevState.data, ...selectableData],
                    hasMore,
                    isLoading: false,
                }));
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

    /**
     * Handles selection when collection item is clicked.
     * @param element The element that was clicked
     * @param index The index in the collection
     */
    onItemClick = (element: SelectableCollectionElement, index: number): void => {
        // Need to update entire data because FluentUI's Basic List only re-renders based on changes in underlying 'data'
        const newData = this.state.data.map((val, idx) => {
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

    /**
     * Tells extension to send over more data.
     */
    loadMore = (): void => {
        this.setState({
            isLoading: true,
        });
        vscode.postMessage({
            command: WebviewCommand.LoadMore,
        });
    };

    /**
     * Handles filter textfield changes.
     * This is called from HashFilterField with a debounce so it is not triggered after every keystroke.
     *
     * @param event The event
     * @param newValue The new filter value
     */
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
            isLoading: true,
        });

        // Treat empty string as 'match all'
        if (!newValue) {
            newValue = '*';
        }
        vscode.postMessage({
            command: WebviewCommand.FilterChange,
            value: newValue,
        });
    };

    render(): JSX.Element | null {
        const { currentValue, data, hasMore, isLoading, type, key, size } = this.state;

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

                    <CollectionList
                        className="list-view"
                        data={data}
                        type={type}
                        onScrollToBottom={this.loadMore}
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
                        style={{ fontFamily: 'var(--vscode-editor-font-family)' }}
                        value={currentValue}
                        resizable={false}
                        inputClassName="contents-input"
                    />
                </div>
            </div>
        );
    }
}
