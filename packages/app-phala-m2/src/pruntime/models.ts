import camelcaseKeys from 'camelcase-keys';

export interface GetInfoResp {
  initialized: boolean;
  blocknum: number;
  publicKey: string;
  ecdhPublicKey: string;
}

export interface TestReq {
  test_block_parse?: boolean;
  test_bridge?: boolean;
  test_ecdh?: TestEcdhParam;
}
export interface TestEcdhParam {
  pubkey_hex?: string;
  message_b64?: string;
}
export interface TestResp {}

// Loads the model and covnerts the snake case keys to camel case.
export function loadModel<T>(obj: {[key: string]: any}): T {
  return camelcaseKeys(obj) as unknown as T;
}
