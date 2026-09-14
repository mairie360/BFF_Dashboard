import 'dotenv/config';
import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry } from './openapi-registry';
import './routes/health';
import './routes/check_apis';
import './routes/dashboard';

// Runtime documentation and exported clients use the same mounted routes.
export const openApiDocument = new OpenApiGeneratorV31(registry.definitions).generateDocument({
  openapi: '3.1.0',
  // Snake_case like the Rust APIs: orval derives endpoints/bffDashboard.ts + getBffDashboard() from it.
  info: { title: 'bff_dashboard', version: '1.0.0' },
});
