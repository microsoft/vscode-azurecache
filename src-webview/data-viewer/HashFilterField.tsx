// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    Async,
    ICancelable,
    IRenderFunction,
    ITextFieldProps,
    Spinner,
    SpinnerSize,
    Stack,
    TextField,
    IStackTokens,
} from '@fluentui/react';
import * as React from 'react';
import { StrHashFieldFilter } from '../Strings';

interface Props {
    isLoading: boolean;
    onChange: (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string | undefined) => void;
}

const stackTokens: IStackTokens = {
    childrenGap: 5,
};

export class HashFilterField extends React.Component<Props> {
    // Delays execution of props.onChange until X seconds has elapsed since last time debouncedOnChange was called
    debouncedOnChange: ICancelable<
        (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string | undefined) => void
    > &
        (() => void);
    constructor(props: Props) {
        super(props);
        const _async = new Async(this);
        // Set timeout of 800 milliseconds
        this.debouncedOnChange = _async.debounce(this.props.onChange, 800);
    }

    onWrapDefaultLabelRenderer = (
        props: ITextFieldProps | undefined,
        defaultRender: IRenderFunction<ITextFieldProps> | undefined
    ): JSX.Element | null => {
        if (!props || !defaultRender) {
            return null;
        }
        const { isLoading } = this.props;
        return (
            <Stack horizontal verticalAlign="center" tokens={stackTokens}>
                <span>{defaultRender(props)}</span>
                {isLoading && <Spinner size={SpinnerSize.small} />}
            </Stack>
        );
    };

    render(): JSX.Element {
        const { isLoading } = this.props;
        return (
            <TextField
                className="filter-textfield"
                label={StrHashFieldFilter}
                disabled={isLoading}
                onChange={this.debouncedOnChange}
                onRenderLabel={this.onWrapDefaultLabelRenderer}
            />
        );
    }
}
