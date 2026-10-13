import { checkApis, checkApisResponseSchema, withoutSession } from '@mairie360/bffs-lib';
import { Router } from 'express';
import { logger } from '../logger';
import { registry } from '../openapi-registry';
import { calendarApi, coreApi, projectApi } from '../clients/upstreams';

const router = Router();

// clone(): the lib builds the schema before extendZodWithOpenApi() ran on its zod instance (see openapi-registry.ts).
export const CheckApisResponseSchema = registry.register(
  'CheckApisResponse',
  checkApisResponseSchema(['core_api', 'project_api', 'calendar_api']).clone(),
);
const checkApisContent = { 'application/json': { schema: CheckApisResponseSchema } };
registry.registerPath({
  method: 'get',
  path: '/check_apis',
  security: [],
  tags: ['Connectivity'],
  summary: 'Checks that the three upstream APIs are reachable',
  responses: {
    200: { description: 'Every upstream API answered its /health operation', content: checkApisContent },
    502: { description: 'At least one upstream API is unreachable or not configured', content: checkApisContent },
  },
});

// The three APIs the dashboard depends on, probed through the /health operation of their contract with
// the same <SERVICE>_URL variables as the real calls.
router.get('/', checkApis({
  core_api: () => coreApi.health(withoutSession('CORE_API', 5_000)),
  project_api: () => projectApi.health(withoutSession('PROJECT_API', 5_000)),
  calendar_api: () => calendarApi.health(withoutSession('CALENDAR_API', 5_000)),
}, { logger }));
export default router;
