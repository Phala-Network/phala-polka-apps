export interface BalanceReq {
  id: number;
  account: string;
}

export interface BalanceResp {
  balance: string;
}

export interface MetadataResp {
  metadata: Array<AssetMetadata>;
}

export interface AssetMetadata {
  owner: string;
  totalSupply: string;
  symbol: string;
  id: number;
}

export interface ListAssetsReq {
  availableOnly: boolean;
}

export interface ListAssetsResp {
  assets: Array<AssetMetadataBalance>;
}

export interface AssetMetadataBalance {
  metadata: AssetMetadata;
  balance: string;
}
