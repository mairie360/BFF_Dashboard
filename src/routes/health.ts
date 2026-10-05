import { Router } from 'express';
import { registry } from '../openapi-registry';

const router = Router();

registry.registerPath({
  method: 'get',
  path: '/health',
  security: [],
  tags: ['Connectivity'],
  summary: 'Checks that the BFF process is up',
  responses: {
    200: {
      description: 'OK',
    }
  },
});

router.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;