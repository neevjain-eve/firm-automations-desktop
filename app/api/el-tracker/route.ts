import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const agreements = await prisma.agreement.findMany({
    orderBy: { endDate: 'asc' },
    include: {
      createdBy: { select: { name: true, email: true } },
      renewedFrom: { select: { id: true, name: true, endDate: true } },
      renewals: { select: { id: true, name: true, startDate: true, endDate: true } }
    }
  });
  return NextResponse.json(agreements);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { name, clientName, agreementType, city, areaLocality, startDate, endDate, amount, notes } =
    await req.json();
  if (!name || !clientName || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'name, clientName, startDate, and endDate are required' },
      { status: 400 }
    );
  }

  const agreement = await prisma.agreement.create({
    data: {
      name,
      clientName,
      agreementType: agreementType || null,
      city: city || null,
      areaLocality: areaLocality || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      amount: amount ? Number(amount) : null,
      notes: notes || null,
      createdById: (session.user as any).id
    }
  });
  return NextResponse.json(agreement);
}
