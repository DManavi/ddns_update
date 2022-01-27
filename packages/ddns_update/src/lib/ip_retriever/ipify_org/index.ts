import axios from 'axios';

import { IpAddressRetrieverFunction } from '../../../shared/ip_retriever_function';

const SERVER_URL = 'https://api.ipify.org';

export const retrieveIpAddress: IpAddressRetrieverFunction =
  async (): Promise<string> => {
    // create HTTP client
    const client = axios.create({
      baseURL: SERVER_URL,

      timeout: 30 * 1000, // in seconds
      responseType: 'json',
    });

    // perform the request
    const response = await client.get<{ ip: string }>('/', {
      params: {
        format: 'json',
      },
    });

    // return the result
    return response.data.ip;
  };
