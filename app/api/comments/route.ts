import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');
  if (!entityType || !entityId) {
    return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { entityType, entityId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'asc' }
  });
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { entityType, entityId, body: text } = body;
  if (!entityType || !entityId || !text?.trim()) {
    return NextResponse.json({ error: 'entityType, entityId, and body are required' }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      entityType,
      entityId,
      body: text,
      userId: (session.user as any).id
    },
    include: { user: { select: { name: true, email: true } } }
  });
  return NextResponse.json(comment, { status: 201 });
}
