// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    GroupedList,
    IGroup,
    IGroupDividerProps,
    IGroupHeaderProps,
    IGroupRenderProps,
    IRenderFunction,
    IStyle,
    Label,
    SelectionMode,
} from '@fluentui/react/lib/';
import * as React from 'react';
import { CopyableTextField } from './CopyableTextField';
import {
    StrPrimaryAccessKey,
    StrPrimaryConnectionStr,
    StrAccessKeys,
    StrPrimary,
    StrSecondaryConnectionStr,
    StrSecondaryAccessKey,
    StrSecondary,
} from '../Strings';
import { ParsedRedisResource } from '../../out/ParsedRedisResource';
import { ParsedAccessKeys } from '../../src-shared/ParsedAccessKeys';
import { ParsedConnectionStrings } from '../../src-shared/ParsedConnectionStrings';

interface Props {
    parsedRedisResource: ParsedRedisResource;
    parsedAccessKeys?: ParsedAccessKeys;
}

interface Item {
    keyId: string;
    keyLabel: string;
    connectionStringId: string;
    connectionStringLabel: string;
    accessKey: string;
    connectionString: string;
}

const onRenderCell = (nestingDepth?: number, item?: Item, itemIndex?: number): JSX.Element | null => {
    if (typeof item === 'undefined') {
        return null;
    }

    const { keyId, keyLabel, connectionStringId, connectionStringLabel, accessKey, connectionString } = item;
    return (
        <div style={{ marginLeft: '48px' }}>
            <CopyableTextField id={keyId} label={keyLabel} value={accessKey} />
            <CopyableTextField id={connectionStringId} label={connectionStringLabel} value={connectionString} />
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

    // Hide header count
    const headerCountStyle: IStyle = { display: 'none' };

    return (
        <span>
            {defaultRender({
                ...headerProps,
                styles: { headerCount: headerCountStyle },
                onToggleSelectGroup: onToggleSelectGroup,
            })}
        </span>
    );
};

export function AccessKeyDropdown(props: Props): React.ReactElement | null {
    if (typeof props.parsedAccessKeys === 'undefined') {
        return null;
    }

    const { parsedRedisResource, parsedAccessKeys } = props;
    const { primaryKey, secondaryKey } = parsedAccessKeys;
    const { primaryConnectionString, secondaryConnectionString } = getConnectionStrings(
        parsedRedisResource,
        parsedAccessKeys
    );

    const items: Item[] = [
        {
            keyId: 'primaryAccessKey',
            connectionStringId: 'primaryConnectionStr',
            keyLabel: StrPrimaryAccessKey,
            connectionStringLabel: StrPrimaryConnectionStr,
            accessKey: primaryKey,
            connectionString: primaryConnectionString,
        },
        {
            keyId: 'secondaryAccessKey',
            connectionStringId: 'secondaryConnectionStr',
            keyLabel: StrSecondaryAccessKey,
            connectionStringLabel: StrSecondaryConnectionStr,
            accessKey: secondaryKey,
            connectionString: secondaryConnectionString,
        },
    ];

    const groups: IGroup[] = [
        {
            count: 1,
            key: 'group',
            name: StrPrimary,
            startIndex: 0,
            isCollapsed: true,
        },
        {
            count: 1,
            key: 'group',
            name: StrSecondary,
            startIndex: 1,
            isCollapsed: true,
        },
    ];
    const groupProps: IGroupRenderProps = {
        onRenderHeader,
    };

    return (
        <div>
            <Label>{StrAccessKeys}</Label>
            <GroupedList
                items={items}
                onRenderCell={onRenderCell}
                groups={groups}
                groupProps={groupProps}
                selectionMode={SelectionMode.none}
                compact={true}
            />
        </div>
    );
}

/**
 * Returns primary and secondary StackExchange.Redis connection strings.
 *
 * @param parsedRedisResource The Redis resource
 * @param parsedAccessKeys The access keys
 */
function getConnectionStrings(
    parsedRedisResource: ParsedRedisResource,
    parsedAccessKeys: ParsedAccessKeys
): ParsedConnectionStrings {
    const { hostName, sslPort } = parsedRedisResource;
    const { primaryKey, secondaryKey } = parsedAccessKeys;
    return {
        primaryConnectionString: `${hostName}:${sslPort},password=${primaryKey},ssl=True,abortConnect=False`,
        secondaryConnectionString: `${hostName}:${sslPort},password=${secondaryKey},ssl=True,abortConnect=False`,
    } as ParsedConnectionStrings;
}
