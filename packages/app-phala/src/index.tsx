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
import { Route, Switch } from 'react-router';
import Tabs from '@polkadot/react-components/Tabs';

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';

SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('sql', sql);

import translate from './translate';
import AccountSelector from './AccountSelector';
import SummaryBar from './SummaryBar';
import Items from './Items';
import List from './List';
import NewOrder from './NewOrder';
import ViewItem from './ViewItem';
import Result from './Result';
import AppContext, { AppState } from './AppContext';

import './index.css';

interface Props extends AppProps, I18nProps {}

function Orders (): React.ReactElement {
  return (<div>orders</div>)
}

function PhalaApp ({ basePath, className, t }: Props): React.ReactElement<Props> {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [state, setState] = useState<AppState>(AppContext.default());

  return (
    // in all apps, the main wrapper is setup to allow the padding
    // and margins inside the application. (Just from a consistent pov)
    <main className={`phala ${className}`}>
      <header>
        <Tabs
          basePath={basePath}
          // hidden={
          //   uiSettings.uiMode === 'full'
          //     ? api.query.babe ? [] : ['forks']
          //     : ['node', 'forks']
          // }
          items={[
            {
              isRoot: true,
              name: 'items',
              text: t('商品列表')
            },
            {
              name: 'list',
              text: t('发布商品')
            },
            {
              name: 'orders',
              text: t('订单管理')
            },
            {
              name: 'account',
              text: t('账户')
            }
          ]}
        />
      </header>
      <AppContext.Context.Provider value={{state, setState}}>
        <Switch>
          <Route path={`${basePath}/list`} render={(): React.ReactElement<{}> => (
            <List basePath={basePath} accountId={accountId} />
          )} />
          <Route path={`${basePath}/new_order/:value`} render={(): React.ReactElement<{}> => (
            <NewOrder basePath={basePath} accountId={accountId} />
          )} />
          <Route path={`${basePath}/orders`} component={Orders} />
          <Route path={`${basePath}/item/:value`} render={(): React.ReactElement<{}> => (
            <ViewItem basePath={basePath} />
          )} />
          <Route path={`${basePath}/account`} render={(): React.ReactElement<{}> => (
            <AccountSelector onChange={setAccountId} />
          )} />
          <Route path={`${basePath}/result/:type/:value`} render={(): React.ReactElement<{}> => (
            <Result basePath={basePath} accountId={accountId} />
          )} />
          <Route render={(): React.ReactElement<{}> => (
            <Items basePath={basePath} />
          )} />
        </Switch>
      </AppContext.Context.Provider>

      <div style={{marginTop: 30}}>
        <SummaryBar />
      </div>
      
      <div>Current account id: {accountId}</div>
      // alice: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
      // bob: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty

    </main>
  );
}

export default translate(PhalaApp);
