import { u8aToHexCompact } from '../../utils';
import * as Aead from './aead';
import * as Ecdh from './ecdh';

export async function dumpKeyData(key: CryptoKey): Promise<ArrayBuffer> {
  if (key.type == 'public' || key.type == 'secret') {
    return await crypto.subtle.exportKey('raw', key);
  } else if (key.type == 'private') {
    // dump pkcs8
    return await crypto.subtle.exportKey('pkcs8', key);
  } else {
    throw new Error('Unsupported key type');
  }
}

export async function dumpKeyString(key: CryptoKey): Promise<string> {
  let data = await dumpKeyData(key);
  return u8aToHexCompact(new Uint8Array(data));
}

export default {
  Aead, Ecdh,
  dumpKeyData,
  dumpKeyString
}
