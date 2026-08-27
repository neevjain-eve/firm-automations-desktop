import { toAppRoute } from '@/lib/legacy-todo/adapt';
const handler = require('@/lib/legacy-todo/handlers/employees');
const wrapped = toAppRoute(handler);
export const GET = wrapped;
export const POST = wrapped;
export const PATCH = wrapped;
export const DELETE = wrapped;
