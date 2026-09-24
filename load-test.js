import http from 'k6/http';
import { check, sleep, group } from 'k6';
import crypto from 'k6/crypto';
import encoding from 'k6/encoding';

// ---------------------------------------------------------------------------
// Test de charge k6 pour le BFF Dashboard.
// Cible les routes réellement servies par le BFF : /health et /check_apis
// (sans auth) et l'agrégation /dashboard/bootstrap (avec un JWT HS256 signé
// comme le fait Core API). /dashboard/bootstrap fane out sur les trois BFFs
// métier (User, Project, Calendar) puis sur le détail de chaque projet.
// ---------------------------------------------------------------------------

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4007';
// Must match the JWT_SECRET of the services of the test stack.
const JWT_SECRET = __ENV.JWT_SECRET || 'b"secret"';
// Utilisateur inséré par init-test.sql (claim sub du token).
const USER_ID = __ENV.PERF_USER_ID || '2';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // montée en charge
    { duration: '1m', target: 20 },  // maintien
    { duration: '10s', target: 0 },  // descente
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],                         // < 1% d'erreurs
    'http_req_duration{endpoint:health}': ['p(95)<50'],     // sonde process
    'http_req_duration{endpoint:check_apis}': ['p(95)<200'],
    'http_req_duration{endpoint:dashboard}': ['p(95)<1000'], // agrégation BFF + 3 upstreams
  },
};

function b64url(value) {
  return encoding.b64encode(value, 'rawurl');
}

// JWT HS256 minimal accepté par Core API (claims sub + role + exp).
function mintJwt() {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(JSON.stringify({ sub: USER_ID, role: 'user', exp: now + 3600 }));
  const signingInput = `${header}.${payload}`;
  const signature = crypto.hmac('sha256', JWT_SECRET, signingInput, 'base64rawurl');
  return `${signingInput}.${signature}`;
}

export function setup() {
  return { token: mintJwt() };
}

export default function (data) {
  const authParams = {
    headers: { Authorization: `Bearer ${data.token}` },
    tags: { endpoint: 'dashboard' },
  };

  group('health', () => {
    const res = http.get(`${BASE_URL}/health`, { tags: { endpoint: 'health' } });
    check(res, { 'health 200': (r) => r.status === 200 });
  });

  group('check_apis', () => {
    const res = http.get(`${BASE_URL}/check_apis`, { tags: { endpoint: 'check_apis' } });
    check(res, { 'check_apis 200': (r) => r.status === 200 });
  });

  group('dashboard bootstrap', () => {
    const res = http.get(`${BASE_URL}/dashboard/bootstrap`, authParams);
    check(res, {
      'bootstrap 200': (r) => r.status === 200,
      'bootstrap payload': (r) => {
        try {
          const body = r.json();
          return body && Array.isArray(body.projects) && body.sources !== undefined;
        } catch (_error) {
          return false;
        }
      },
    });
  });

  sleep(1);
}
