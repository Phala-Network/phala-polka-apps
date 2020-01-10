import axios from 'axios';
import { Base64 } from 'js-base64';

import { Item, Order } from './common/Models'

const pruntime = axios.create({
  baseURL: '/tee-api/',
  timeout: 5000,
});

async function req(method: string, input: any) {
  const data = {
    input,
    nonce: { id: Math.floor(Math.random() * 65535) }
  };
  const resp = await pruntime.post(method, data);
  const payload = JSON.parse(resp.data.payload);
  if (resp.data.status == 'error') {
    console.error('req: received error', payload);
  }
  console.log('req received payload', payload)
  return payload;
}

async function query(request: string) {
  const result = await req('query', {'request': request});
  return result[request];
}

export async function getItems(): Promise<{items: Array<Item>}> {
  const result = await query('GetItems');
  return result;
}

export async function getItem(id: number): Promise<Item> {
  const result = await getItems();
  return result.items[id];
}

export async function getOrders(): Promise<{orders: Array<Order>}> {
  return await query('GetOrders');
}

export async function getOrder(id: number): Promise<Order> {
  const result = await getOrders();
  return result.orders[id];
}

export async function set(path: string, data: string) {
  return await req('set', {
    path,
    data: Base64.encode(data)
  })
}

export async function get(path: string) {
  const result = await req('get', {path});
  return Base64.decode(result.value);
}