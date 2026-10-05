import { getBffCalendar } from '@mairie360/bff-calendar-openapi/endpoints/bffCalendar';
import { getBffProject } from '@mairie360/bff-project-openapi/endpoints/bffProject';
import { getBffUser } from '@mairie360/bff-user-openapi/endpoints/bffUser';
import axios from 'axios';

// The upstream BFFs are only called through the operations of their published contracts
// (@mairie360/bff-user-openapi, bff-project-openapi, bff-calendar-openapi). The base URL and the
// session are given per call by the lib's `asCaller` / `withoutSession`; the instance only sets headers.
const upstreamAxios = axios.create({ headers: { Accept: 'application/json' } });

export const userBff = getBffUser(upstreamAxios);
export const projectBff = getBffProject(upstreamAxios);
export const calendarBff = getBffCalendar(upstreamAxios);
