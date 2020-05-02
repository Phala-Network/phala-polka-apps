// Copyright 2017-2019 @polkadot/apps-routing authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Route } from './types';

import PhalaPoc2 from '@polkadot/app-phala-poc2';

export default function create (t: (key: string, text: string, options: { ns: string }) => string): Route {
  return {
    Component: PhalaPoc2,
    display: {
      isHidden: false,
      needsAccounts: true,
      needsApi: [
        'tx.balances.transfer'
      ]
    },
    icon: 'microchip',
    name: 'phala-poc2',
    text: t('nav.phala-poc2', 'Phala POC2', { ns: 'apps-routing' })
  };
}
