// Copyright 2017-2019 @polkadot/app-123code authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Grid } from 'semantic-ui-react';
import { Bubble, InputAddress } from '@polkadot/react-components';
import { AccountIndex, Balance, Nonce } from '@polkadot/react-query';

interface Props {
  className?: string;
  onChange: (accountId: string | null) => void;
}

function AccountSelector ({ className, onChange }: Props): React.ReactElement<Props> {
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect((): void => onChange(accountId), [accountId]);

  return (
    <section className={`template--AccountSelector ${className}`}>
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
    </section>
  );
}

export default styled(AccountSelector)`
  align-items: flex-end;

  .summary {
    text-align: center;
  }
`;
