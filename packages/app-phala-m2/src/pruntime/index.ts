import { stringToU8a, u8aToHex } from '@polkadot/util';
import { KeyringPair } from '@polkadot/keyring/types';

import axios, {AxiosInstance} from 'axios';
import * as base64 from 'base64-js';

import Crypto, { EcdhChannel } from './crypto';
import * as Models from './models';
import config from '../config';
import {u8aToHexCompact} from '../utils';

const {Aead, Ecdh} = Crypto;

// Generates a radom nonce object used in pRuntime requests
function nonce(): object {
  return { id: Math.random()*65535 | 0 };
}
// pRuntime API response type
interface ApiResponse {
  payload: string;
  signature: string;
  status: 'ok' | 'err';
}

// PRuntime API client
class PRuntime {
  endpoint: string;
  service: AxiosInstance;

  constructor(endpoint: string = config.pRuntimeEndpoint) {
    this.endpoint = endpoint;
    this.service = axios.create({
      baseURL: endpoint
    });
  }

  // Internally
  async req(path: string, param: object = {}) {
    const data = {
      input: param,
      nonce: nonce()
    };
    const resp = await this.service.post<ApiResponse>(path, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    // TODO: validate the signature here
    const payload = JSON.parse(resp.data.payload);
    return payload;
  }

  // Sends the request and returns the decoded response
  async reqTyped<T>(path: string, param: object = {}): Promise<T> {
    const apiParam = Models.toApi(param);
    const resp = await this.req(path, apiParam);
    return Models.fromApi<T>(resp);
  }

  // API get_info
  async getInfo(): Promise<Models.GetInfoResp> {
    return await this.reqTyped<Models.GetInfoResp>('get_info');
  }

  // API test
  async test(params: Models.TestReq): Promise<Models.TestResp> {
    return await this.reqTyped<Models.TestResp>('test', params);
  }

  // API query
  async query<T>(contractId: number, request: T, channel: EcdhChannel, keypair?: KeyringPair) {
    const query: Models.Query<T> = {
      contractId: contractId,
      nonce: Math.random()*65535 | 0,
      request,
    };
    const cipher = await encryptObj(channel, query);
    const payload = {Cipher: cipher};  // May support plain text in the future.
    const q = signQuery(payload, keypair);
    return await this.reqTyped<object>('query', q);
  }
}

// Encrypt `data` by AEAD-AES-GCM with the secret key derived by ECDH
export async function encrypt(channel: EcdhChannel, data: ArrayBuffer): Promise<Models.AeadCipher> {
  if (!channel.core.agreedSecret) {
    throw new Error('EcdhChannel remote not joined');
  }
  const key = channel.core.agreedSecret;
  const iv = Aead.generateIv();
  const cipher = await Aead.encrypt(iv, key, data);
  const pkData = await Crypto.dumpKeyData(channel.core.localPair.publicKey);
  console.log('AGREED', channel.agreedSecretHex);
  console.log('DATA', u8aToHex(new Uint8Array(data)));
  console.log('CIPHER', u8aToHex(new Uint8Array(cipher)));
  return {
    ivB64: base64.fromByteArray(iv),
    cipherB64: base64.fromByteArray(new Uint8Array(cipher)),
    pubkeyB64: base64.fromByteArray(new Uint8Array(pkData)),
  }
}

// Serialize and encrypt `obj` by AEAD-AES-GCM with the secret key derived by ECDH
export async function encryptObj(channel: EcdhChannel, obj: any)
: Promise<Models.AeadCipher> {
  console.log('encryptObj', [channel, obj]);
  const apiObj = Models.toApi(obj);
  const objJson = JSON.stringify(apiObj);
  const data = stringToU8a(objJson);
  return await encrypt(channel, data);
}

export function signQuery(query: object, keypair?: KeyringPair) {
  const apiQuery = Models.toApi(query);
  const queryJson = JSON.stringify(apiQuery);
  const data = stringToU8a(queryJson);
  const signedQuery: Models.SignedQuery = { queryPayload: queryJson };
  if (keypair) {
    const sig = keypair.sign(data);
    signedQuery.origin = {
      origin:  u8aToHexCompact(keypair.publicKey),
      sigB64: base64.fromByteArray(sig),
      sigType: keypair.type
    };
  }
  return signedQuery;
}

type AsyncFunction = () => Promise<void>;

// Measures the duration of running an async function (in ms)
export async function measure(op: AsyncFunction): Promise<number> {
  const begin = Date.now();
  await op();
  const end = Date.now();
  return end - begin;
}

export default PRuntime;