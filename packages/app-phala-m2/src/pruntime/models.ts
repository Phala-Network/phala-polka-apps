import camelcaseKeys from 'camelcase-keys';

export interface GetInfoResp {
  initialized: boolean;
  blocknum: number;
  publicKey: string;
  ecdhPublicKey: string;
}

// Loads the model and covnerts the snake case keys to camel case.
export function loadModel<T>(obj: {[key: string]: any}): T {
  return camelcaseKeys(obj) as unknown as T;
}
