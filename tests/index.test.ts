import type { AddressInfo } from 'node:net';
import { UPSTREAM_SERVICES, start } from '../src/index';

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
    expect(UPSTREAM_SERVICES).toEqual(['USER_BFF', 'PROJECT_BFF', 'CALENDAR_BFF']);
  });

  test('throws before listening, naming every missing or invalid upstream URL', () => {
    for (const name of names) delete process.env[name];
    process.env.PROJECT_BFF_URL = 'http://bff-project:4001';
    process.env.CALENDAR_BFF_URL = 'http://bad host';

    expect(() => start(0)).toThrow('Missing or invalid upstream configuration: USER_BFF_URL, CALENDAR_BFF_URL');
  });

  test('listens once every upstream is configured', async () => {
    for (const service of UPSTREAM_SERVICES) process.env[`${service}_URL`] = `${service.toLowerCase()}.internal`;
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const server = start(0);
    try {
      await new Promise<void>((resolve) => server.once('listening', resolve));
      expect((server.address() as AddressInfo).port).toBeGreaterThan(0);
    } finally {
      await new Promise((resolve) => server.close(resolve));
      logSpy.mockRestore();
    }
  });
});
