import { isNull, isUndefined, cloneDeep } from 'lodash';

import {
  DnsUpdaterFunction,
  DnsUpdaterFunctionOptions,
} from '../../../shared/dns_updater_function';
import {
  createHttpClient,
  fetchZoneRecords,
  fetchZoneOrFail,
  getRecordTypeFilterValue,
  SERVER_URL,
} from './helpers';

export type HetznerDnsUpdaterFunctionOptions = {
  apiKey: string;
};

const defaultOptions: DnsUpdaterFunctionOptions<HetznerDnsUpdaterFunctionOptions> =
  Object.freeze({
    createIfNotExists: false,
    ttl: 5 * 60, // 300 seconds

    provider: undefined,
  } as DnsUpdaterFunctionOptions<any>);

export const updateDnsRecord: DnsUpdaterFunction<
  HetznerDnsUpdaterFunctionOptions
> = async (
  domainName,
  subDomain,
  ipAddressFamily,
  ipAddress,
  options,
): Promise<void> => {
  // merge user options with default options
  const opts = Object.freeze({
    ...cloneDeep(defaultOptions),
    ...cloneDeep(options),
  });

  // create HTTP client
  const client = createHttpClient(SERVER_URL, opts.provider.apiKey);

  // fetch zone
  const zone = await fetchZoneOrFail(client, domainName);

  const domainRecordListTypeFilterValue =
    getRecordTypeFilterValue(ipAddressFamily);

  const domainRecords = await fetchZoneRecords(
    client,
    zone.id,
    domainRecordListTypeFilterValue,
  );

  // find record among other records matching by 'name' and 'type'
  const currentDomainRecord = domainRecords.find(
    (record) =>
      record.name === subDomain &&
      record.type === domainRecordListTypeFilterValue,
  );
  const doesRecordExist =
    isNull(currentDomainRecord) === false &&
    isUndefined(currentDomainRecord) === false;

  // record existence = false && record creation = false
  if (doesRecordExist === false && opts.createIfNotExists === false) {
    throw new Error(`Record '${subDomain}' was not found on '${domainName}'.`);
  }

  // base URL parts
  const upsertUrlParts = ['records'];

  // in update/patch, add record ID (subdomain ID in digital ocean) to the url parts
  if (doesRecordExist === true) {
    upsertUrlParts.push(currentDomainRecord!.id);
  }

  // create/update request payload
  const requestPayload = Object.freeze({
    zone_id: zone.id,
    type: domainRecordListTypeFilterValue,
    name: subDomain,
    value: ipAddress,
    ttl: opts.ttl!,
  });

  // perform the request
  await client(`/${upsertUrlParts.join('/')}`, {
    method: doesRecordExist ? 'PUT' : 'POST',
    data: { ...requestPayload },

    // either created/updated
    validateStatus: (statusCode) => statusCode === 200,
  });
};
