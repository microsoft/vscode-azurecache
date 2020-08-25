// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import { ParsedRedisResource } from '../../src-shared/ParsedRedisResource';
import { WebviewCommand } from '../../src-shared/WebviewCommand';
import { WebviewMessage } from '../../src-shared/WebviewMessage';
import * as Strings from '../Strings';
import { AccessKeyDropdown } from './AccessKeyDropdown';
import { CollapsibleList } from './CollapsibleList';
import { CopyableTextField } from './CopyableTextField';
import { GeneralPropertyLabel } from './GeneralPropertyLabel';
import './styles.css';
import { ParsedAccessKeys } from '../../src-shared/ParsedAccessKeys';

interface State {
    redisResource?: ParsedRedisResource;
    accessKeys?: ParsedAccessKeys;
}

export class CacheProperties extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);
        this.state = {
            redisResource: undefined,
            accessKeys: undefined,
        };
    }

    componentDidMount(): void {
        window.addEventListener('message', (event) => {
            const message: WebviewMessage = event.data;

            if (message.command === WebviewCommand.ParsedRedisResource) {
                const parsedRedisResource = message.value as ParsedRedisResource;
                this.setState({ redisResource: parsedRedisResource });
            } else if (message.command === WebviewCommand.AccessKeys) {
                const accessKeys = message.value as ParsedAccessKeys | undefined;
                this.setState({ accessKeys });
            }
        });
    }

    render(): JSX.Element | null {
        if (!this.state.redisResource) {
            return null;
        }

        const { redisResource, accessKeys } = this.state;
        const nonSslPort = redisResource.enableNonSslPort ? redisResource.port : Strings.StrDisabled;
        const shardCountLabel =
            redisResource.shardCount > 0 ? (
                <GeneralPropertyLabel label={Strings.StrShardCount} value={redisResource.shardCount} />
            ) : null;

        return (
            <div className="properties-container">
                <h2>
                    {redisResource.name} {Strings.StrProperties}
                </h2>
                <div>
                    <CopyableTextField id="hostName" label={Strings.StrHostname} value={redisResource.hostName} />
                    <CopyableTextField id="nonSslPort" label={Strings.StrNonSslPort} value={nonSslPort} />
                    <CopyableTextField id="sslPort" label={Strings.StrSslPort} value={redisResource.sslPort} />
                    <CopyableTextField id="resourceId" label={Strings.StrResourceId} value={redisResource.resourceId} />
                    <CollapsibleList
                        label={Strings.StrGeoReplication}
                        groupName={Strings.StrLinkedServers}
                        values={redisResource.linkedServers}
                    />
                    <AccessKeyDropdown parsedRedisResource={redisResource} parsedAccessKeys={accessKeys} />
                </div>

                <GeneralPropertyLabel label={Strings.StrSku} value={redisResource.sku} />
                <GeneralPropertyLabel label={Strings.StrLocation} value={redisResource.location} />
                <GeneralPropertyLabel label={Strings.StrRedisVersion} value={redisResource.redisVersion} />
                <GeneralPropertyLabel label={Strings.StrProvisioningState} value={redisResource.provisioningState} />
                {shardCountLabel}
            </div>
        );
    }
}
