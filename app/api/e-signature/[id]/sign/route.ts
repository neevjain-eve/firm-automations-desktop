import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { signedName, signatureData } = await req.json();
  if (!signedName || !signatureData) {
    return NextResponse.json({ error: 'signedName and signatureData are required' }, { status: 400 });
  }

  const userId = (session.user as any).id;
  const existing = await prisma.policySignature.findUnique({
    where: { policyId_userId: { policyId: params.id, userId } }
  });
  if (existing) {
    return NextResponse.json({ error: 'You have already signed this policy.' }, { status: 409 });
  }

  const signature = await prisma.policySignature.create({
    data: { policyId: params.id, userId, signedName, signatureData },
    include: { user: { select: { id: true, name: true, email: true } } }
  });
  return NextResponse.json(signature);
}
