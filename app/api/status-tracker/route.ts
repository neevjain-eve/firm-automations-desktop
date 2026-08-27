import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const tasks = await prisma.statusTask.findMany({
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { name: true, email: true } } }
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const {
    title,
    clientName,
    manager,
    teamMember,
    priority,
    notes,
    blockers,
    actionPoints,
    dueDate
  } = await req.json();
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const task = await prisma.statusTask.create({
    data: {
      title,
      clientName: clientName || null,
      manager: manager || null,
      teamMember: teamMember || null,
      priority: priority || 'medium',
      notes: notes || null,
      blockers: blockers || null,
      actionPoints: actionPoints || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdById: (session.user as any).id
    }
  });
  return NextResponse.json(task);
}
