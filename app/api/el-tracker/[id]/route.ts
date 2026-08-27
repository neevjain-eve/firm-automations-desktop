import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name) data.name = body.name;
  if (body.clientName) data.clientName = body.clientName;
  if (body.agreementType !== undefined) data.agreementType = body.agreementType || null;
  if (body.city !== undefined) data.city = body.city || null;
  if (body.areaLocality !== undefined) data.areaLocality = body.areaLocality || null;
  if (body.startDate) data.startDate = new Date(body.startDate);
  if (body.endDate) data.endDate = new Date(body.endDate);
  if (body.amount !== undefined) data.amount = body.amount ? Number(body.amount) : null;
  if (body.notes !== undefined) data.notes = body.notes || null;

  const agreement = await prisma.agreement.update({ where: { id: params.id }, data });
  return NextResponse.json(agreement);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await prisma.agreement.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
