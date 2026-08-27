// Serves the literally-copied EL Tracker frontend's own staff login list
// (separate from Firm Automations accounts, exactly as in the original app).
// Session-gated by this app's own NextAuth login. Backed by Postgres
// (LegacyElTrackerStore, key "users"), never committed to git.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const row = await prisma.legacyElTrackerStore.findUnique({ where: { key: 'users' } });
  return NextResponse.json(row ? JSON.parse(row.value) : []);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await prisma.legacyElTrackerStore.upsert({
    where: { key: 'users' },
    create: { key: 'users', value: JSON.stringify(body) },
    update: { value: JSON.stringify(body) }
  });
  return NextResponse.json({ ok: true });
}
