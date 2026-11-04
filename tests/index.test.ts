import type { AddressInfo } from 'node:net';
import { UPSTREAM_SERVICES, start } from '../src/index';
import { captureLogs } from './support/logs';

// Entry point: the BFF refuses to start when an upstream is not configured (no localhost default).
describe('start()', () => {
  const names = UPSTREAM_SERVICES.flatMap((service) => [`${service}_URL`, `${service}_PORT`]);
  const saved = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  afterEach(() => {
    for (const name of names) {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    }
  });

  test('checks every upstream the BFF calls', () => {
    // MAIR-525: the APIs, never another BFF.
    expect(UPSTREAM_SERVICES).toEqual(['CORE_API', 'PROJECT_API', 'CALENDAR_API']);
  });

  test('throws before listening, naming every missing or invalid upstream URL', () => {
    for (const name of names) delete process.env[name];
    process.env.PROJECT_API_URL = 'http://project-api:3001';
    process.env.CALENDAR_API_URL = 'http://bad host';

    expect(() => start(0)).toThrow('Missing or invalid upstream configuration: CORE_API_URL, CALENDAR_API_URL');
  });

  test('MAIR-680 throws before listening without JWT_PUBLIC_KEY (nor JWT_SECRET), which verifies the sessions', () => {
    for (const service of UPSTREAM_SERVICES) process.env[`${service}_URL`] = `${service.toLowerCase()}.internal`;
    const key = process.env.JWT_PUBLIC_KEY;
    delete process.env.JWT_PUBLIC_KEY;
    delete process.env.JWT_SECRET;
    try {
      expect(() => start(0)).toThrow('Missing configuration: JWT_PUBLIC_KEY');
    } finally {
      process.env.JWT_PUBLIC_KEY = key;
    }
  });

  test('listens once every upstream is configured', async () => {
    for (const service of UPSTREAM_SERVICES) process.env[`${service}_URL`] = `${service.toLowerCase()}.internal`;
    const logs = captureLogs();
    const server = start(0);
    try {
      await new Promise<void>((resolve) => server.once('listening', resolve));
      expect((server.address() as AddressInfo).port).toBeGreaterThan(0);
      expect(logs).toEqual([expect.objectContaining({ level: 'INFO', target: 'bff-dashboard', message: 'server listening' })]);
    } finally {
      await new Promise((resolve) => server.close(resolve));
      jest.restoreAllMocks();
    }
  });
});
