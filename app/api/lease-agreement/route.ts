import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const rows = await prisma.leaseAgreement.findMany({
    orderBy: { endDate: 'asc' },
    include: { createdBy: { select: { name: true, email: true } } }
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { propertyName, lessorName, contactPerson, phone, email, city, startDate, endDate, rentAmount, notes } =
    await req.json();
  if (!propertyName || !lessorName || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'propertyName, lessorName, startDate, and endDate are required' },
      { status: 400 }
    );
  }

  const row = await prisma.leaseAgreement.create({
    data: {
      propertyName,
      lessorName,
      contactPerson: contactPerson || null,
      phone: phone || null,
      email: email || null,
      city: city || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      rentAmount: rentAmount !== undefined && rentAmount !== '' ? Number(rentAmount) : null,
      notes: notes || null,
      createdById: (session.user as any).id
    }
  });
  return NextResponse.json(row);
}
