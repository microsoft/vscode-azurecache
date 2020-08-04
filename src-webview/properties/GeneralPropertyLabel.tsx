// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Label, Text } from '@fluentui/react/lib/';
import * as React from 'react';

interface Props {
    label: string;
    value?: string | number;
}

export function GeneralPropertyLabel(props: Props): React.ReactElement | null {
    if (typeof props.value === 'undefined') {
        return null;
    }

    return (
        <div>
            <Label>{props.label}</Label>
            <Text className="indented">{props.value.toString()}</Text>
        </div>
    );
}
