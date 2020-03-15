/* eslint-disable @typescript-eslint/camelcase */
// Copyright 2017-2019 @polkadot/app-123code authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { DeriveStakingValidators } from '@polkadot/api-derive/types';
import { BareProps, I18nProps } from '@polkadot/react-components/types';
import { Balance, BlockNumber } from '@polkadot/types/interfaces';

import React from 'react';
import { Button as SButton, Icon } from 'semantic-ui-react';
import { Bubble as PolkaBubble, IdentityIcon } from '@polkadot/react-components';
import { useApi, useCall } from '@polkadot/react-hooks';
import { formatBalance, formatNumber } from '@polkadot/util';

import styled from 'styled-components';

import translate from './translate';

interface Props extends BareProps, I18nProps {
  pRuntimeEndpoint?: string,
  pRuntimeConnected?: boolean,
  pRuntimeLatency?: number,
  pRuntimeInitalized?: boolean,
  pRuntimeBlock?: number,
  pRuntimeECDHKey?: string,
  onChanged?: (val: string) => void;
}

const Bubble = styled(PolkaBubble)`
  margin-top: 2px !important;
  margin-bottom: 2px !important;
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SummaryBar (props: Props,): React.ReactElement<Props> {
  const { api, systemChain, systemName, systemVersion } = useApi();
  const bestNumber = useCall<BlockNumber>(api.derive.chain.bestNumber, []);
  const bestNumberLag = useCall<BlockNumber>(api.derive.chain.bestNumberLag, []);
  const totalInsurance = useCall<Balance>(api.query.balances.totalIssuance, []);
  const validators = useCall<DeriveStakingValidators>(api.derive.staking.validators, []);

  function handleSetting() {
    const newVal = prompt('Change pRuntime endpoint', props.pRuntimeEndpoint);
    if (newVal && props.onChanged) {
      props.onChanged(newVal.trim());
    }
  }

  return (
    <section className='ui--row'>
      <div className='large'>
        <h1>summary</h1>
        <summary>
          <div>
            <Bubble icon='tty' label='node'>
              {systemName} v{systemVersion}
            </Bubble>
            <Bubble icon='chain' label='chain'>
              {systemChain}
            </Bubble>
            <Bubble icon='code' label='runtime'>
              {api.runtimeVersion.implName} v{api.runtimeVersion.implVersion.toString(10)}
            </Bubble>
            <Bubble icon='bullseye' label='best #'>
              {formatNumber(bestNumber)} ({formatNumber(bestNumberLag)} lag)
            </Bubble>
            {validators && (
              <Bubble icon='chess queen' label='validators'>{
                validators.validators.map((accountId, index): React.ReactNode => (
                  <IdentityIcon key={index} value={accountId} size={20} />
                ))
              }</Bubble>
            )}
            <Bubble icon='circle' label='total tokens'>
              {formatBalance(totalInsurance)}
            </Bubble>
          </div>
          <hr/>
          <div>
            <SButton icon onClick={handleSetting}>
              <Icon name='setting' />
            </SButton>
            <Bubble icon='tty' label='pRuntime'>
              {props.pRuntimeEndpoint}
            </Bubble>
            <Bubble icon='signal' label='connected'>
              {props.pRuntimeConnected ? `(${Math.round(props.pRuntimeLatency!)}ms)` : 'no'}
            </Bubble>
            {props.pRuntimeConnected && (
              <>
                <Bubble icon='check circle' label='initlized'>
                  {props.pRuntimeInitalized ? 'yes' : 'no'}
                </Bubble>
                <Bubble icon='bullseye' label='synced'>
                  {props.pRuntimeBlock}
                </Bubble>
                <Bubble icon='key' label='ECDH key'>
                  {props.pRuntimeECDHKey?.substring(0, 8) + '...'}
                </Bubble>
              </>
            )}
          </div>
        </summary>
      </div>
    </section>
  );
}

// inject the actual API calls automatically into props
export default translate(SummaryBar);
