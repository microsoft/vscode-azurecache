import {
    GroupedList,
    IGroup,
    IGroupDividerProps,
    IGroupHeaderProps,
    IGroupRenderProps,
    IRenderFunction,
    IStyle,
    SelectionMode,
} from '@fluentui/react/lib/';
import * as React from 'react';
import { CopyableTextField } from './CopyableTextField';
import { StrPrimaryAccessKey, StrPrimaryConnectionStr, StrAccessKeys } from './Strings';

interface Props {
    accessKey?: string;
    connectionString?: string;
}

interface Item {
    accessKey: string;
    connectionString: string;
}

const onRenderCell = (nestingDepth?: number, item?: Item, itemIndex?: number): JSX.Element => {
    return (
        <div style={{ marginLeft: '48px' }}>
            <CopyableTextField id="primaryAccessKey" label={StrPrimaryAccessKey} value={item?.accessKey} />
            <CopyableTextField
                id="primaryConnectionStr"
                label={StrPrimaryConnectionStr}
                value={item?.connectionString}
            />
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

    const headerCountStyle: IStyle = { display: 'none' };
    return <span>{defaultRender({ ...headerProps, styles: { headerCount: headerCountStyle } })}</span>;
};

export function AccessKeyDropdown(props: Props): React.ReactElement | null {
    const { accessKey, connectionString } = props;
    if (typeof accessKey === 'undefined' || typeof connectionString === 'undefined') {
        return null;
    }

    const items: Item[] = [{ accessKey, connectionString }];
    const groups: IGroup[] = [
        {
            count: 1,
            key: 'group',
            name: StrAccessKeys,
            startIndex: 0,
            isCollapsed: true,
        },
    ];
    const groupProps: IGroupRenderProps = {
        onRenderHeader,
    };

    return (
        <div>
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
