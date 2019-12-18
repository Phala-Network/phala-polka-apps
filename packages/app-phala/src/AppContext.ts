import React from 'react';

export interface AppState {
  items: Array<number>;
  orders: Array<number>;
  paidOrders: Array<number>;
}

function def(): AppState {
  return {
    items: [],
    orders: [],
    paidOrders: [],
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
