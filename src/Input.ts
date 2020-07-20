// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { ErrorEmptyInput } from './Strings';

/**
 * Helper function to get user text input.
 *
 * @param defaultValue Default value
 * @param prompt Input prompt text
 * @param placeholder placeholder text
 */
export async function textInput(
    defaultValue: string | undefined,
    prompt: string,
    placeholder: string
): Promise<string | undefined> {
    const val = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        prompt: prompt,
        placeHolder: placeholder,
        validateInput: (val: string) => {
            if (val) {
                return null;
            }
            return ErrorEmptyInput;
        },
    });

    if (typeof val === 'undefined') {
        return val;
    }

    return val ? val : defaultValue;
}
