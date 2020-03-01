import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';

export interface GetInfoResp {
  initialized: boolean;
  blocknum: number;
  publicKey: string;
  ecdhPublicKey: string;
}

export interface TestReq {
  testBlockParse?: boolean;
  testBridge?: boolean;
  testEcdh?: TestEcdhParam;
}
export interface TestEcdhParam {
  pubkeyHex?: string;
  messageB64?: string;
}
export interface TestResp {}

const kRegexpEnumName = /^[A-Z][A-Za-z0-9]*$/;

// Loads the model and covnerts the snake case keys to camel case.
export function fromApi<T>(obj: {[key: string]: any}): T {
  return camelcaseKeys(obj, {deep: true, exclude: [kRegexpEnumName]}) as unknown as T;
}

export function toApi<T>(obj: T): any {
  return snakecaseKeys(obj, {deep: true, exclude: [kRegexpEnumName]});
}
