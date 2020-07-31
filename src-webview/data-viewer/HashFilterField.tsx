// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from 'react';
import {
    TextField,
    IRenderFunction,
    ITextFieldProps,
    Stack,
    Spinner,
    SpinnerSize,
    Async,
    ICancelable,
} from '@fluentui/react';

interface Props {
    isLoading: boolean;
    onChange: (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string | undefined) => void;
}

export class HashFilterField extends React.Component<Props> {
    debouncedOnChange: ICancelable<
        (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string | undefined) => void
    > &
        (() => void);
    constructor(props: Props) {
        super(props);
        const _async = new Async(this);
        this.debouncedOnChange = _async.debounce(this.props.onChange, 1000);
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
            <Stack horizontal verticalAlign="center" gap={5} tokens={{}}>
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
                label="Hash field filter"
                disabled={isLoading}
                onChange={this.debouncedOnChange}
                onRenderLabel={this.onWrapDefaultLabelRenderer}
            />
        );
    }
}
