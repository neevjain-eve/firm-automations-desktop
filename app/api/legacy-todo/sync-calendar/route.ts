import { toAppRoute } from '@/lib/legacy-todo/adapt';
const handler = require('@/lib/legacy-todo/handlers/sync-calendar');
const wrapped = toAppRoute(handler);
export const GET = wrapped;
export const POST = wrapped;
