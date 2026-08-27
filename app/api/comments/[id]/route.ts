import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const comment = await prisma.comment.findUnique({ where: { id: params.id } });
  if (!comment) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const me = session.user as any;
  if (comment.userId !== me.id && me.role !== 'admin' && me.role !== 'partner') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
