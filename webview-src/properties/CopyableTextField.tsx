// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ITooltipHostStyles, Stack, TextField, TooltipDelay, TooltipHost, IStackTokens } from '@fluentui/react/lib/';
import * as React from 'react';
import { CopyButton } from './CopyButton';
import { StrCopied, StrCopyToClipboard } from '../Strings';
import { vscode } from '../vscode';

interface State {
    showClicked: boolean;
}

interface Props {
    id: string;
    label?: string;
    value?: string | number;
}

const tooltipProps = { gapSpace: 0 };
const tooltipStyles: Partial<ITooltipHostStyles> = { root: { display: 'inline-block' } };
const stackTokens: IStackTokens = {
    childrenGap: 5,
};

export class CopyableTextField extends React.Component<Props, State> {
    state = {
        showClicked: false,
    };

    onClick = (): void => {
        if (this.props.value) {
            vscode.postMessage({
                command: 'copy',
                text: this.props.value.toString(),
            });
            this.setState({
                showClicked: true,
            });
        }
    };

    onMouseLeave = (): void => {
        this.setState({ showClicked: false });
    };

    render(): JSX.Element | null {
        if (typeof this.props.value === 'undefined') {
            return null;
        }

        const value = typeof this.props.value === 'number' ? this.props.value.toString() : this.props.value;
        const tooltipText = this.state.showClicked ? StrCopied : StrCopyToClipboard;

        return (
            <Stack horizontal tokens={stackTokens}>
                <Stack.Item grow align="end">
                    <TextField label={this.props.label} readOnly value={value} />
                </Stack.Item>
                <Stack.Item align="end">
                    <TooltipHost
                        content={tooltipText}
                        id={this.props.id}
                        calloutProps={tooltipProps}
                        delay={TooltipDelay.zero}
                        styles={tooltipStyles}
                    >
                        <CopyButton onClick={this.onClick} onMouseLeave={this.onMouseLeave} />
                    </TooltipHost>
                </Stack.Item>
            </Stack>
        );
    }
}
