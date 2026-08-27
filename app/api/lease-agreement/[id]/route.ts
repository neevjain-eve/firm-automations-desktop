import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.propertyName) data.propertyName = body.propertyName;
  if (body.lessorName) data.lessorName = body.lessorName;
  if (body.contactPerson !== undefined) data.contactPerson = body.contactPerson || null;
  if (body.phone !== undefined) data.phone = body.phone || null;
  if (body.email !== undefined) data.email = body.email || null;
  if (body.city !== undefined) data.city = body.city || null;
  if (body.startDate) data.startDate = new Date(body.startDate);
  if (body.endDate) data.endDate = new Date(body.endDate);
  if (body.rentAmount !== undefined)
    data.rentAmount = body.rentAmount !== '' ? Number(body.rentAmount) : null;
  if (body.notes !== undefined) data.notes = body.notes || null;

  const row = await prisma.leaseAgreement.update({ where: { id: params.id }, data });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await prisma.leaseAgreement.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
