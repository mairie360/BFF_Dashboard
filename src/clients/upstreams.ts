import { getCalendarAPIMairie360 } from '@mairie360/calendar-api-openapi/endpoints/calendarAPIMairie360';
import { getCoreAPIMairie360 } from '@mairie360/core-api-openapi/endpoints/coreAPIMairie360';
import { getProjectAPIMairie360 } from '@mairie360/project-api-openapi/endpoints/projectAPIMairie360';
import axios from 'axios';

// The dashboard reads the APIs directly, never another BFF (MAIR-525), through the operations of their published
// contracts (@mairie360/core-api-openapi, project-api-openapi, calendar-api-openapi). The base URL and the session
// are given per call by the lib's `asCaller` / `withoutSession`; the instance only sets headers.
const upstreamAxios = axios.create({ headers: { Accept: 'application/json' } });

export const coreApi = getCoreAPIMairie360(upstreamAxios);
export const projectApi = getProjectAPIMairie360(upstreamAxios);
export const calendarApi = getCalendarAPIMairie360(upstreamAxios);
