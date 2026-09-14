import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './openapi';
import healthRouter from './routes/health';
import checkApis from './routes/check_apis';
import moduleRouter from './routes/dashboard';

export const app = express();
// En-têtes de sécurité (CSP, X-Content-Type-Options, Permissions-Policy, CORP…) et
// suppression de X-Powered-By. upgrade-insecure-requests est retiré car le BFF est
// servi en HTTP derrière le reverse proxy.
app.use(helmet({ contentSecurityPolicy: { useDefaults: true, directives: { 'upgrade-insecure-requests': null } } }));
app.use(express.json());
app.use(express.raw({ type: 'multipart/form-data', limit: '20mb' }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.get(['/openapi.json', '/swagger.json'], (_req, res) => res.json(openApiDocument));
app.use('/health', healthRouter);
app.use('/check_apis', checkApis);
app.use('/dashboard', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); }, moduleRouter);
// Route inconnue : 404 JSON (le fallback Express répond en text/html).
app.use((_req: Request, res: Response) => res.status(404).json({ error: { message: 'Not found' } }));
// Erreurs non gérées (ex. JSON malformé -> 400 via body-parser) : JSON, sans détail interne.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const raw = (err as { status?: unknown; statusCode?: unknown }) ?? {};
  const status = typeof raw.status === 'number' ? raw.status : typeof raw.statusCode === 'number' ? raw.statusCode : 500;
  if (status >= 500) console.error('[BFF] Unexpected error', err);
  res.status(status).json({ error: { message: status >= 500 ? 'Internal server error' : 'Invalid request' } });
});
export default app;
