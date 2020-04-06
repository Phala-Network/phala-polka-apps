// Copyright 2017-2019 @polkadot/app-123code authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

// some types, AppProps for the app and I18nProps to indicate
// translatable strings. Generally the latter is quite "light",
// `t` is inject into props (see the HOC export) and `t('any text')
// does the translation
import { AppProps, I18nProps } from '@polkadot/react-components/types';
import Tabs from '@polkadot/react-components/Tabs';
import { KeyringPair } from '@polkadot/keyring/types';

// external imports (including those found in the packages/*
// of this repo)
import React, { useState } from 'react';
import { Route, Switch } from 'react-router';
import styled from 'styled-components';

// local imports and components
import BalancesTab from './contracts/balances';
import AssetsTab from './contracts/assets';
import SettingsTab from './SettingsTab';
import translate from './translate';

import PRuntime, {measure} from './pruntime';
import {GetInfoResp} from './pruntime/models';
import Crypto, {EcdhChannel} from './pruntime/crypto';
import config from './config';

interface Props extends AppProps, I18nProps {}

const Banner = styled.div`
  padding: 0 0.5rem 0.5rem;
  margin-top: 10px;
  margin-bottom: 20px;

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


function PhalaM2 ({ className, t, basePath }: Props): React.ReactElement<Props> {
  const [pRuntimeEndpoint, setPRuntimeEndpoint] = useState<string>(config.pRuntimeEndpoint);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [keypair, setKeypair] = useState<KeyringPair | null>(null);

  // get_info loop

  const [latency, setLatency] = useState<number>(0);
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

  // ecdh sign

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

  return (
    <main className={className}>
      <Tabs
          basePath={basePath}
          hidden={(keypair && !keypair.isLocked) ? [] : ['assets', 'balances']}
          items={[
            {
              name: 'assets',
              text: t('Assets')
            },
            {
              name: 'balances',
              text: t('Balances')
            },
            {
              isRoot: true,
              name: 'settings',
              text: t('Settings')
            }
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
        <Route path={`${basePath}/assets`}>
          <AssetsTab
            accountId={accountId}
            ecdhChannel={ecdhChannel}
            pRuntimeEndpoint={pRuntimeEndpoint}
            keypair={keypair}
          />
        </Route>
        <Route>
          <Banner>
            <div className='box'>
              <div className='info'>
                <p><strong>Phala Network testnet POC1</strong></p>
                <p>Test only. The network may be reset randomly. pRuntime is running in development mode. So currently the confidentiality is not guaranteed.</p>
                <p>Please select an account first.</p>
              </div>
            </div>
          </Banner>
          <SettingsTab
            ecdhChannel={ecdhChannel}
            info={info}
            latency={latency}
            pRuntimeEndpoint={pRuntimeEndpoint}
            setPRuntimeEndpoint={setPRuntimeEndpoint}
            setAccountId={setAccountId}
            setKeypair={setKeypair}
          />
        </Route>
      </Switch>
    </main>
  );
}

export default translate(PhalaM2);
