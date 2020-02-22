// Copyright 2017-2019 @polkadot/app-123code authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

// some types, AppProps for the app and I18nProps to indicate
// translatable strings. Generally the latter is quite "light",
// `t` is inject into props (see the HOC export) and `t('any text')
// does the translation
import { AppProps, I18nProps } from '@polkadot/react-components/types';

// external imports (including those found in the packages/*
// of this repo)
import React, { useState } from 'react';

// local imports and components
import AccountSelector from './AccountSelector';
import SummaryBar from './SummaryBar';
import Transfer from './Transfer';
import translate from './translate';

import PRuntime, {measure} from './pruntime';
import {GetInfoResp} from './pruntime/models';

// define our internal types
interface Props extends AppProps, I18nProps {}

function TemplateApp ({ className }: Props): React.ReactElement<Props> {
  const [accountId, setAccountId] = useState<string | null>(null);

  const [endpoint, setEndpoint] = useState<string>('');
  const [latency, setLatency] = useState<number | null>(null);
  const [info, setInfo] = useState<GetInfoResp | null>(null);

  React.useEffect(() => {
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
      setTimeout(update, 1000);
    };
    update();
  }, [])

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
      <AccountSelector onChange={setAccountId} />
      <Transfer accountId={accountId} />
    </main>
  );
}

export default translate(TemplateApp);
