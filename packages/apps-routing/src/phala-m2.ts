// Copyright 2017-2019 @polkadot/apps-routing authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Routes } from './types';

import PhalaM2 from '@polkadot/app-phala-m2';

export default ([
  {
    Component: PhalaM2,
    display: {
      isHidden: false,
      needsAccounts: true,
      needsApi: [
        'tx.balances.transfer'
      ]
    },
    i18n: {
      defaultValue: 'Phala Demo M2'
    },
    icon: 'microchip',
    name: 'phala-m2'
  }
] as Routes);
