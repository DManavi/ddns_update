import { IpAddressFamily } from './ip_address_family';

export type DnsUpdaterFunctionOptions<T> = {
  /**
   * Create DNS record if doesn't exist
   * @default false
   */
  createIfNotExists?: boolean;

  /**
   * DNS record TTL
   * @default 300 (seconds)
   */
  ttl?: number;

  /**
   * Provider-specific options
   */
  provider: T;
};

export type DnsUpdaterFunction<T> = (
  domainName: string,
  subDomain: string,
  ipAddressFamily: IpAddressFamily,
  ipAddress: string,
  options: DnsUpdaterFunctionOptions<T>,
) => Promise<void>;
