// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { TestUserInput } from 'vscode-azureextensiondev';
import { createAzExtOutputChannel } from 'vscode-azureextensionui';
import { ExtVars } from '../ExtensionVariables';
import sinon = require('sinon');

export const testUserInput: TestUserInput = new TestUserInput(vscode);

before(function (this: Mocha.Context) {
    ExtVars.ui = testUserInput;
    ExtVars.outputChannel = createAzExtOutputChannel('Test', 'azureCacheTest');

    // Tests that show many error messages may crash the extension host window, so stub it out
    sinon.stub(vscode.window, 'showErrorMessage');
});
