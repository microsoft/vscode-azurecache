import { getFocusStyle, getTheme, ITheme, List, mergeStyleSets } from '@fluentui/react';
import * as React from 'react';
import { CollectionElement, SelectableCollectionElement } from './CollectionElement';
import { CollectionType } from './CollectionType';

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
    currentIndex?: number;
    data?: SelectableCollectionElement[];
    type?: CollectionType;
    onItemClick?: (value: CollectionElement, index: number) => void;
    onScrollToBottom?: () => void;
}

export class CollectionView extends React.Component<Props, {}> {
    constructor(props: {}) {
        super(props);
    }

    onRenderCell = (item: SelectableCollectionElement | undefined, index: number | undefined): JSX.Element | null => {
        if (!item || typeof index === 'undefined') {
            return null;
        }

        const itemCellClass = classNames.itemCell + (item.selected ? ' ' + classNames.itemSelected : '');
        const itemIndexClass = classNames.itemIndex + (item.selected ? ' ' + classNames.itemIndexSelected : '');
        const onClick = (): void => this.props?.onItemClick?.(item, index);

        let indexElement = null;

        if (this.props?.type === 'zset') {
            indexElement = (
                <div>
                    <div className={itemIndexClass}>Score: {item.id}</div>
                    <div className={itemIndexClass}>{index}</div>
                </div>
            );
        } else if (this.props?.type === 'set' || this.props?.type === 'list') {
            indexElement = <div className={itemIndexClass}>{index}</div>;
        }

        return (
            <div className={itemCellClass} data-is-focusable={true} data-is-scrollable={true} onClick={onClick}>
                <div className={classNames.itemContent}>
                    <div className={classNames.itemName}>{item.value}</div>
                    {indexElement}
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
                style={{ height: 400, overflowY: 'auto', resize: 'vertical', borderStyle: 'solid', borderWidth: 1 }}
                onScroll={this.handleListScroll}
            >
                <List items={data} onRenderCell={this.onRenderCell} />
            </div>
        );
    }
}
