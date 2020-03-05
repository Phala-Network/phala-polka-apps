import { stringToU8a, u8aToHex } from '@polkadot/util';
import { KeyringPair } from '@polkadot/keyring/types';

import axios, {AxiosInstance} from 'axios';
import * as base64 from 'base64-js';

import * as Ecdh from './ecdh';
import * as Aead from './aead';
import * as Models from './models';
import config from '../config';
import {u8aToHexCompact} from '../utils';

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
  async query<T>(contractId: number, request: T, keypair?: KeyringPair) {
    const q = signQuery({
      contractId: contractId,
      request: request,
      nonce: Math.random()*65535 | 0,
    }, keypair);
    return await this.reqTyped<Models.TestResp>('query', q);
  }
}

// Encrypt `data` by AEAD-AES-GCM with the secret key derived by ECDH
export async function encrypt(sk: CryptoKey, pk: CryptoKey, remotePkHex: string, data: ArrayBuffer)
: Promise<Models.AeadCipher> {
  const key = await Ecdh.deriveSecretKey(sk, remotePkHex);
  const iv = Aead.generateIv();
  const cipher = await Aead.encrypt(iv, key, data);
  const pkData = await Ecdh.dumpKeyData(pk);
  return {
    ivB64: base64.fromByteArray(iv),
    cipherB64: base64.fromByteArray(new Uint8Array(cipher)),
    pubkeyB64: base64.fromByteArray(new Uint8Array(pkData)),
  }
}

// Serialize and encrypt `obj` by AEAD-AES-GCM with the secret key derived by ECDH
export async function encryptObj(sk: CryptoKey, pk: CryptoKey, remotePkHex: string, obj: any)
: Promise<Models.AeadCipher> {
  const objJson = JSON.stringify(obj);
  const data = stringToU8a(objJson);
  return await encrypt(sk, pk, remotePkHex, data);
}

export function signQuery<T>(query: Models.Query<T>, keypair?: KeyringPair) {
  const apiQuery = Models.toApi(query);
  const queryJson = JSON.stringify(apiQuery);
  const data = stringToU8a(queryJson);
  const signedQuery: Models.SignedQuery = { query: queryJson };
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