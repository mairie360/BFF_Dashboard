import { check, sleep } from 'k6';
import crypto from 'k6/crypto';
import encoding from 'k6/encoding';
import { createCoverage } from '/coverage.js';

// ---------------------------------------------------------------------------
// k6 load test of the BFF Dashboard.
//
// Every operation of the contract (contracts/openapi.json, mounted as /openapi.json) has one
// handler below: the shared OpenAPI coverage module (mairie360/CICD tests/k6/coverage.js, see
// performance_test.sh) aborts at init when an operation has no handler, and fails the
// `operations_uncovered` threshold when a handler ends without sending its request. Adding a route
// to the BFF therefore means adding its handler here.
//
// The BFF only exposes reads (/health, /check_apis and the /dashboard/bootstrap aggregation, which
// fans out to BFF User, BFF Project and BFF Calendar), so a single `reads` scenario (ramp to 20
// VUs) runs every handler through `coverage.run()` and carries the gate. Every operation gets a
// p(95) threshold, whose budget depends on its family (`budgetOf`).
// ---------------------------------------------------------------------------

// Must match the JWT_SECRET of the services of the test stack.
const JWT_SECRET = __ENV.JWT_SECRET || 'b"secret"';
// User seeded by init-test.sql (sub claim of the token).
const USER_ID = __ENV.PERF_USER_ID || '2';

function b64url(value) {
  return encoding.b64encode(value, 'rawurl');
}

// Minimal HS256 JWT accepted by Core API (sub + role + exp claims).
function mintJwt() {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(JSON.stringify({ sub: USER_ID, role: 'user', exp: now + 3600 }));
  const signingInput = `${header}.${payload}`;
  const signature = crypto.hmac('sha256', JWT_SECRET, signingInput, 'base64rawurl');
  return `${signingInput}.${signature}`;
}

const coverage = createCoverage({
  // --- Connectivity (public) ---
  'GET /health': ({ request }) =>
    check(request(), { 'health 200': (r) => r.status === 200 }),
  'GET /check_apis': ({ request }) =>
    check(request(), { 'check_apis 200': (r) => r.status === 200 }),

  // --- Dashboard ---
  'GET /dashboard/bootstrap': ({ request }) =>
    check(request(), {
      'bootstrap 200': (r) => r.status === 200,
      'bootstrap payload': (r) => {
        try {
          const body = r.json();
          return body && Array.isArray(body.projects) && body.sources !== undefined;
        } catch (_error) {
          return false;
        }
      },
    }),
});

// p(95) budget of an operation, per family.
function budgetOf({ op }) {
  if (op === 'GET /health') return 50; // process probe
  if (op === 'GET /check_apis') return 200; // -> the three upstream BFFs
  return 1000; // aggregation: BFF + 3 upstream BFFs + project details
}

const perOperationThresholds = {};
for (const operation of coverage.operations) {
  perOperationThresholds[`http_req_duration{op:${operation.op}}`] = [`p(95)<${budgetOf(operation)}`];
}

export const options = {
  scenarios: {
    reads: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 20 }, // ramp-up
        { duration: '1m', target: 20 }, // steady load
        { duration: '10s', target: 0 }, // ramp-down
      ],
    },
  },
  thresholds: {
    ...coverage.thresholds,
    ...perOperationThresholds,
    http_req_failed: ['rate<0.01'], // < 1% errors
    checks: ['rate>0.99'],
  },
};

export function setup() {
  return { token: mintJwt() };
}

export default function (data) {
  coverage.run({ headers: { Authorization: `Bearer ${data.token}` } });
  sleep(1);
}
