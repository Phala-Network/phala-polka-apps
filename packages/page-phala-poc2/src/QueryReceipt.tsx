import React, { useState } from 'react';
import styled from 'styled-components';

import { Button, Bubble, Card } from '@polkadot/react-components';
import { KeyringPair } from '@polkadot/keyring/types';
import { ss58ToHex } from './utils';
import Summary from './Summary';
import PRuntime from './pruntime';
import {EcdhChannel} from './pruntime/crypto';
import { ButtonProps } from '@polkadot/react-components/Button/types';
import { Input } from '@polkadot/react-components';

interface Props {
  contractId: number;
  accountId: string | null;
  ecdhChannel: EcdhChannel | null;
  pRuntimeEndpoint: string;
  keypair: KeyringPair | null;
}

const QuerySection = styled.section`
  margin-bottom: 5px;
`;

export default function QueryReceipt ({ contractId, accountId, ecdhChannel, pRuntimeEndpoint, keypair }: Props): React.ReactElement<Props> {
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [hash, setHash] = useState<String>('');

  function checkChannelReady(): boolean {
    if (!keypair || keypair.isLocked) {
      alert('Account not ready');
      return false;
    }
    if (!ecdhChannel || !ecdhChannel.core.agreedSecret || !ecdhChannel.core.remotePubkey) {
      alert('ECDH not ready');
      return false;
    }
    return true;
  }

  async function query(targetAccount: string | null) {
    if (!checkChannelReady()) return;
    if (!targetAccount) {
      alert('Dest account not selected');
      return;
    }
    let data = {
      QueryReceipt: {
        account: ss58ToHex(targetAccount),
        tx_hash: hash.startsWith("0x")? hash.substring(2) : hash,
      }
    };
    const result: object = await new PRuntime(pRuntimeEndpoint).query(contractId, data, ecdhChannel!, keypair!);
    setQueryResult(result);
  }

//{"QueryReceipt":{"receipt":{"account":"d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d","blockNum":53,"command":"{\"Transfer\":{\"dest\":\"dc5c0eea8f8602deb7e1844b87b7635d5e5dfd5737ab5ddbcf62db78a8f7a01d\",\"value\":\"10000000000000000\"}}","contractId":2,"status":"Ok","txHash":"240c2e8b6e1536d484eaadef4c820c9991e0ac7e2d6b947ebed8b0bd4ad5b156"}}}

  function formatResult(result): String {
    let output = {
      blockNumber: result.QueryReceipt.receipt.blockNum,
      transactionHash: result.QueryReceipt.receipt.txHash,
      contractId: result.QueryReceipt.receipt.contractId,
      status: result.QueryReceipt.receipt.status,
    }

    return JSON.stringify(output);
  }

  function formatError(error: any): string {
    if (typeof error === 'string') {
      return error;
    } else {
      return JSON.stringify(error);
    }
  }

  return (
    <section>
      <h2>query receipt</h2>
      <div className='ui--row'>
        <div className='large'>
          <QuerySection>
            <Input
              className='medium'
              label='transaction hash'
              onChange={setHash}
              placeholder='0x...'
              type='text'
              withLabel='withLabel'
            />
            <Button
              icon='search'
              label='Query'
              isPrimary
              onClick={() => query(accountId)}
            />
          </QuerySection>

          <Card>
            <p><strong>response</strong></p>
            { queryResult?.Error && (
              <Bubble color='red' icon='minus-circle' label='error'>
                {formatError(queryResult.Error)}
              </Bubble>
            )}
            { queryResult?.QueryReceipt && (
              <div>
                <code>
                  {formatResult(queryResult)}
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
