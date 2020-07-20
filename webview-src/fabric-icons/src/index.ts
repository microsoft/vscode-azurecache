// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { initializeIcons as i } from './fabric-icons';
import { IIconOptions } from '@uifabric/styling';

export function initializeIcons(baseUrl = '', options?: IIconOptions): void {
    [i].forEach((initialize: (url: string, options?: IIconOptions) => void) => initialize(baseUrl, options));
}
