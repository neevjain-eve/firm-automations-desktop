import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const rows = await prisma.gstReconciliation.findMany({
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { name: true, email: true } } }
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { period, returnType, gstin, dueDate, filedBy, amountBooks, amountGst, notes } =
    await req.json();
  if (!period) {
    return NextResponse.json({ error: 'period is required' }, { status: 400 });
  }

  const row = await prisma.gstReconciliation.create({
    data: {
      period,
      returnType: returnType || 'GSTR-3B',
      gstin: gstin || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      filedBy: filedBy || null,
      amountBooks: amountBooks !== undefined && amountBooks !== '' ? Number(amountBooks) : null,
      amountGst: amountGst !== undefined && amountGst !== '' ? Number(amountGst) : null,
      notes: notes || null,
      createdById: (session.user as any).id
    }
  });
  return NextResponse.json(row);
}
