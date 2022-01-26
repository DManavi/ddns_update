import { HttpStatus } from '@nestjs/common';
import axios from 'axios';

import { IpAddressRetrieverFunction } from '../../../shared/ip_retriever_function';
import { IpAddressFamily } from '../../../shared/ip_address_family';

const SERVER_URL = 'https://api.ipify.org';

export const retrieveIpAddress: IpAddressRetrieverFunction = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ipAddressFamily: IpAddressFamily,
): Promise<string> => {
  // create HTTP client
  const client = axios.create({
    baseURL: SERVER_URL,

    timeout: 30 * 1000, // in seconds
    responseType: 'json',
    validateStatus: (status) => status === HttpStatus.OK,
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
