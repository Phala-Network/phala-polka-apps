import { hexToU8a, u8aToHex } from '@polkadot/util';

const kAllowExport = true;
const kAlgorithm = {name: "ECDH", namedCurve: "P-256"};
const kSymmetricAlgorithm = {name: 'AES-GCM', length: 256};

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    kAlgorithm, kAllowExport,
    ["deriveKey", "deriveBits"]);
}

async function importPubkey(key: Uint8Array): Promise<CryptoKey> {
  return await crypto.subtle.importKey('raw', key, kAlgorithm, true, []);
}

export async function deriveSecretKey(privkey: CryptoKey, hexPubkey: string): Promise<CryptoKey> {
  const pubkeyData = hexToU8a('0x' + hexPubkey);
  const pubkey = await importPubkey(pubkeyData);
  
  const shared = await crypto.subtle.deriveKey(
    {name: 'ECDH', public: pubkey},
    privkey,
    kSymmetricAlgorithm,
    kAllowExport,
    ['encrypt', 'decrypt']
  );

  return shared;
}

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
  const hexWith0x = u8aToHex(new Uint8Array(data));
  return hexWith0x.substring(2);
}