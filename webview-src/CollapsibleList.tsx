// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    GroupedList,
    Label,
    SelectionMode,
    IRenderFunction,
    IGroupDividerProps,
    IGroupHeaderProps,
    IGroupRenderProps,
} from '@fluentui/react/lib/';
import * as React from 'react';
import { CopyableTextField } from './CopyableTextField';

interface Props {
    label: string;
    groupName: string;
    values?: string[];
}

const onRenderCell = (nestingDepth?: number, item?: string, itemIndex?: number): JSX.Element => {
    return (
        <div style={{ marginLeft: '48px', marginTop: '8px' }}>
            <CopyableTextField id="hostName" value={item} />
        </div>
    );
};

const onRenderHeader: IRenderFunction<IGroupHeaderProps> = (
    headerProps?: IGroupDividerProps,
    defaultRender?: IRenderFunction<IGroupHeaderProps>
) => {
    if (!defaultRender) {
        return null;
    }

    // Make entire header togglable
    const onToggleSelectGroup = (): void => {
        if (headerProps?.onToggleCollapse && headerProps?.group) {
            headerProps.onToggleCollapse(headerProps.group);
        }
    };

    return (
        <span>
            {defaultRender({
                ...headerProps,
                onToggleSelectGroup: onToggleSelectGroup,
            })}
        </span>
    );
};

export function CollapsibleList(props: Props): React.ReactElement | null {
    if (typeof props.values === 'undefined' || props.values.length === 0) {
        return null;
    }

    const group = [
        {
            count: props.values.length,
            key: props.label,
            name: props.groupName,
            startIndex: 0,
            isCollapsed: true,
        },
    ];
    const groupProps: IGroupRenderProps = {
        onRenderHeader,
    };

    return (
        <div>
            <Label>{props.label}</Label>
            <GroupedList
                items={props.values}
                onRenderCell={onRenderCell}
                groups={group}
                groupProps={groupProps}
                selectionMode={SelectionMode.none}
                compact={true}
            />
        </div>
    );
}
