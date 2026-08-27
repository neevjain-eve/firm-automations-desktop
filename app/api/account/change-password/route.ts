import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!dbUser?.password) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, dbUser.password);
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: dbUser.id }, data: { password: hash } });

  return NextResponse.json({ ok: true });
}
