import 'dotenv/config';
import { apiOnlyHeaders, errorHandler, noStore, notFoundHandler, parseTrustProxy, requireSession, securityHeaders } from '@mairie360/bffs-lib';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './openapi';
import healthRouter from './routes/health';
import checkApis from './routes/check_apis';
import moduleRouter from './routes/dashboard';

export const app = express();
// Client IP (req.ip) as seen behind the ingress: see parseTrustProxy (TRUST_PROXY, unset = no proxy trusted).
app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));
// Shared security headers (helmet, X-Powered-By removed) on every response, then the stricter API-only
// headers (default-src 'none'...) everywhere but /docs. Both run before body parsing, so they also
// cover body-parse error responses.
app.use(securityHeaders);
app.use(apiOnlyHeaders());
app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.get(['/openapi.json', '/swagger.json'], (_req, res) => res.json(openApiDocument));
app.use('/health', healthRouter);
app.use('/check_apis', checkApis);
// Session-bound answers: never cached, and refused with a 401 before any upstream call unless the Bearer token
// is a session signed with JWT_SECRET (bffs-lib requireSession, MAIR-474).
app.use('/dashboard', noStore, requireSession, moduleRouter);
// Unknown routes and every error end in the shared envelope `{ error: { code, message, details } }`:
// the status of the error is kept (400 for an unparsable body, 401, 502, 503...) and anything
// unexpected becomes a 500 without leaking its message.
app.use(notFoundHandler);
app.use(errorHandler());
export default app;
