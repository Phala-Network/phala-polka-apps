import BN from 'bn.js';

export interface Item {
  id: number;
  seller: string;
  txref: TxRef;
  details: ItemDetals;
}

export interface ItemDetals {
  category: string;
  dataset_link: string;
  dataset_preview: string;
  description: string;
  name: string;
  price: {PerRow: {price: string}};
}

export interface TxRef {
  blocknum: number;
  index: number;
}

const decimals = new BN("100000000000000"); // 1e14
const b100 = new BN("100");
export function fmtAmount(amount: string) {
   const bigamount = new BN(amount)
   return bigamount.mul(b100).div(decimals).toNumber() / 100;
}