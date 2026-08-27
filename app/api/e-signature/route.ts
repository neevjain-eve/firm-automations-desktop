import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const policies = await prisma.policy.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { name: true, email: true } },
      signatures: {
        select: {
          id: true,
          signedName: true,
          signedAt: true,
          user: { select: { id: true, name: true, email: true } }
        }
      }
    }
  });
  return NextResponse.json(policies);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { title, content } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
  }

  const policy = await prisma.policy.create({
    data: { title, content, createdById: (session.user as any).id },
    include: { createdBy: { select: { name: true, email: true } }, signatures: true }
  });
  return NextResponse.json(policy);
}
