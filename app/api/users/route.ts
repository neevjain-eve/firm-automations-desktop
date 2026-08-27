import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Lightweight directory of firm accounts, used for the To-Do List assignee
// picker. Only id/name/email -- never passwords.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, email: true }
  });
  return NextResponse.json(users);
}
