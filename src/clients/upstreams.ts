import { getBffCalendar } from '@mairie360/bff-calendar-openapi/endpoints/bffCalendar';
import { getBffProject } from '@mairie360/bff-project-openapi/endpoints/bffProject';
import { getBffUser } from '@mairie360/bff-user-openapi/endpoints/bffUser';
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { Request } from 'express';
import { authorization, baseUrl, UpstreamError } from './upstream';

// Les BFF amont ne sont appelés que par les opérations de leurs contrats publiés
// (@mairie360/bff-user-openapi, bff-project-openapi, bff-calendar-openapi).
const upstreamAxios = axios.create({ timeout: 10_000, headers: { Accept: 'application/json' } });

export const userBff = getBffUser(upstreamAxios);
export const projectBff = getBffProject(upstreamAxios);
export const calendarBff = getBffCalendar(upstreamAxios);

/**
 * Options d'un appel amont au nom de l'appelant. L'URL est relue à chaque requête (les variables
 * d'environnement peuvent changer sans redémarrage) ; un appelant sans session est refusé avant l'appel.
 */
export function asCaller(req: Request, service: string): AxiosRequestConfig {
  return {
    baseURL: baseUrl(service),
    headers: { Authorization: authorization(req) },
  };
}

/**
 * Exécute un appel amont et renvoie son corps. Un 4xx est conservé, une panne (réseau ou 5xx) devient un
 * 502, et une réponse qui n'est pas du JSON un 502 « réponse invalide » : le corps amont n'est jamais relayé.
 */
export async function callUpstream<T>(
  service: string,
  call: () => Promise<AxiosResponse<T>>,
): Promise<T> {
  let response: AxiosResponse<T>;
  try {
    response = await call();
  } catch (error) {
    if (error instanceof UpstreamError) throw error;
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === undefined) throw new UpstreamError(502, `Le service ${service} est indisponible.`);
      throw new UpstreamError(status >= 500 ? 502 : status, `Le service ${service} a répondu ${status}.`);
    }
    throw new UpstreamError(502, `Le service ${service} est indisponible.`);
  }
  // axios laisse le corps brut quand il n'est pas du JSON analysable.
  if (typeof response.data === 'string') {
    throw new UpstreamError(502, `La réponse de ${service} est invalide.`);
  }
  return response.data;
}
