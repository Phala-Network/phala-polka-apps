// Copyright 2017-2019 @polkadot/app-123code authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

// some types, AppProps for the app and I18nProps to indicate
// translatable strings. Generally the latter is quite "light",
// `t` is inject into props (see the HOC export) and `t('any text')
// does the translation
import { AppProps, I18nProps } from '@polkadot/react-components/types';
import { Input } from '@polkadot/react-components';
import { stringToU8a } from '@polkadot/util';

// external imports (including those found in the packages/*
// of this repo)
import React, { useState } from 'react';
import styled from 'styled-components';
import * as base64 from 'base64-js';

// local imports and components
import AccountSelector from './AccountSelector';
import SummaryBar from './SummaryBar';
import Transfer from './Transfer';
import translate from './translate';

import PRuntime, {measure} from './pruntime';
import {GetInfoResp} from './pruntime/models';
import * as ECDH from './pruntime/ecdh';

// define our internal types
interface Props extends AppProps, I18nProps {}

function TemplateApp ({ className, t }: Props): React.ReactElement<Props> {
  const [accountId, setAccountId] = useState<string | null>(null);

  // get_info loop

  const [endpoint, setEndpoint] = useState<string>('');
  const [latency, setLatency] = useState<number | null>(null);
  const [info, setInfo] = useState<GetInfoResp | null>(null);

  React.useEffect(() => {
    let stop = false;
    const API = new PRuntime();
    setEndpoint(API.endpoint);
    const update = async () => {
      try {
        const dt = await measure(async () => {
          const info = await API.getInfo();
          setInfo(info);
        });
        setLatency(l => l ? l * 0.8 + dt * 0.2 : dt);
      } catch (err) { console.log(err) }
      if (!stop) {
        setTimeout(update, 1000);
      }
    };
    update();
    return () => { stop = true; console.log('stop'); }
  }, [])

  // ecdh sign

  const [message, setMessage] = useState('');
  const [ecdhPair, setEcdhPair] = useState<CryptoKeyPair | null>(null);
  const [runtimePubkeyHex, setRuntimePubkeyHex] = useState('');
  const [aesKey, setAesKey] = useState<CryptoKey | null>(null);
  const [ecdhPubKeyString, setEcdhPubKeyString] = useState('');
  const [ecdhPrivKeyString, setEcdhPrivKeyString] = useState('');
  const [aesKeyString, setAesKeyString] = useState('');

  async function genEcdhPair() {
    const pair = await ECDH.generateKeyPair();
    setEcdhPair(pair);
    setEcdhPubKeyString(await ECDH.dumpKeyString(pair.publicKey));
    setEcdhPrivKeyString(await ECDH.dumpKeyString(pair.privateKey));
  }
  React.useEffect(() => {genEcdhPair()}, []);
  React.useEffect(() => {
    if (info && runtimePubkeyHex != info.ecdhPublicKey) {
      setRuntimePubkeyHex(info.ecdhPublicKey);
    }
  }, [info]);
  async function handleECDHKeys() {
    if (runtimePubkeyHex && ecdhPair) {
      const aesKey = await ECDH.deriveSecretKey(ecdhPair.privateKey, runtimePubkeyHex);
      setAesKey(aesKey);
      setAesKeyString(await ECDH.dumpKeyString(aesKey));

      // send test request
      const API = new PRuntime();
      console.log(`Sending test with pk: ${ecdhPubKeyString}`);
      await API.test({testEcdh: { pubkeyHex: ecdhPubKeyString }});
    }
  }
  React.useEffect(() => {handleECDHKeys()}, [runtimePubkeyHex, ecdhPair])

  async function testSign() {
    const API = new PRuntime();
    // message
    const data = stringToU8a(message);
    const msgB64 = base64.fromByteArray(data);
    await API.test({
      testEcdh: { 
        pubkeyHex: ecdhPubKeyString,
        messageB64: msgB64,
      }
    })
    console.log('Sent test: ', ecdhPubKeyString, msgB64);
  }

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
        pRuntimeEndpoint={endpoint}
        pRuntimeConnected={latency != null}
        pRuntimeLatency={latency ? latency : undefined}
        pRuntimeInitalized={info?.initialized}
        pRuntimeBlock={info?.blocknum}
        pRuntimeECDHKey={info?.ecdhPublicKey}
      />
      <section>
        <h1>ECDH test</h1>
        <div className='ui--row'>
          <div className='large'>
            <div>
              <Input
                className='full'
                // help={t('any message')}
                // isError={!isNameValid}
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
                  <tr><td>ECDH Public</td><td>{shortKey(ecdhPubKeyString)}</td></tr>
                  <tr><td>ECDH Private</td><td>{shortKey(ecdhPrivKeyString)}</td></tr>
                  <tr><td>pRuntime Public</td><td>{shortKey(info?.ecdhPublicKey)}</td></tr>
                  <tr><td>Derived Secret</td> <td>{shortKey(aesKeyString)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      <AccountSelector onChange={setAccountId} />
      <Transfer
        accountId={accountId}
        ecdhPrivkey={ecdhPair?.privateKey}
        ecdhPubkey={ecdhPair?.publicKey}
        remoteEcdhPubkeyHex={info?.ecdhPublicKey}
      />
    </main>
  );
}

export default styled(translate(TemplateApp))`
  table td:nth-child(1) {
    text-align: right;
  }
  table td:nth-child(2) {
    font-family: monospace;
  }
`;
