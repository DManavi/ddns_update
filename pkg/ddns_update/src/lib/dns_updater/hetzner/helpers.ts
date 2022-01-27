import axios, { AxiosInstance } from 'axios';
import { isNull, isUndefined } from 'lodash';

import { IpAddressFamily } from '../../../shared/ip_address_family';

export const SERVER_URL = 'https://dns.hetzner.com/api/v1';

export type Zone = {
  id: string;
  name: string;
};

export type DomainRecord = {
  id: string;
  type: string;
  name: string;
  value: string;
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
    baseURL: `${serverUrl}`,

    timeout: 30 * 1000, // in seconds
    responseType: 'json',

    // default headers
    headers: {
      'Auth-API-Token': `${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  return client;
};

export const fetchZoneOrFail = async (
  client: AxiosInstance,
  domainName: string,
): Promise<Zone> => {
  // ensure domain exists
  const zoneFetchResponse = await client.get<{ zones: Array<Zone> }>('/zones', {
    params: {
      name: domainName,
    },
    validateStatus: (statusCode) => statusCode === 200,
  });

  // match zone using domain name
  const zoneRecord = zoneFetchResponse.data.zones.find(
    (zone) => zone.name === domainName,
  );

  // zone not found
  if (isNull(zoneRecord) === true || isUndefined(zoneRecord) === true) {
    throw new Error(`No zone found with domain name '${domainName}'.`);
  }

  // guard is added above, can't be null
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return zoneRecord!;
};

export const fetchZoneRecords = async (
  client: AxiosInstance,
  zoneId: string,
  recordType: string,
): Promise<Array<DomainRecord>> => {
  // Either A (IPv4) or AAAA (IPv6)
  // reference: https://dns.hetzner.com/api-docs#tag/Records
  const domainRecordsResponse = await client.get<{
    records: Array<DomainRecord>;
  }>('/records', {
    params: {
      zone_id: zoneId,
    },

    // only 200
    validateStatus: (statusCode) => statusCode === 200,
  });

  // return records
  return domainRecordsResponse.data.records.filter(
    (record) => record.type === recordType,
  );
};

export const deleteDomainRecord = async (
  client: AxiosInstance,
  domainName: string,
  subdomain: string,
  recordType: string,
): Promise<void> => {
  // fetch zone
  const zone = await fetchZoneOrFail(client, domainName);

  // list records
  const domainRecords = await fetchZoneRecords(client, zone.id, recordType);

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
  await client.delete(`/records/${currentDomainRecord!.id}`, {
    validateStatus: (statusCode) => statusCode === 200,
  });
};
