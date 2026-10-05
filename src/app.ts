import 'dotenv/config';
import { errorHandler, noStore, notFoundHandler, parseTrustProxy, requireBearer } from '@mairie360/bffs-lib';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './openapi';
import healthRouter from './routes/health';
import checkApis from './routes/check_apis';
import moduleRouter from './routes/dashboard';

export const app = express();
// Client IP (req.ip) as seen behind the ingress: see parseTrustProxy (TRUST_PROXY, unset = no proxy trusted).
app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));
// Security headers (CSP, X-Content-Type-Options, Permissions-Policy, CORP...) and removal of
// X-Powered-By. upgrade-insecure-requests is dropped because the BFF is served over HTTP behind
// the reverse proxy.
app.use(helmet({ contentSecurityPolicy: { useDefaults: true, directives: { 'upgrade-insecure-requests': null } } }));
app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.get(['/openapi.json', '/swagger.json'], (_req, res) => res.json(openApiDocument));
app.use('/health', healthRouter);
app.use('/check_apis', checkApis);
// Session-bound answers: never cached, and refused with a 401 before any upstream call without a Bearer token.
app.use('/dashboard', noStore, requireBearer, moduleRouter);
// Unknown routes and every error end in the shared envelope `{ error: { code, message, details } }`:
// the status of the error is kept (400 for an unparsable body, 401, 502, 503...) and anything
// unexpected becomes a 500 without leaking its message.
app.use(notFoundHandler);
app.use(errorHandler());
export default app;
