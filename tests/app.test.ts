import http from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import path from 'node:path';
import app from '../src/app';
import { OpenApiContract } from './support/openapi-contract';

// Application-wide behaviour: JSON 404, body-parser errors, trust proxy and /check_apis.

describe('application fallbacks', () => {
  test('an unknown route answers a JSON 404', async () => {
    const response = await request(app).get('/inconnue');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found', details: [] } });
  });

  test('a malformed JSON body answers a JSON 400 without internal details', async () => {
    const response = await request(app).post('/dashboard/bootstrap').set('Content-Type', 'application/json').send('{"broken":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: { code: 'BAD_REQUEST', message: 'Invalid request', details: [] } });
  });

  test('no raw multipart body parser buffers uploads in memory', () => {
    const { router } = app as typeof app & { router: { stack: Array<{ name: string }> } };

    expect(router.stack.map((layer) => layer.name)).not.toContain('rawParser');
    expect(router.stack.map((layer) => layer.name)).toContain('jsonParser');
  });

  test('trusts no proxy by default (TRUST_PROXY unset)', () => {
    expect(app.get('trust proxy')).toBe(false);
  });

  test('reads TRUST_PROXY when the app is loaded', () => {
    const saved = process.env.TRUST_PROXY;
    process.env.TRUST_PROXY = '1';
    try {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { app: isolated } = require('../src/app') as typeof import('../src/app');
        expect(isolated.get('trust proxy')).toBe(1);
      });
    } finally {
      if (saved === undefined) delete process.env.TRUST_PROXY;
      else process.env.TRUST_PROXY = saved;
    }
  });

  test('API answers carry the strict API-only headers and no X-Powered-By', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['content-security-policy']).toBe("default-src 'none'");
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['cross-origin-resource-policy']).toBe('same-origin');
    expect(response.headers['permissions-policy']).toBe('geolocation=(), camera=(), microphone=()');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  test('the interactive documentation keeps the helmet CSP it needs', async () => {
    const response = await request(app).get('/docs/');

    expect(response.status).toBe(200);
    expect(response.headers['content-security-policy']).not.toBe("default-src 'none'");
    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
  });

  test('serves the OpenAPI document', async () => {
    const response = await request(app).get('/openapi.json');

    expect(response.status).toBe(200);
    expect(response.body.paths).toHaveProperty('/dashboard/bootstrap');
  });
});

describe('GET /check_apis', () => {
  let healthy: http.Server;
  let healthyUrl: string;
  const services = ['USER_BFF_URL', 'PROJECT_BFF_URL', 'CALENDAR_BFF_URL'] as const;
  const saved = Object.fromEntries(services.map((name) => [name, process.env[name]]));

  beforeAll(async () => {
    healthy = http.createServer((req, res) => {
      res.writeHead(req.url === '/health' ? 200 : 404, { 'Content-Type': 'application/json' }).end('{"status":"ok"}');
    });
    await new Promise<void>((resolve) => healthy.listen(0, '127.0.0.1', resolve));
    healthyUrl = `http://127.0.0.1:${(healthy.address() as AddressInfo).port}`;
  });
  afterAll(async () => {
    await new Promise((resolve) => healthy.close(resolve));
  });
  const contract = OpenApiContract.load(path.join(__dirname, '..', 'contracts', 'openapi.json'));
  const expectCheckApisContract = (response: request.Response) => {
    const { documented, schema } = contract.responseSchema(contract.match('get', '/check_apis')!, response.status);
    expect(documented).toBe(true);
    expect(schema).toBeDefined();
    expect(contract.validate(schema!, response.body)).toEqual([]);
  };
  let warnSpy: jest.SpyInstance;
  beforeEach(() => { warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined); });
  afterEach(() => {
    warnSpy.mockRestore();
    for (const name of services) {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    }
  });

  test('answers 200 when every service health check succeeds', async () => {
    for (const name of services) process.env[name] = healthyUrl;

    const response = await request(app).get('/check_apis');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'OK', user_bff: 'Connected', project_bff: 'Connected', calendar_bff: 'Connected',
    });
    expectCheckApisContract(response);
  });

  test('answers 502 when a service is not configured or not healthy', async () => {
    process.env.USER_BFF_URL = healthyUrl;
    process.env.PROJECT_BFF_URL = `${healthyUrl}/down`;
    delete process.env.CALENDAR_BFF_URL;

    const response = await request(app).get('/check_apis');

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      status: 'Error', user_bff: 'Connected', project_bff: 'Unreachable', calendar_bff: 'Unreachable',
    });
    expectCheckApisContract(response);
    expect(warnSpy.mock.calls.map(([message]) => String(message))).toEqual([
      expect.stringContaining('project_bff unreachable'),
      expect.stringContaining('calendar_bff unreachable: The CALENDAR_BFF service is not configured.'),
    ]);
  });

  test('never falls back to localhost: an unconfigured service is unreachable without any call', async () => {
    let calls = 0;
    healthy.on('request', () => { calls += 1; });
    for (const name of services) delete process.env[name];

    const response = await request(app).get('/check_apis');

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      status: 'Error', user_bff: 'Unreachable', project_bff: 'Unreachable', calendar_bff: 'Unreachable',
    });
    expect(calls).toBe(0);
  });
});
