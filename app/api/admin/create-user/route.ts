import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

function setupSecretOk(given: string | null): boolean {
  const expected = process.env.ADMIN_SETUP_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// One-time-use style admin bootstrap endpoint: creates or updates a staff
// account with a bcrypt-hashed password. Protected by ADMIN_SETUP_SECRET so
// it can't be called by anyone who doesn't already have that env var.
export async function POST(req: NextRequest) {
  if (!setupSecretOk(req.headers.get('x-setup-secret'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { email, name, password, role } = await req.json();
  if (!email || !name || !password) {
    return NextResponse.json({ error: 'email, name, and password are required' }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { name, password: hash, role: role ?? 'staff' },
    create: { email: email.toLowerCase(), name, password: hash, role: role ?? 'staff' }
  });

  return NextResponse.json({ id: user.id, email: user.email, role: user.role });
}
