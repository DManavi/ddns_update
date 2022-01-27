import { IpAddressFamily } from '../../../shared/ip_address_family';
import * as mdl from './index';
import validator from 'validator';

describe('ddns_update | lib | ip_retriever | ipify_org', () => {
  it('retrieveIpAddress must be a function', () => {
    expect(mdl).toHaveProperty('retrieveIpAddress');
    expect(typeof mdl.retrieveIpAddress).toBe('function');
  });

  it('retrieveIpAddress must return current system public IP address', async () => {
    const ipAddress = await mdl.retrieveIpAddress(IpAddressFamily.v4);

    expect(ipAddress).not.toBeUndefined();
    expect(typeof ipAddress).toBe('string');
    expect(validator.isIP(ipAddress)).toBeTruthy();
  });
});
