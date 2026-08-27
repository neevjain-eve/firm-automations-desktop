// Serves the literally-copied EL Tracker frontend's core data blob
// ({agreements, bills, clientTasks, lastUpdated, updatedBy}). Replaces the
// original app's OneDrive/Graph sync (which relied on a client-side GitHub
// write token that leaked publicly) with a plain Postgres-backed read/write,
// session-gated by this app's own login. The frontend's own IndexedDB-based
// merge/conflict logic is untouched -- this route is just the new transport.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const row = await prisma.legacyElTrackerStore.findUnique({ where: { key: 'data' } });
  return NextResponse.json(row ? JSON.parse(row.value) : { agreements: [], bills: [], clientTasks: [] });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await prisma.legacyElTrackerStore.upsert({
    where: { key: 'data' },
    create: { key: 'data', value: JSON.stringify(body) },
    update: { value: JSON.stringify(body) }
  });
  return NextResponse.json({ ok: true });
}
