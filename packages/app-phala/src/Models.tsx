
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
