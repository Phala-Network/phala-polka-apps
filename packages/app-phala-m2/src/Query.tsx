import React, { useState } from 'react';
import styled from 'styled-components';

import { Button, Bubble, Balance, Card } from '@polkadot/react-components';
import { KeyringPair } from '@polkadot/keyring/types';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import BN from 'bn.js';

import Summary from './Summary';
import PRuntime from './pruntime';
import {EcdhChannel} from './pruntime/crypto';
import {ss58ToHex} from './utils';

interface Props {
  contractId: number;
  accountId: string | null;
  ecdhChannel: EcdhChannel | null;
}

const QuerySection = styled.section`
  margin-bottom: 5px;
`;

export default function Query ({ contractId, accountId, ecdhChannel }: Props): React.ReactElement<Props> {
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

  const [queryResult, setQueryResult] = useState<any | null>(null);

  function checkChannelReady(): boolean {
    if (!keypair) {
      alert('Account not ready');
      return false;
    }
    if (!ecdhChannel || !ecdhChannel.core.agreedSecret || !ecdhChannel.core.remotePubkey) {
      alert('ECDH not ready');
      return false;
    }
    return true;
  }

  async function queryFreeBalance(targetAccount: string | null) {
    if (!checkChannelReady()) return;
    if (!targetAccount) {
      alert('Dest account not selected');
      return;
    }
    const result: object = await new PRuntime().query(contractId, {
      FreeBalance: {
        account: ss58ToHex(targetAccount)
      }
    }, ecdhChannel!, keypair!);
    setQueryResult(result);
  }

  async function queryTotalIssuance() {
    if (!checkChannelReady()) return;
    const result: object = await new PRuntime().query(
      contractId, 'TotalIssuance', ecdhChannel!, keypair!);
    setQueryResult(result);
  }

  return (
    <section>
      <h1>query</h1>
      <div className='ui--row'>
        <div className='large'>
          <QuerySection>
            <Button
              icon='search'
              label='TotalIssuannce'
              isPrimary
              onClick={() => queryTotalIssuance()}
            />
            <Button
              icon='search'
              label='FreeBalance'
              isPrimary
              onClick={() => queryFreeBalance(accountId)}
            />
            <Button
              icon='search'
              label='FreeBalance for Bob'
              isNegative
              onClick={() => queryFreeBalance('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty')}
            />
          </QuerySection>

          <Card>
            <p><strong>response</strong></p>
            { queryResult?.TotalIssuance?.totalIssuance && (
              <Bubble color='yellow' icon='adjust' label='total issuance'>
                <Balance
                  balance={new BN(queryResult.TotalIssuance.totalIssuance)}
                  params={'dummy'}
                />
              </Bubble>
            )}
            { queryResult?.FreeBalance?.balance && (
              <Bubble color='yellow' icon='adjust' label='balance'>
                <Balance
                  balance={new BN(queryResult.FreeBalance.balance)}
                  params={'dummy'}
                />
              </Bubble>
            )}
            { queryResult?.Error && (
              <Bubble color='red' icon='minus circle' label='error'>
                {queryResult.Error}
              </Bubble>
            )}
            { queryResult && (
              <div>
                <code>
                  {JSON.stringify(queryResult)}
                </code>
              </div>
            )}
          </Card>
        </div>
        <Summary className='small'>Query the balance of an account on behalf of the selected identity. The balance of an account is only accessible by the owner.</Summary>
      </div>
    </section>
  );
}