// Drop-in replacement for the original app's storage module -- same
// readJSON(key, fallback) / writeJSON(key, value) signature the rest of the
// (otherwise-unmodified) original code expects -- persisted to the firm's
// own database via Prisma instead of Vercel KV / local JSON files. The
// `value` column is a plain String (SQLite has no native Json column type
// the way Postgres does), so this module does the JSON encode/decode that
// used to happen implicitly at the Prisma layer.
const { prisma } = require('../../../prisma');

async function readJSON(key, fallbackValue) {
  const row = await prisma.legacyTodoStore.findUnique({ where: { key } });
  return row ? JSON.parse(row.value) : fallbackValue;
}

async function writeJSON(key, value) {
  const encoded = JSON.stringify(value);
  await prisma.legacyTodoStore.upsert({
    where: { key },
    create: { key, value: encoded },
    update: { value: encoded }
  });
}

module.exports = { readJSON, writeJSON };
