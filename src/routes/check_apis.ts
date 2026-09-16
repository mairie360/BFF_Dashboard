import type { AxiosRequestConfig } from 'axios';
import { Router } from 'express';
import { registry } from '../openapi-registry';
import { baseUrl } from '../clients/upstream';
import { calendarBff, projectBff, userBff } from '../clients/upstreams';

const router = Router();
registry.registerPath({ method: 'get', path: '/check_apis', responses: { 200: { description: 'Services disponibles' }, 502: { description: 'Service indisponible' } } });

// Les trois BFF dont dépend le tableau de bord, sondés par l'opération /health de leur contrat.
const services = [
  { name: 'USER_BFF', health: (options: AxiosRequestConfig) => userBff.getHealth(options) },
  { name: 'PROJECT_BFF', health: (options: AxiosRequestConfig) => projectBff.getHealth(options) },
  { name: 'CALENDAR_BFF', health: (options: AxiosRequestConfig) => calendarBff.getHealth(options) },
] as const;

router.get('/', async (_req, res) => {
  // Le callback est asynchrone : un service non configuré est rejeté au lieu d'être levé hors du map.
  const results = await Promise.allSettled(services.map(async (service) =>
    service.health({ baseURL: baseUrl(service.name), timeout: 5_000 })));
  const ok = results.every((result) => result.status === 'fulfilled');
  res.status(ok ? 200 : 502).json({
    status: ok ? 'OK' : 'Error',
    ...Object.fromEntries(services.map((service, index) => [
      service.name.toLowerCase(),
      results[index].status === 'fulfilled' ? 'Connected' : 'Unreachable',
    ])),
  });
});
export default router;
