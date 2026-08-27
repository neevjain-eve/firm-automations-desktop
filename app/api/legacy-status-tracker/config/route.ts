// Serves the literally-copied Status Tracker frontend's user list (name/role/
// manager, used for its own in-app login screen). Session-gated by our own
// NextAuth login -- you have to already be signed into Firm Automations to
// reach this at all, so this is a convenience layer, not the real security
// boundary. Backed by Postgres (LegacyStatusStore, key "config"), never
// committed to git -- the original app kept this in a public od_config.json
// file with plaintext passwords, which is exactly what leaked.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DEFAULT_USERS = [
  { id: 'USR-1', email: 'bindu@pdka.in', password: 'changeme', role: 'manager', manager: 'Bindu', name: 'Bindu' },
  { id: 'USR-2', email: 'srikrishna@pdka.in', password: 'changeme', role: 'manager', manager: 'Srikrishna', name: 'Srikrishna' },
  { id: 'USR-3', email: 'naveen@pdka.in', password: 'changeme', role: 'admin', manager: null, name: 'Naveen' },
  { id: 'USR-4', email: 'rajesh@pdka.in', password: 'changeme', role: 'manager', manager: 'Rajesh', name: 'Rajesh' },
  { id: 'USR-5', email: 'manju@pdka.in', password: 'changeme', role: 'manager', manager: 'Manju', name: 'Manju' },
  { id: 'USR-6', email: 'ramya@pdka.in', password: 'changeme', role: 'manager', manager: 'Ramya', name: 'Ramya' }
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const row = await prisma.legacyStatusStore.findUnique({ where: { key: 'config' } });
  if (row) return NextResponse.json(JSON.parse(row.value));

  // First load: seed with fresh placeholder passwords (never the leaked
  // ones) so the app is usable immediately; tell staff to change them.
  await prisma.legacyStatusStore.create({
    data: { key: 'config', value: JSON.stringify({ users: DEFAULT_USERS }) }
  });
  return NextResponse.json({ users: DEFAULT_USERS });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await prisma.legacyStatusStore.upsert({
    where: { key: 'config' },
    create: { key: 'config', value: JSON.stringify(body) },
    update: { value: JSON.stringify(body) }
  });
  return NextResponse.json({ ok: true });
}
