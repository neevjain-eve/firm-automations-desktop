import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const ALLOWED_DOMAIN = 'pdka.in';

// Checking that an email *ends in* @pdka.in proves nothing: anyone can type
// any address. Self-signup therefore requires an invite code that only firm
// staff are given (set SIGNUP_INVITE_CODE in the environment). If it is not
// set, self-signup is switched off and accounts must be created by an admin
// through /api/admin/create-user.
function inviteCodeOk(given: unknown): boolean {
  const expected = process.env.SIGNUP_INVITE_CODE;
  if (!expected || expected.length < 8) return false;
  const a = Buffer.from(String(given ?? ''));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!process.env.SIGNUP_INVITE_CODE) {
    return NextResponse.json(
      { error: 'Self-sign-up is disabled. Ask an administrator to create your account.' },
      { status: 403 }
    );
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const { name, email, password, inviteCode } = payload ?? {};

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
  }

  if (!inviteCodeOk(inviteCode)) {
    return NextResponse.json({ error: 'Invalid invite code.' }, { status: 403 });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const domain = normalizedEmail.split('@')[1];
  if (domain !== ALLOWED_DOMAIN) {
    return NextResponse.json(
      { error: `Sign-up is restricted to @${ALLOWED_DOMAIN} email addresses.` },
      { status: 400 }
    );
  }

  if (typeof password !== 'string' || password.length < 10) {
    return NextResponse.json({ error: 'Password must be at least 10 characters.' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email: normalizedEmail, name: String(name).slice(0, 100), password: hash, role: 'staff' }
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
