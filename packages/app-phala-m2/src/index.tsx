// Copyright 2017-2019 @polkadot/app-123code authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

// some types, AppProps for the app and I18nProps to indicate
// translatable strings. Generally the latter is quite "light",
// `t` is inject into props (see the HOC export) and `t('any text')
// does the translation
import { AppProps, I18nProps } from '@polkadot/react-components/types';
import { Input, Button } from '@polkadot/react-components';
import Tabs from '@polkadot/react-components/Tabs';
import { stringToU8a } from '@polkadot/util';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { KeyringPair } from '@polkadot/keyring/types';

import Unlock from '@polkadot/app-toolbox/Unlock';

// external imports (including those found in the packages/*
// of this repo)
import React, { useState } from 'react';
import { Route, Switch } from 'react-router';
import styled from 'styled-components';
import * as base64 from 'base64-js';

// local imports and components
import AccountSelector from './AccountSelector';
import SummaryBar from './SummaryBar';
import BalancesTab from './contracts/balances';
import AssetsTab from './contracts/assets';
import translate from './translate';

import PRuntime, {measure} from './pruntime';
import {GetInfoResp} from './pruntime/models';
import Crypto, {EcdhChannel} from './pruntime/crypto';
import config from './config';

// define our internal types
interface Props extends AppProps, I18nProps {}



const Banner = styled.div`
  padding: 0 0.5rem 0.5rem;
  margin-top: 10px;

  .box {
    background: #fff6e5;
    border-left: 0.25rem solid darkorange;
    border-radius: 0 0.25rem 0.25rem 0;
    box-sizing: border-box;
    padding: 1rem 1.5rem;

    .info {
      max-width: 50rem;
    }
  }
`;

const UnlockPrompt = styled.section`
  div.large {
    background: #e8e8e8;
    .button-group {
      margin: 20px 0;
    }
  }
`;

function PhalaM2 ({ className, t, basePath }: Props): React.ReactElement<Props> {
  const [pRuntimeEndpoint, setPRuntimeEndpoint] = useState<string>(config.pRuntimeEndpoint);
  const [accountId, setAccountId] = useState<string | null>(null);

  // get_info loop

  const [latency, setLatency] = useState<number | null>(null);
  const [info, setInfo] = useState<GetInfoResp | null>(null);

  React.useEffect(() => {
    let stop = false;
    const API = new PRuntime(pRuntimeEndpoint);
    const update = async () => {
      try {
        const dt = await measure(async () => {
          const info = await API.getInfo();
          setInfo(info);
        });
        setLatency(l => l ? l * 0.8 + dt * 0.2 : dt);
      } catch (err) {  }
      if (!stop) {
        setTimeout(update, 1000);
      }
    };
    update();
    return () => { stop = true; console.log('stop'); }
  }, [pRuntimeEndpoint])

  // polkadot keypair

  const [keypair, setKeypair] = useState<KeyringPair | null>(null);
  React.useEffect(() => {
    (async () => {
      await cryptoWaitReady();
      if (accountId) {
        const pair = keyring.getPair(accountId || '');
        setKeypair(pair);
      }
    })();
  }, [accountId]);
  const [showUnlock, setShowUnlock] = useState(false);
  function _toggleUnlock () {
    setShowUnlock(!showUnlock);
  }
  function _onUnlock () {
    _toggleUnlock();
    setKeypair(keypair);  // re-notify the locking change
  }

  // ecdh sign

  const [message, setMessage] = useState('');
  const [ecdhChannel, setEcdhChannel] = useState<EcdhChannel | null>(null);
  const [ecdhShouldJoin, setEcdhShouldJoin] = useState(false);

  async function newChanel() {
    const ch = await Crypto.newChannel();
    setEcdhChannel(ch);
    setEcdhShouldJoin(true);
  }
  async function updateChannel() {
    if (ecdhShouldJoin && ecdhChannel && info && info.ecdhPublicKey) {
      const ch = await Crypto.joinChannel(ecdhChannel, info?.ecdhPublicKey);
      setEcdhShouldJoin(false);
      setEcdhChannel(ch);
      console.log('joined channel:', ch);
    }
  }
  React.useEffect(() => {newChanel()}, []);
  React.useEffect(() => {updateChannel()}, [setEcdhShouldJoin, info, info?.ecdhPublicKey]);

  async function testSign() {
    const API = new PRuntime(pRuntimeEndpoint);
    // message
    const data = stringToU8a(message);
    const msgB64 = base64.fromByteArray(data);
    await API.test({
      testEcdh: { 
        pubkeyHex: ecdhChannel?.localPubkeyHex,
        messageB64: msgB64,
      }
    })
    console.log('Sent test: ', ecdhChannel?.localPubkeyHex, msgB64);
  }

  // utilities

  function shortKey(key: string = '', len: number = 32): string {
    if (key.startsWith('0x')) {
      key = key.substring(2);
    }
    if (!key) {
      return ''
    }
    return key.substring(0, len) + '...';
  }

  return (
    <main className={className}>
      <Banner>
        <div className='box'>
          <div className='info'>
            <p><strong>Phala Network testnet POC1</strong></p>
            <p>Test only. The network may be reset randomly. pRuntime is running in development mode. So currently the confidentiality is not guaranteed.</p>
          </div>
        </div>
      </Banner>
      <SummaryBar
        pRuntimeEndpoint={pRuntimeEndpoint}
        pRuntimeConnected={latency != null}
        pRuntimeLatency={latency ? latency : undefined}
        pRuntimeInitalized={info?.initialized}
        pRuntimeBlock={info?.blocknum}
        pRuntimeECDHKey={info?.ecdhPublicKey}
        onChanged={setPRuntimeEndpoint}
      />
      <section>
        <h2>ECDH test</h2>
        <div className='ui--row'>
          <div className='large'>
            <div>
              <Input
                className='full'
                label={t('message')}
                onChange={setMessage}
                onEnter={testSign}
                placeholder={t('any text')}
                value={message}
              />
            </div>
            <div>
              <table>
                <tbody>
                  <tr><td>ECDH Public</td><td>{shortKey(ecdhChannel?.localPubkeyHex)}</td></tr>
                  <tr><td>ECDH Private</td><td>{shortKey(ecdhChannel?.localPrivkeyHex)}</td></tr>
                  <tr><td>pRuntime Public</td><td>{shortKey(info?.ecdhPublicKey)}</td></tr>
                  <tr><td>Derived Secret</td><td>{shortKey(ecdhChannel?.agreedSecretHex)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      <AccountSelector onChange={setAccountId} />
      {keypair && keypair.isLocked &&
        <UnlockPrompt className='ui--row'>
          <div className='large'>
            <Button.Group isCentered className='button-group'>
              <Button
                isPrimary
                onClick={_toggleUnlock}
                label={t('Unlock account')}
                icon='unlock'
              />
            </Button.Group>
          </div>
        </UnlockPrompt>
      }
      {keypair && !keypair.isLocked &&
      <>
        <Tabs
            basePath={basePath}
            items={[
              {
                isRoot: true,
                name: 'assets',
                text: t('Assets')
              },
              {
                name: 'balances',
                text: t('Balances')
              },
            ]}
          />
        <Switch>
          <Route path={`${basePath}/balances`}>
            <BalancesTab
              accountId={accountId}
              ecdhChannel={ecdhChannel}
              pRuntimeEndpoint={pRuntimeEndpoint}
              keypair={keypair}
            />
          </Route>
          <Route>
            <AssetsTab
              accountId={accountId}
              ecdhChannel={ecdhChannel}
              pRuntimeEndpoint={pRuntimeEndpoint}
              keypair={keypair}
            />
          </Route>
        </Switch>
      </>}

      {showUnlock && (
        <Unlock
          onClose={_toggleUnlock}
          onUnlock={_onUnlock}
          pair={keypair}
        />
      )}
    </main>
  );
}

export default styled(translate(PhalaM2))`
  table td:nth-child(1) {
    text-align: right;
  }
  table td:nth-child(2) {
    font-family: monospace;
  }
`;
