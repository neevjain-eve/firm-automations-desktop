import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const tasks = await prisma.toDoTask.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { name: true, email: true } },
      assignees: { include: { user: { select: { id: true, name: true, email: true } } } },
      workLogs: {
        orderBy: { logDate: 'desc' },
        include: { user: { select: { name: true, email: true } } }
      }
    }
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { title, description, priority, department, client, dueDate, assigneeIds } = await req.json();
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const task = await prisma.toDoTask.create({
    data: {
      title,
      description: description || null,
      priority: priority || 'medium',
      department: department || null,
      client: client || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdById: (session.user as any).id,
      assignees: {
        create: (Array.isArray(assigneeIds) ? assigneeIds : []).map((userId: string) => ({ userId }))
      }
    },
    include: {
      createdBy: { select: { name: true, email: true } },
      assignees: { include: { user: { select: { id: true, name: true, email: true } } } },
      workLogs: true
    }
  });
  return NextResponse.json(task);
}
