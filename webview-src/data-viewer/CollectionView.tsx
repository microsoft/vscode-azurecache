import { getFocusStyle, getTheme, ITheme, List, mergeStyleSets } from '@fluentui/react';
import * as React from 'react';
import { CollectionElement } from './CollectionElement';

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
            padding: 10,
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
        },
    ],
    itemIndex: {
        fontSize: fonts.small.fontSize,
    },
    itemIndexSelected: {
        color: 'var(--vscode-list-activeSelectionForeground)',
    },
});

interface Props {
    currentIndex?: number;
    data?: CollectionElement[];
    onItemClick?: (value: CollectionElement, index: number) => void;
    onScrollToBottom?: () => void;
}

export class CollectionView extends React.Component<Props, {}> {
    constructor(props: {}) {
        super(props);
        this.state = {
            currentIndex: undefined,
            data: undefined,
            onItemClick: undefined,
            onScrollToBottom: undefined,
        };
    }

    onRenderCell = (item: CollectionElement | undefined, index: number | undefined): JSX.Element | null => {
        if (!item || typeof index === 'undefined') {
            return null;
        }

        let itemCellClass = classNames.itemCell;
        if (item.selected) {
            itemCellClass = itemCellClass + ' ' + classNames.itemSelected;
        }
        const onClick = (): void => this.props?.onItemClick?.(item, index);

        return (
            <div className={itemCellClass} data-is-focusable={true} data-is-scrollable={true} onClick={onClick}>
                <div className={classNames.itemContent}>
                    <div className={classNames.itemName}>{item?.value}</div>
                    <div className={classNames.itemIndex}>{index}</div>
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
            <div style={{ height: 400, overflowY: 'auto', resize: 'vertical' }} onScroll={this.handleListScroll}>
                <List items={data} onRenderCell={this.onRenderCell} />
            </div>
        );
    }
}
