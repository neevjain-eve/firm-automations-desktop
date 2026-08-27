import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.title) data.title = body.title;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.priority) data.priority = body.priority;
  if (body.status) data.status = body.status;
  if (body.department !== undefined) data.department = body.department || null;
  if (body.client !== undefined) data.client = body.client || null;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  if (Array.isArray(body.assigneeIds)) {
    await prisma.toDoAssignee.deleteMany({ where: { taskId: params.id } });
    await prisma.toDoAssignee.createMany({
      data: body.assigneeIds.map((userId: string) => ({ taskId: params.id, userId }))
    });
  }

  const task = await prisma.toDoTask.update({
    where: { id: params.id },
    data,
    include: {
      createdBy: { select: { name: true, email: true } },
      assignees: { include: { user: { select: { id: true, name: true, email: true } } } },
      workLogs: {
        orderBy: { logDate: 'desc' },
        include: { user: { select: { name: true, email: true } } }
      }
    }
  });
  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await prisma.toDoTask.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
