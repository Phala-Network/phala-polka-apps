// Copyright 2017-2019 @polkadot/app-123code authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { BlockNumber } from '@polkadot/types/interfaces';
import { useCall, useApi } from '@polkadot/react-hooks';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import useInterval from '@use-it/interval';
import { Grid, Button, Input } from 'semantic-ui-react';
import { Bubble, InputAddress } from '@polkadot/react-components';
import { AccountIndex, Balance, Nonce } from '@polkadot/react-query';

import AppContext, { AppContextType } from './AppContext';

import { CrossChain } from './CrossChain';

import *  as nearlib from 'nearlib';

interface Props {
  className?: string;
  onChange: (accountId: string | null) => void;
}


const CONTRACT_NAME = 'studio-9c7dtmgna';
const nearConfig = {
  networkId: 'default',
  nodeUrl: 'https://rpc.nearprotocol.com',
  contractName: CONTRACT_NAME,
  walletUrl: 'https://wallet.nearprotocol.com'
};

async function initNear (app: AppContextType) {
  console.log('nearlib', nearlib);
  const near = await nearlib.connect(Object.assign({ deps: { keyStore: new nearlib.keyStores.BrowserLocalStorageKeyStore() } }, nearConfig));
  const walletAccount = new nearlib.WalletAccount(near, null);
  const accountId = walletAccount.getAccountId();

  const contract = await near.loadContract(nearConfig.contractName, {
    viewMethods: ['getMessages', 'getEvents'],
    changeMethods: ['addMessage', 'pushCommand', 'setState', 'pay'],
    sender: accountId,
  });

  app.setState({
    ...app.state,
    near: { near, walletAccount, accountId, contract }
  })
}

function AccountSelector ({ className, onChange }: Props): React.ReactElement<Props> {
  const [accountId, setAccountId] = useState<string | null>(null);
  useEffect((): void => onChange(accountId), [accountId]);

  // init nearlib
  const app = React.useContext(AppContext.Context);
  useEffect((): void => {
    initNear(app);
  }, [])

  function handleConnect() {
    const href = window.location.href;
    app.state.near.walletAccount!.requestSignIn(nearConfig.contractName, 'Web3 Data Plaza', href, href);
  }

  function handleDisconnect() {
    app.state.near.walletAccount!.signOut();
    window.location.replace(window.location.origin + window.location.pathname);
  }

  async function handleSubmitMessage() {
    const result = await app.state.near.contract!.addMessage({
      text: 'random text from phala ' + Math.random().toString(),
    });
    console.log('addMessage result: ', result);
  }

  const { api } = useApi();
  const bestNumber = useCall<BlockNumber>(api.derive.chain.bestNumber, []);
  const [nearTip, setNearTip] = useState<number | null>(null);

  useInterval(async () => {
    const near = app.state.near.near;
    if (!near) return;
    const status = await near.connection.provider.status();
    const height = status.sync_info.latest_block_height;
    setNearTip(height);
  }, 1000);

  return (
    <section className={`template--AccountSelector ${className}`}>
      <h1>Select Phala Blockchain Identity</h1>
      <hr />
      <Grid>
        <Grid.Row>
          <Grid.Column>
            <InputAddress
              className='medium'
              label='选择身份'
              onChange={setAccountId}
              type='account'
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={1}>
          <Grid.Column textAlign='right'>
            <Bubble color='teal' icon='address card' label='索引'>
              <AccountIndex value={accountId} />
            </Bubble>
            <Bubble color='yellow' icon='adjust' label='余额'>
              <Balance params={accountId} />
            </Bubble>
            <Bubble color='yellow' icon='target' label='交易数量'>
              <Nonce params={accountId} />
            </Bubble>
          </Grid.Column>
        </Grid.Row>
      </Grid>

      <h1>NEAR-Phala Bridge</h1>
      <hr />
      <Grid>
        <Grid.Row>
          <Grid.Column width={8}>
            <Input label={{color: 'grey', content: 'Linked Account'}} placeholder='not connected'
                   value={app.state.near.accountId} disabled />
          </Grid.Column>
          <Grid.Column width={4}>
            {!!app.state.near.accountId
              ? (<Button primary onClick={handleDisconnect}>Disconnect</Button>)
              : (<Button primary onClick={handleConnect}>Connect</Button>)
            }
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={8}>
            <Input label={{color: 'grey', content: 'NEAR Chain Tip'}} placeholder='-'
                   value={nearTip || '-'} disabled />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={8}>
            <Input label={{color: 'grey', content: 'Phala Chain Tip'}} placeholder='-'
                   value={bestNumber?.toString()} disabled />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </section>
  );
}

export default styled(AccountSelector)`
  align-items: flex-end;
`;
