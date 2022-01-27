import axios, { AxiosInstance } from 'axios';
import { isNull, isUndefined } from 'lodash';

import { IpAddressFamily } from '../../../shared/ip_address_family';

export const SERVER_URL = 'https://api.digitalocean.com/v2';

export type DomainRecord = {
  id: number;
  type: string;
  name: string;
  data: string;
};

/**
 * Returns A or AAAA based on IP address family
 * @param ipAddressFamily Either v4 or v6
 * @returns A for IPv4 and AAAA for IPv6
 */
export const getRecordTypeFilterValue = (
  ipAddressFamily: IpAddressFamily,
): string => {
  switch (ipAddressFamily) {
    case IpAddressFamily.v4:
      return 'A';
    case IpAddressFamily.v6:
      return 'AAAA';
    default:
      throw new Error(
        `IP address family '${ipAddressFamily}' is not supported.`,
      );
  }
};

export const createHttpClient = (
  serverUrl: string,
  apiKey: string,
): AxiosInstance => {
  // create HTTP client
  const client = axios.create({
    baseURL: `${serverUrl}/domains`,

    timeout: 30 * 1000, // in seconds
    responseType: 'json',

    // default headers
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  return client;
};

export const ensureDomainExist = async (
  client: AxiosInstance,
  domainName: string,
): Promise<void> => {
  // ensure domain exists
  await client.get(`/${domainName}`, {
    validateStatus: (statusCode) => statusCode === 200,
  });
};

export const fetchDomainRecords = async (
  client: AxiosInstance,
  domainName: string,
  recordType: string,
): Promise<Array<DomainRecord>> => {
  // Either A (IPv4) or AAAA (IPv6)
  // reference: https://docs.digitalocean.com/reference/api/api-reference/#operation/list_all_domain_records
  const domainRecordsResponse = await client.get<{
    domain_records: Array<DomainRecord>;
  }>(`/${domainName}/records`, {
    params: {
      type: recordType,
    },

    // only 200 and 404 are accepted
    validateStatus: (statusCode) => statusCode === 200 || statusCode === 404,
  });

  // return records
  return domainRecordsResponse.data.domain_records;
};

export const deleteDomainRecord = async (
  client: AxiosInstance,
  domainName: string,
  subdomain: string,
  recordType: string,
): Promise<void> => {
  // list records
  const domainRecords = await fetchDomainRecords(
    client,
    domainName,
    recordType,
  );

  // find record among other records matching by 'name' and 'type'
  const currentDomainRecord = domainRecords.find(
    (record) => record.name === subdomain && record.type === recordType,
  );
  const doesRecordExist =
    isNull(currentDomainRecord) === false &&
    isUndefined(currentDomainRecord) === false;

  // not found, OK
  if (doesRecordExist === false) {
    return;
  }

  // delete the record
  await client.delete(`${domainName}/records/${currentDomainRecord!.id}`, {
    validateStatus: (statusCode) => statusCode === 204,
  });
};
