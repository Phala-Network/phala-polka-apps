import React from 'react';
import * as nearlib from 'nearlib';
import { Near } from 'nearlib/near';

interface NearAPI {
  near: any | null;
  walletAccount: nearlib.WalletAccount | null;
  accountId: string;
  contract: nearlib.Contract | null;
}

export interface AppState {
  items: Array<number>;
  orders: Array<number>;
  paidOrders: Array<number>;
  near: NearAPI;
}

function def(): AppState {
  return {
    items: [],
    orders: [],
    paidOrders: [],
    near: {
      near: null,
      walletAccount: null,
      accountId: '',
      contract: null,
    }
  }
}

export interface AppContextType {
  state: AppState;
  setState: Function;
}

const ctx = React.createContext<AppContextType>({
  state: def(),
  setState: () => {},
});

export default {
  Context: ctx,
  default: def,
};
