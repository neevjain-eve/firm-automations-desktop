import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { description } = await req.json();
  if (!description) return NextResponse.json({ error: 'description is required' }, { status: 400 });

  const entry = await prisma.toDoWorkLog.create({
    data: {
      taskId: params.id,
      userId: (session.user as any).id,
      description
    },
    include: { user: { select: { name: true, email: true } } }
  });
  return NextResponse.json(entry);
}
