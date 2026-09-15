import http from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import app from '../src/app';

// Comportements transverses de l'application : 404 JSON, erreurs du body-parser et /check_apis.

describe('application fallbacks', () => {
  test('an unknown route answers a JSON 404', async () => {
    const response = await request(app).get('/inconnue');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toEqual({ error: { message: 'Not found' } });
  });

  test('a malformed JSON body answers a JSON 400 without internal details', async () => {
    const response = await request(app).post('/dashboard/bootstrap').set('Content-Type', 'application/json').send('{"broken":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: { message: 'Invalid request' } });
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
  const saved = { core: process.env.CORE_API_URL, project: process.env.PROJECT_API_URL };

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
  afterEach(() => {
    for (const [key, value] of [['CORE_API_URL', saved.core], ['PROJECT_API_URL', saved.project]] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  test('answers 200 when every service health check succeeds', async () => {
    process.env.CORE_API_URL = healthyUrl;
    process.env.PROJECT_API_URL = healthyUrl;

    const response = await request(app).get('/check_apis');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'OK', core_api: 'Connected', project_api: 'Connected' });
  });

  test('answers 502 when a service is not configured or not healthy', async () => {
    process.env.CORE_API_URL = `${healthyUrl}/down`;
    delete process.env.PROJECT_API_URL;

    const response = await request(app).get('/check_apis');

    expect(response.status).toBe(502);
    expect(response.body).toEqual({ status: 'Error', core_api: 'Unreachable', project_api: 'Unreachable' });
  });
});
