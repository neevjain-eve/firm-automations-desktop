import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.title) data.title = body.title;
  if (body.clientName !== undefined) data.clientName = body.clientName || null;
  if (body.manager !== undefined) data.manager = body.manager || null;
  if (body.teamMember !== undefined) data.teamMember = body.teamMember || null;
  if (body.priority) data.priority = body.priority;
  if (body.notes !== undefined) data.notes = body.notes || null;
  if (body.blockers !== undefined) data.blockers = body.blockers || null;
  if (body.actionPoints !== undefined) data.actionPoints = body.actionPoints || null;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  const task = await prisma.statusTask.update({ where: { id: params.id }, data });
  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await prisma.statusTask.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
