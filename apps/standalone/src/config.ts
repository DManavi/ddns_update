import { get as env } from 'env-var';
import { DigitalOceanDnsUpdaterFunctionOptions } from 'ddns-update/dist/lib/dns_updater/digital_ocean';
import { HetznerDnsUpdaterFunctionOptions } from 'ddns-update/dist/lib/dns_updater/hetzner';

export enum IpRetrieveProviders {
  Ipify = 'ipify',
}

export enum DnsUpdaterProviders {
  DigitalOcean = 'digital-ocean',
  Hetzner = 'hetzner',
}

export type Config = {
  /**
   * cron schedule
   * @default *\/5 * * * * (every 5th minute)
   */
  cronSchedule: string;

  ipRetriever: IpRetrieveProviders;

  dnsUpdater: DnsUpdaterProviders;
  dnsUpdaterConfig:
    | DigitalOceanDnsUpdaterFunctionOptions
    | HetznerDnsUpdaterFunctionOptions;

  domainName: string;
  subdomain: string;

  createIfNotExist: boolean;
  ttl: number;
};

const ipRetriever = env('IP_RETRIEVER')
  .default(IpRetrieveProviders.Ipify)
  .asEnum<IpRetrieveProviders>(Object.values(IpRetrieveProviders));

const dnsUpdater = env('DNS_UPDATER')
  .required()
  .asEnum<DnsUpdaterProviders>(Object.values(DnsUpdaterProviders));

const dnsUpdaterConfig = ((dnsUpdaterName: DnsUpdaterProviders) => {
  switch (dnsUpdaterName) {
    case DnsUpdaterProviders.DigitalOcean: {
      return {
        apiKey: env('DIGITAL_OCEAN_API_KEY').required().asString(),
      } as DigitalOceanDnsUpdaterFunctionOptions;
    }

    case DnsUpdaterProviders.Hetzner: {
      return {
        apiKey: env('HETZNER_API_KEY').required().asString(),
      } as HetznerDnsUpdaterFunctionOptions;
    }

    default: {
      throw new Error(`DNS updater '${dnsUpdaterName}' is not supported.`);
    }
  }
})(dnsUpdater);

export const config: Config = Object.freeze({
  // every 5th minutes
  cronSchedule: env('CRON_SCHEDULE').default('*/5 * * * *').asString(),

  ipRetriever,
  dnsUpdater,

  dnsUpdaterConfig,

  domainName: env('DOMAIN_NAME').required().asString(),
  subdomain: env('SUBDOMAIN').required().asString(),

  createIfNotExist: env('CREATE_IF_NOT_EXIST').default('true').asBool(),
  ttl: env('TTL').default('300').asIntPositive(), // 300 seconds
} as Config);
