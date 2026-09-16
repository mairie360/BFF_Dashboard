import axios from 'axios';
import request from 'supertest';
import { readFileSync } from 'node:fs';
import app from '../src/app';

// Les appels amont passent par les clients générés : l'agrégation est vérifiée contre de vrais serveurs
// HTTP pilotés par les contrats (dashboard.upstream-mocks.test.ts).
const requestSpy = jest.spyOn(axios.Axios.prototype, 'request');
beforeEach(() => { requestSpy.mockClear(); });
afterAll(() => { requestSpy.mockRestore(); });

test('runtime and exported routes/data have the same OpenAPI document', async () => {
  const expected = JSON.parse(readFileSync('contracts/openapi.json', 'utf8'));
  for (const path of ['/openapi.json', '/swagger.json']) {
    const result = await request(app).get(path);
    expect(result.status).toBe(200);
    expect(result.body).toEqual(expected);
  }
});

test('bootstrap rejects a missing session before contacting upstream services', async () => {
  const result = await request(app).get('/dashboard/bootstrap');

  expect(result.status).toBe(401);
  expect(requestSpy).not.toHaveBeenCalled();
});
