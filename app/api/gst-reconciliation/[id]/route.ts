import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.period) data.period = body.period;
  if (body.returnType) data.returnType = body.returnType;
  if (body.status) data.status = body.status;
  if (body.gstin !== undefined) data.gstin = body.gstin || null;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.filedBy !== undefined) data.filedBy = body.filedBy || null;
  if (body.amountBooks !== undefined)
    data.amountBooks = body.amountBooks !== '' ? Number(body.amountBooks) : null;
  if (body.amountGst !== undefined)
    data.amountGst = body.amountGst !== '' ? Number(body.amountGst) : null;
  if (body.notes !== undefined) data.notes = body.notes || null;

  const row = await prisma.gstReconciliation.update({ where: { id: params.id }, data });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await prisma.gstReconciliation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
