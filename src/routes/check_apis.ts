import { checkApis, checkApisResponseSchema, withoutSession } from '@mairie360/bffs-lib';
import { Router } from 'express';
import { registry } from '../openapi-registry';
import { calendarBff, projectBff, userBff } from '../clients/upstreams';

const router = Router();

// clone(): the lib builds the schema before extendZodWithOpenApi() ran on its zod instance (see openapi-registry.ts).
export const CheckApisResponseSchema = registry.register(
  'CheckApisResponse',
  checkApisResponseSchema(['user_bff', 'project_bff', 'calendar_bff']).clone(),
);
const checkApisContent = { 'application/json': { schema: CheckApisResponseSchema } };
registry.registerPath({
  method: 'get',
  path: '/check_apis',
  security: [],
  tags: ['Connectivity'],
  summary: 'Checks that the three upstream BFFs are reachable',
  responses: {
    200: { description: 'Every upstream BFF answered its /health operation', content: checkApisContent },
    502: { description: 'At least one upstream BFF is unreachable or not configured', content: checkApisContent },
  },
});

// The three BFFs the dashboard depends on, probed through the /health operation of their contract with
// the same <SERVICE>_URL variables as the real calls.
router.get('/', checkApis({
  user_bff: () => userBff.getHealth(withoutSession('USER_BFF', 5_000)),
  project_bff: () => projectBff.getHealth(withoutSession('PROJECT_BFF', 5_000)),
  calendar_bff: () => calendarBff.getHealth(withoutSession('CALENDAR_BFF', 5_000)),
}));
export default router;
