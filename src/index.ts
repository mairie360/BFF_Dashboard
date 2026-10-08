// First line: load .env before any module reads the environment.
import 'dotenv/config';
// Before the app: OpenTelemetry must hook Express before it is loaded (MAIR-504).
import './telemetry';
import type { Server } from 'node:http';
import { assertConfigured } from '@mairie360/bffs-lib';
import app from './app';

/** Every upstream this BFF calls, configured by `<SERVICE>_URL` (+ optional `<SERVICE>_PORT`). */
export const UPSTREAM_SERVICES = ['USER_BFF', 'PROJECT_BFF', 'CALENDAR_BFF'] as const;

/** Fails fast (throws, naming every missing or invalid `<SERVICE>_URL`) before listening. */
export function start(port = Number(process.env.PORT ?? 4007)): Server {
  assertConfigured(UPSTREAM_SERVICES);
  return app.listen(port, () => console.log(`Server listening on port ${port}`));
}

if (require.main === module) {
  start();
}
