// Copyright 2017-2019 @polkadot/app-123code authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

// some types, AppProps for the app and I18nProps to indicate
// translatable strings. Generally the latter is quite "light",
// `t` is inject into props (see the HOC export) and `t('any text')
// does the translation
import { AppProps, I18nProps } from '@polkadot/react-components/types';
import { Input } from '@polkadot/react-components';
import Tabs from '@polkadot/react-components/Tabs';
import { stringToU8a } from '@polkadot/util';

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
      } catch (err) { console.debug(err) }
      if (!stop) {
        setTimeout(update, 1000);
      }
    };
    update();
    return () => { stop = true; console.log('stop'); }
  }, [pRuntimeEndpoint])

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
      <Tabs
          basePath={basePath}
          items={[
            {
              name: 'balances',
              text: t('Balances')
            },
            {
              name: 'assets',
              text: t('Assets')
            },
          ]}
        />
      <Switch>
        <Route path={`${basePath}/balances`}>
          <BalancesTab
            accountId={accountId}
            ecdhChannel={ecdhChannel}
            pRuntimeEndpoint={pRuntimeEndpoint}
          />
        </Route>
        <Route path={`${basePath}/assets`}>
          <AssetsTab
            accountId={accountId}
            ecdhChannel={ecdhChannel}
            pRuntimeEndpoint={pRuntimeEndpoint}
          />
        </Route>
        <Route>
          <p>Please select a contract.</p>
        </Route>
      </Switch>
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
