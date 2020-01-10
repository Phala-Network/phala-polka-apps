
import React from 'react';

import ImgPhalaLogo from './assets/phala-logo.png';
import ImgNearLogo from './assets/near-logo.svg';

interface Props {
  loading: boolean;
}

export function CrossChain ({loading}: Props): React.ReactElement<Props> | null {
  return (
    <div className="cross-chain">
      <img className="xc-near" src={ImgNearLogo} />
      <div className={loading ? 'lds-ellipsis' : 'lds-ellipsis hide'}>
        <div />
        <div />
        <div />
        <div />
      </div>
      <img className="xc-phala" src={ImgPhalaLogo} />
    </div>
  );
}