// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { GroupedList, Label, SelectionMode } from '@fluentui/react/lib/';
import * as React from 'react';
import { CopyableTextField } from './CopyableTextField';

interface Props {
    label: string;
    groupName: string;
    values?: string[];
}

const onRenderCell = (nestingDepth?: number, item?: string, itemIndex?: number): JSX.Element => {
    return (
        <div style={{ marginLeft: '36px', marginTop: '8px' }}>
            <CopyableTextField id="hostName" value={item} />
        </div>
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

    return (
        <div>
            <Label>{props.label}</Label>
            <GroupedList
                items={props.values}
                onRenderCell={onRenderCell}
                groups={group}
                selectionMode={SelectionMode.none}
                compact={true}
            />
        </div>
    );
}
