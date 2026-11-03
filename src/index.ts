// First line: load .env before any module reads the environment.
import 'dotenv/config';
// Before the app: OpenTelemetry must hook Express before it is loaded (MAIR-504).
import './telemetry';
import type { Server } from 'node:http';
import { assertConfigured, sessionKeysFromEnv } from '@mairie360/bffs-lib';
import app from './app';
import { logger } from './logger';

/** Every upstream this BFF calls, configured by `<SERVICE>_URL` (+ optional `<SERVICE>_PORT`). */
export const UPSTREAM_SERVICES = ['CORE_API', 'PROJECT_API', 'CALENDAR_API'] as const;

/**
 * Startup check: throws, naming every missing or invalid `<SERVICE>_URL`, or when no session key is configured. The
 * session tokens are verified with Core's public key `JWT_PUBLIC_KEY` (MAIR-680, bffs-lib requireSession);
 * `JWT_SECRET` alone is still accepted during the transition (HS256 tokens).
 */
export function assertStartupConfiguration(): void {
  assertConfigured(UPSTREAM_SERVICES);
  let keys: ReturnType<typeof sessionKeysFromEnv>;
  try {
    keys = sessionKeysFromEnv();
  } catch {
    // The parsing detail is not needed to fix it, and the key is not logged.
    throw new Error('Invalid configuration: JWT_PUBLIC_KEY must hold Ed25519 PUBLIC KEY PEM blocks');
  }
  if (keys === undefined) {
    throw new Error('Missing configuration: JWT_PUBLIC_KEY (or JWT_SECRET during the HS256 transition)');
  }
}

/** Fails fast (assertStartupConfiguration) before listening. */
export function start(port = Number(process.env.PORT ?? 4007)): Server {
  assertStartupConfiguration();
  return app.listen(port, () => logger.info('server listening', { port }));
}

if (require.main === module) {
  start();
}
