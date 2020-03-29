import React, { useState } from 'react';
import styled from 'styled-components';
import { Accordion, Icon } from 'semantic-ui-react'

import { I18nProps } from '@polkadot/react-components/types';
import { Dropdown } from '@polkadot/react-components';
import { KeyringPair } from '@polkadot/keyring/types';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import Summary from '../../Summary';
import PRuntime from '../../pruntime';
import {EcdhChannel} from '../../pruntime/crypto';
import translate from '../../translate';

import * as Models from './models';
import { formatBalance } from '@polkadot/util';

interface Props extends I18nProps {
  contractId: number;
  accountId: string | null;
  ecdhChannel: EcdhChannel | null;
  pRuntimeEndpoint: string;
  onChange: (asset: Models.AssetMetadata) => void;
}

const mockMetadata: Models.MetadataResp = {
  metadata: [
    {
      owner: 'd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d',
      totalSupply: '1024000000000000',
      symbol: 'TTT',
      id: 0,
    },
    {
      owner: 'd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d',
      totalSupply: '1024000000000000',
      symbol: 'PHA',
      id: 1,
    },
  ]
};

// for million, 2 * 3-grouping + comma
const M_LENGTH = 6 + 1;

function formatAssetBalance (asset: Models.AssetMetadata) {
  const [prefix, postfix] = formatBalance(asset.totalSupply, { forceUnit: '-', withSi: false }).split('.');

  if (prefix.length > M_LENGTH) {
    // TODO Format with balance-postfix
    return formatBalance(asset.totalSupply);
  }

  return <>{prefix}.<span className='balance-postfix'>{`000${postfix || ''}`.slice(-3)}</span></>;
}

type MetadataQueryResult = {Metadata: Models.MetadataResp};

const MetadataDetailContainer = styled.div`
  margin-left: 29px;
  margin-top: 5px;
  pre {
    overflow: scroll;
  }
`;

function AssetSelector ({ contractId, accountId, ecdhChannel, pRuntimeEndpoint, onChange, t }: Props): React.ReactElement<Props> {
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

  const [queryResult, setQueryResult] = useState<MetadataQueryResult | null>({
    Metadata: mockMetadata
  });

  async function queryMetadata() {
    const result: object = await new PRuntime(pRuntimeEndpoint).query(
      contractId, 'Metadata', ecdhChannel!, keypair!);
    setQueryResult(result as MetadataQueryResult);
  }

  React.useEffect(() => {
    if (!keypair || !ecdhChannel || !ecdhChannel.core.agreedSecret || !ecdhChannel.core.remotePubkey) {
      return;
    }
    queryMetadata();
  }, [keypair, ecdhChannel])

  const [assetId, setAssetId] = useState<number | null>(null);

  function findAsset(result: Models.MetadataResp, id: number): Models.AssetMetadata | null {
    return result.metadata.find(m => m.id == id) || null;
  }

  function internalOnChange(i: number | null) {
    if (i == null) {
      return;
    }
    setAssetId(i);
    console.log(queryResult, i);
    const asset = findAsset(queryResult!.Metadata, i)!;
    onChange(asset);
  }

  const [expand, setExpand] = useState(false);

  return (
    <section>
      <div className='ui--row'>
        <div className='large'>

          <Dropdown
            // className='medium'
            help={t('Select an issued asset on the blockchain')}
            isDisabled={!(queryResult?.Metadata?.metadata)}
            label={t('Select asset')}
            options={
              queryResult?.Metadata?.metadata.map((a: Models.AssetMetadata) => ({
                text: a.symbol,
                value: a.id
              })) || []
            }
            onChange={internalOnChange}
            value={assetId}

            labelExtra={
              <>
              {<label>{t('total supply')}</label>}
              {queryResult && assetId != null
               && formatAssetBalance(findAsset(queryResult.Metadata, assetId)!)
               || '-'}
              </>
            }
          />

          <MetadataDetailContainer>
            <Accordion fluid styled className='metadata-details'>
              <Accordion.Title
                active={expand}
                index={0}
                onClick={() => setExpand(!expand)}
              >
                <Icon name='dropdown' />
                Assets Metadata
              </Accordion.Title>
              <Accordion.Content active={expand}>
                <pre>{JSON.stringify(queryResult, undefined, 2)}</pre>
              </Accordion.Content>
            </Accordion>
          </MetadataDetailContainer>
        </div>
        <Summary className='small'>Select an asset or issue your own asset.</Summary>
      </div>
    </section>
  );
}

export default translate(AssetSelector);