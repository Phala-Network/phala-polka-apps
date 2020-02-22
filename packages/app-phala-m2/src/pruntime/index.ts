import axios, {AxiosInstance} from 'axios';

import { GetInfoResp, loadModel } from './models';

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

  constructor(endpoint: string = 'https://hashbox.corp.phala.network/tee-api/') {
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
    const resp = await this.req(path, param);
    return loadModel<T>(resp);
  }

  // API get_info
  async getInfo(): Promise<GetInfoResp> {
    return await this.reqTyped<GetInfoResp>('get_info');
  }
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