import { IpAddressFamily } from '../shared/ip_address_family';

export type IpAddressRetrieverFunction = (
  ipAddressFamily: IpAddressFamily,
) => Promise<string>;
