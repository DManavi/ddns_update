import { get as env } from 'env-var';

import { IpAddressFamily } from '../../../shared/ip_address_family';
import { createHttpClient, deleteDomainRecord, SERVER_URL } from './helpers';
import * as mdl from './index';

describe('ddns_update | lib | dns_updater | digital_ocean', () => {
  // ENV variables
  const API_KEY = env('TEST_DO_API_KEY').required().asString();
  const DOMAIN_NAME = env('TEST_DO_DOMAIN_NAME').required().asString();

  it('updateDnsRecord must be a function', () => {
    expect(mdl).toHaveProperty('updateDnsRecord');
    expect(typeof mdl.updateDnsRecord).toBe('function');
  });

  it('updateDnsRecord should throw error on invalid API key', async () => {
    expect(() =>
      mdl.updateDnsRecord(
        'not-existed-domain.com',
        'doesnt-matter',
        IpAddressFamily.v4,
        '0.0.0.0',
        {
          createIfNotExists: false,
          provider: {
            apiKey: 'INVALID-API-KEY',
          },
        },
      ),
    ).rejects.toThrow('Request failed with status code 401');
  });

  it('updateDnsRecord on non-existed domain (TLD)', async () => {
    expect(() =>
      mdl.updateDnsRecord(
        'not-existed-domain.com',
        'doesnt-matter',
        IpAddressFamily.v4,
        '0.0.0.0',
        {
          createIfNotExists: false,
          provider: {
            apiKey: API_KEY,
          },
        },
      ),
    ).rejects.toThrow('Request failed with status code 404');
  });

  it('updateDnsRecord on non-existed sub-domain (createIfNotExists=false)', async () => {
    expect(() =>
      mdl.updateDnsRecord(
        DOMAIN_NAME,
        'doesnt-matter',
        IpAddressFamily.v4,
        '0.0.0.0',
        {
          createIfNotExists: false,
          provider: {
            apiKey: API_KEY,
          },
        },
      ),
    ).rejects.toThrow(
      `Record 'doesnt-matter' was not found on '${DOMAIN_NAME}'.`,
    );
  });

  it('updateDnsRecord (v4) on non-existed sub-domain (createIfNotExists=true)', async () => {
    await mdl.updateDnsRecord(
      DOMAIN_NAME,
      'ddns-update-test-subdomain',
      IpAddressFamily.v4,
      '127.0.0.1',
      {
        createIfNotExists: true,
        provider: {
          apiKey: API_KEY,
        },
      },
    );
  });

  it('updateDnsRecord (v6) on non-existed sub-domain (createIfNotExists=true)', async () => {
    await mdl.updateDnsRecord(
      DOMAIN_NAME,
      'ddns-update-test-subdomain',
      IpAddressFamily.v6,
      '::1',
      {
        createIfNotExists: true,
        provider: {
          apiKey: API_KEY,
        },
      },
    );
  });

  it('updateDnsRecord (v4) on existed sub-domain (createIfNotExists=false)', async () => {
    await mdl.updateDnsRecord(
      DOMAIN_NAME,
      'ddns-update-test-subdomain',
      IpAddressFamily.v4,
      '1.1.1.1',
      {
        createIfNotExists: false,
        provider: {
          apiKey: API_KEY,
        },
      },
    );
  });

  it('updateDnsRecord (v6) on existed sub-domain (createIfNotExists=false)', async () => {
    await mdl.updateDnsRecord(
      DOMAIN_NAME,
      'ddns-update-test-subdomain',
      IpAddressFamily.v6,
      '::2',
      {
        createIfNotExists: false,
        provider: {
          apiKey: API_KEY,
        },
      },
    );
  });

  afterAll(async () => {
    const client = createHttpClient(SERVER_URL, API_KEY);

    await deleteDomainRecord(
      client,
      DOMAIN_NAME,
      'ddns-update-test-subdomain',
      'A',
    );
    await deleteDomainRecord(
      client,
      DOMAIN_NAME,
      'ddns-update-test-subdomain',
      'AAAA',
    );
  });
});
