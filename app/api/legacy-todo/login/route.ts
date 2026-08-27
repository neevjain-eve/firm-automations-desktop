import { toAppRoute } from '@/lib/legacy-todo/adapt';
const handler = require('@/lib/legacy-todo/handlers/login');
const wrapped = toAppRoute(handler);
export const POST = wrapped;
