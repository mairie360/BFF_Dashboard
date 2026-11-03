import http from 'k6/http';
import { check, sleep } from 'k6';
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
// reads Core API, Project API and Calendar API in one parallel wave, MAIR-525). Two scenarios:
// - `reads`: `coverage.run()` calls every handler once per iteration as a random seeded agent, so it
//   carries the coverage gate;
// - `bootstrap_rush`: `GET /dashboard/bootstrap` at a fixed arrival rate, failing on any dropped
//   iteration.
// Every operation gets a p(95) threshold, whose budget depends on its family (`budgetOf`).
//
// MAIR-474: the stack also runs init-perf-project.sql and init-perf-calendar.sql (the volume seeds of
// Project_API and Calendar_API), every dashboard read checks that it got the agent's own name and
// projects with every source available, and the thresholds are strict (every check passes, no failed
// request, no dropped iteration). K6_PROFILE sizes the load: `ci` (default) is what the 4 vCPU CI
// runner holds, `stress` is the high load, run by hand.
// ---------------------------------------------------------------------------

// EdDSA tokens signed by performance_test.sh with this run's key, like Core signs them (MAIR-474,
// MAIR-680): k6 cannot sign Ed25519 and nothing is signed with a committed key. The file maps every
// seeded agent's id to its token (role `user`).
const TOKENS = JSON.parse(open(__ENV.JWT_TOKENS_FILE || '/tokens.json'));

// Rows of init-perf-project.sql: agents 100001..102000 (`User`, first name `Agent`); project 1000 + p
// (p = 0..4999) is owned by agent 100001 + p % 2000 and has the next 5 agents as members, so every
// agent sees at least 2 projects of its own (and up to 6 are read by the dashboard).
const AGENTS = { first: 100001, count: 2000 };
const MIN_PROJECTS = 2;

const PROFILES = {
  ci: { readVus: 20, rushRate: 10 },
  stress: { readVus: 60, rushRate: 30 },
};
const PROFILE = PROFILES[__ENV.K6_PROFILE || 'ci'];
if (!PROFILE) throw new Error(`Unknown K6_PROFILE ${__ENV.K6_PROFILE}: ${Object.keys(PROFILES).join(', ')}`);

// Token of seeded caller `id`, signed by performance_test.sh (fails the run on an unknown id).
function jwtOf(id) {
  const token = TOKENS[String(id)];
  if (!token) throw new Error(`no token signed for user ${id}: see performance_test.sh`);
  return token;
}

const agentHeaders = {};
/** `Authorization` header of a random seeded agent (tokens minted once per VU and agent). */
function randomAgent() {
  const id = AGENTS.first + Math.floor(Math.random() * AGENTS.count);
  if (!agentHeaders[id]) agentHeaders[id] = { Authorization: `Bearer ${jwtOf(id)}` };
  return agentHeaders[id];
}

function json(response) {
  try {
    return response.json();
  } catch (_) {
    return null;
  }
}

// The dashboard of a seeded agent: its own first name, its projects, every source available.
function isAgentDashboard(response) {
  const body = json(response);
  return response.status === 200
    && body !== null
    && body.userFirstName === 'Agent'
    && Array.isArray(body.projects)
    && body.projects.length >= MIN_PROJECTS
    && body.metrics.totalProjects >= MIN_PROJECTS
    && body.sources.projects === 'available'
    && body.sources.tasks === 'available'
    && body.sources.calendar === 'available';
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
      'bootstrap is the agent dashboard': isAgentDashboard,
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
      exec: 'reads',
      stages: [
        { duration: '30s', target: Math.ceil(PROFILE.readVus / 2) }, // ramp-up
        { duration: '30s', target: PROFILE.readVus },
        { duration: '2m', target: PROFILE.readVus }, // steady load
        { duration: '20s', target: 0 }, // ramp-down
      ],
    },
    // The page every agent opens first, at a fixed arrival rate (MAIR-474): fails if k6 has to drop
    // iterations because the BFF (and the BFFs behind it) no longer keeps up.
    bootstrap_rush: {
      executor: 'constant-arrival-rate',
      exec: 'bootstrapRush',
      startTime: '1m', // once the reads are at their peak
      rate: PROFILE.rushRate,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 30,
      maxVUs: 200,
    },
  },
  thresholds: {
    ...coverage.thresholds,
    ...perOperationThresholds,
    'http_req_duration{op:bootstrap_rush}': ['p(95)<1000'],
    dropped_iterations: ['count==0'], // the rush kept its rate
    // Strict (MAIR-474): one wrong status, one missing seeded row or one failed request fails the run.
    http_req_failed: ['rate==0'],
    checks: ['rate==1'],
  },
};

export function reads() {
  coverage.run({ headers: randomAgent() });
  sleep(1);
}

export function bootstrapRush() {
  check(http.get(coverage.url('GET /dashboard/bootstrap'), { headers: randomAgent(), tags: { op: 'bootstrap_rush' } }), {
    'rush bootstrap is the agent dashboard': isAgentDashboard,
  });
}
