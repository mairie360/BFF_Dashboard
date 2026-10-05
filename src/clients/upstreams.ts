import { getBffCalendar } from '@mairie360/bff-calendar-openapi/endpoints/bffCalendar';
import { getBffProject } from '@mairie360/bff-project-openapi/endpoints/bffProject';
import { getBffUser } from '@mairie360/bff-user-openapi/endpoints/bffUser';
import { HttpError, authorization, mapUpstreamError } from '@mairie360/bffs-lib';
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { Request } from 'express';
import { baseUrl } from './upstream';

// The upstream BFFs are only called through the operations of their published contracts
// (@mairie360/bff-user-openapi, bff-project-openapi, bff-calendar-openapi).
const upstreamAxios = axios.create({ timeout: 10_000, headers: { Accept: 'application/json' } });

export const userBff = getBffUser(upstreamAxios);
export const projectBff = getBffProject(upstreamAxios);
export const calendarBff = getBffCalendar(upstreamAxios);

/**
 * Options of an upstream call on behalf of the caller. The URL is read again on every request (the
 * environment can change without a restart); a caller without a session is refused before the call.
 */
export function asCaller(req: Request, service: string): AxiosRequestConfig {
  const Authorization = authorization(req);
  return { baseURL: baseUrl(service), headers: { Authorization } };
}

/** Upstream statuses the contract of /dashboard/bootstrap declares: only a refused session is relayed. */
const DECLARED_UPSTREAM_STATUSES = [401] as const;

/**
 * Runs an upstream call and returns its body. Only an upstream 401 (declared by the contract) is kept;
 * any other status, a network failure and a body that is not JSON become a 502. The upstream body and
 * message are never relayed.
 */
export async function callUpstream<T>(
  service: string,
  call: () => Promise<AxiosResponse<T>>,
): Promise<T> {
  let response: AxiosResponse<T>;
  try {
    response = await call();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (axios.isAxiosError(error) && error.response !== undefined) throw mapUpstreamError(error, DECLARED_UPSTREAM_STATUSES);
    throw new HttpError(502, `The ${service} service is unavailable.`);
  }
  // axios keeps the raw body when it is not parsable JSON.
  if (typeof response.data === 'string') {
    throw new HttpError(502, `The ${service} answer is invalid.`);
  }
  return response.data;
}
