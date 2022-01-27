import { scheduleJob } from 'node-schedule';
import validator from 'validator';
import { IpAddressRetrieverFunction } from 'ddns-update/dist/shared/ip_retriever_function';
import { DnsUpdaterFunction } from 'ddns-update/dist/shared/dns_updater_function';
import * as ipRetrievers from 'ddns-update/dist/lib/ip_retriever';
import * as dnsUpdaters from 'ddns-update/dist/lib/dns_updater';

import {
  Config,
  config,
  DnsUpdaterProviders,
  IpRetrieveProviders,
} from './config';
import { IpAddressFamily } from 'ddns-update/dist/shared/ip_address_family';

const getCurrentDateTime = () => new Date().toISOString();

console.info(
  [`[${getCurrentDateTime()}]`, 'Initializing DDNS updater...'].join(' '),
);
console.info(
  'Configuration:\n',
  [
    '-=-=-=-=-=-=-=-=-=-=-',
    `Schedule:\t${config.cronSchedule}`,
    '',
    `Domain:\t\t${config.domainName}`,
    `Subdomain:\t${config.subdomain}`,
    '',
    `DNS Provider:\t${config.dnsUpdater}`,
    `TTL:\t\t${config.ttl}`,
    `Create:\t\t${config.createIfNotExist}`,
    '',
    `IP retriever:\t${config.ipRetriever}`,
    '-=-=-=-=-=-=-=-=-=-=-',
  ].join('\n'),
);

const ipRetriever: IpAddressRetrieverFunction = ((config: Config) => {
  switch (config.ipRetriever) {
    case IpRetrieveProviders.Ipify: {
      return ipRetrievers.ipify.retrieveIpAddress;
    }

    default:
      throw new Error(
        `No implementation found for IP retriever '${config.ipRetriever}'.`,
      );
  }
})(config);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dnsUpdater: DnsUpdaterFunction<any> = ((config: Config) => {
  switch (config.dnsUpdater) {
    case DnsUpdaterProviders.DigitalOcean: {
      return dnsUpdaters.digitalOcean.updateDnsRecord;
    }

    case DnsUpdaterProviders.Hetzner: {
      return dnsUpdaters.hetzner.updateDnsRecord;
    }

    default:
      throw new Error(
        `No implementation found for DNS updater '${config.dnsUpdater}'.`,
      );
  }
})(config);

let cachedIpAddress: string | undefined = undefined;

const jobHandler = ((config: Config) => async () => {
  console.info(
    [`[${getCurrentDateTime()}]`, 'Job handler triggered.'].join(' '),
  );

  const ipAddress = await ipRetriever();
  const ipAddressFamily = validator.isIP(ipAddress, '4')
    ? IpAddressFamily.v4
    : validator.isIP(ipAddress, '6')
    ? IpAddressFamily.v6
    : undefined;

  console.info(
    [
      `[${getCurrentDateTime()}]`,
      `IP address: ${ipAddress} (v${ipAddressFamily})`,
    ].join(' '),
  );

  if (ipAddressFamily === undefined) {
    throw new Error(`IP address family of '${ipAddress}' cannot be detected.`);
  }

  const needsUpdate = cachedIpAddress !== ipAddress;

  console.info(
    [`[${getCurrentDateTime()}]`, `Needs Update: ${needsUpdate}`].join(' '),
  );

  // update is required?
  if (needsUpdate === true) {
    console.info([`[${getCurrentDateTime()}]`, 'Updating...'].join(' '));
    cachedIpAddress = ipAddress;
    await dnsUpdater(
      config.domainName,
      config.subdomain,
      ipAddressFamily,
      ipAddress,
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        provider: config.dnsUpdaterConfig as any,
        createIfNotExists: config.createIfNotExist,
        ttl: config.ttl,
      },
    );
    console.info([`[${getCurrentDateTime()}]`, 'Updated.'].join(' '));
  }

  console.info(
    [`[${getCurrentDateTime()}]`, 'Job is finished.', '\n'].join(' '),
  );
})(config);

scheduleJob(config.cronSchedule, jobHandler);
