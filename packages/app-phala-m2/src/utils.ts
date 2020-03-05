import { u8aToHex } from '@polkadot/util';

export function u8aToHexCompact(data: Uint8Array) {
  return u8aToHex(data).substring(2);
}