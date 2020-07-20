// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IIconOptions, IIconSubset, registerIcons } from '@uifabric/styling';

export function initializeIcons(baseUrl = '.', options?: IIconOptions): void {
    const subset: IIconSubset = {
        style: {
            MozOsxFontSmoothing: 'grayscale',
            WebkitFontSmoothing: 'antialiased',
            fontStyle: 'normal',
            fontWeight: 'normal',
            speak: 'none',
        },
        fontFace: {
            fontFamily: `"FabricMDL2Icons"`,
            src: `url('${baseUrl}/fabric-icons.woff') format('woff')`,
        },
        icons: {
            ChevronDownMed: '\uE972',
            ChevronRightMed: '\uE974',
            Tag: '\uE8EC',
            Copy: '\uE8C8',
        },
    };

    registerIcons(subset, options);
}
