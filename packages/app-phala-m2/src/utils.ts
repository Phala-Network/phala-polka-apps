import { u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';

export function u8aToHexCompact(data: Uint8Array): string {
  return u8aToHex(data).substring(2);
}

export function ss58ToHex(ss58: string): string {
  const pubkeyData = decodeAddress(ss58);
  return u8aToHexCompact(pubkeyData);
}