// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { getFocusStyle, getTheme, ITheme, List, mergeStyleSets } from '@fluentui/react';
import * as React from 'react';
import { CollectionType } from './CollectionType';
import { SelectableCollectionElement } from './SelectableCollectionElement';

const theme: ITheme = getTheme();
const { semanticColors, fonts } = theme;

const classNames = mergeStyleSets({
    itemSelected: {
        background: 'var(--vscode-list-activeSelectionBackground)',
        color: 'var(--vscode-list-activeSelectionForeground)',
        selectors: {
            '&:hover': { background: 'var(--vscode-list-activeSelectionBackground) !important' },
        },
    },
    itemCell: [
        getFocusStyle(theme, { inset: -1 }),
        {
            minHeight: 30,
            padding: 5,
            boxSizing: 'border-box',
            borderBottom: `1px solid ${semanticColors.bodyDivider}`,
            display: 'flex',
            selectors: {
                '&:hover': { background: 'var(--vscode-list-hoverBackground)' },
            },
            cursor: 'pointer',
        },
    ],
    itemContent: {
        marginLeft: 5,
        overflow: 'hidden',
        flexGrow: 1,
    },
    itemName: [
        fonts.medium,
        {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: fonts.mediumPlus.fontSize,
        },
    ],
    itemIndex: {
        fontSize: fonts.small.fontSize,
        color: 'var(--vscode-editorHint-foreground)',
    },
    itemIndexSelected: {
        color: 'var(--vscode-list-activeSelectionForeground)',
    },
});

interface Props {
    className?: string;
    data: SelectableCollectionElement[];
    type?: CollectionType;
    onItemClick: (value: SelectableCollectionElement, index: number) => void;
    onScrollToBottom: () => void;
}

export class CollectionList extends React.Component<Props, {}> {
    onRenderCell = (item: SelectableCollectionElement | undefined, index: number | undefined): JSX.Element | null => {
        if (!item || typeof index === 'undefined') {
            return null;
        }

        const itemCellClass = classNames.itemCell + (item.selected ? ' ' + classNames.itemSelected : '');
        const itemIndexClass = classNames.itemIndex + (item.selected ? ' ' + classNames.itemIndexSelected : '');
        const onClick = (): void => this.props.onItemClick?.(item, index);

        let header = null;

        if (this.props?.type === 'zset' || this.props?.type === 'hash') {
            header = (
                <div>
                    <div className={itemIndexClass}>{item.id}</div>
                </div>
            );
        } else if (this.props?.type === 'set' || this.props?.type === 'list') {
            header = <div className={itemIndexClass}>{index}</div>;
        }

        return (
            <div className={itemCellClass} data-is-focusable={true} data-is-scrollable={true} onClick={onClick}>
                <div className={classNames.itemContent}>
                    {header}
                    <div className={classNames.itemName}>{item.value}</div>
                </div>
            </div>
        );
    };

    handleListScroll = (event: React.UIEvent<HTMLDivElement>): void => {
        const target = event.target as HTMLDivElement;

        if (target.scrollHeight - target.scrollTop === target.clientHeight) {
            this.props.onScrollToBottom?.();
        }
    };

    render(): JSX.Element | null {
        if (!this.props.data) {
            return null;
        }

        const { data } = this.props;

        return (
            <div
                className={this.props.className}
                style={{ minHeight: 200, maxHeight: '50vh', overflowY: 'auto', borderStyle: 'solid', borderWidth: 1 }}
                onScroll={this.handleListScroll}
            >
                <List items={data} onRenderCell={this.onRenderCell} />
            </div>
        );
    }
}
