// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TextField } from '@fluentui/react';
import * as React from 'react';
import { StrContents } from '../Strings';
import './KeyContentsField.css';

interface Props {
    value?: string;
}

export function KeyContentsField(props: Props): React.ReactElement {
    return (
        <div className="content-container">
            <TextField
                inputClassName="contents-input"
                label={StrContents}
                multiline
                autoAdjustHeight
                readOnly
                value={props.value}
                resizable={false}
            />
        </div>
    );
}
