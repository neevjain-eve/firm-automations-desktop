import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const ALLOWED_DOMAIN = 'pdka.in';

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const domain = normalizedEmail.split('@')[1];
  if (domain !== ALLOWED_DOMAIN) {
    return NextResponse.json(
      { error: `Sign-up is restricted to @${ALLOWED_DOMAIN} email addresses.` },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email: normalizedEmail, name, password: hash, role: 'staff' }
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
