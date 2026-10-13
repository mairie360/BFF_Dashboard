// First line: load .env before any module reads the environment.
import 'dotenv/config';
import type { Server } from 'node:http';
import { assertConfigured } from '@mairie360/bffs-lib';
import app from './app';
import { logger } from './logger';

/** Every upstream this BFF calls, configured by `<SERVICE>_URL` (+ optional `<SERVICE>_PORT`). */
export const UPSTREAM_SERVICES = ['CORE_API', 'PROJECT_API', 'CALENDAR_API'] as const;

/** Fails fast (throws, naming every missing or invalid `<SERVICE>_URL`) before listening. */
export function start(port = Number(process.env.PORT ?? 4007)): Server {
  assertConfigured(UPSTREAM_SERVICES);
  // requireSession verifies the session tokens with it: without it every session would be refused.
  if (!process.env.JWT_SECRET) throw new Error('Missing configuration: JWT_SECRET');
  return app.listen(port, () => logger.info('server listening', { port }));
}

if (require.main === module) {
  start();
}
