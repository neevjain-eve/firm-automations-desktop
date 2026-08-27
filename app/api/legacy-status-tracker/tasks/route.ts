// Serves the literally-copied Status Tracker frontend's task/client data.
// Replaces the original app's Microsoft Graph + OneDrive sync (which relied
// on a client-side GitHub write token that leaked publicly) with a plain
// Postgres-backed read/write, session-gated by our own NextAuth login.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const row = await prisma.legacyStatusStore.findUnique({ where: { key: 'tasks' } });
  return NextResponse.json(row ? JSON.parse(row.value) : { tasks: [], clients: [] });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await prisma.legacyStatusStore.upsert({
    where: { key: 'tasks' },
    create: { key: 'tasks', value: JSON.stringify(body) },
    update: { value: JSON.stringify(body) }
  });
  return NextResponse.json({ ok: true });
}
