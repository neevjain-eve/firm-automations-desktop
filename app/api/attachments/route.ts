import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveAttachmentFile } from '@/lib/localFiles';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');
  if (!entityType || !entityId) {
    return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 });
  }

  const attachments = await prisma.attachment.findMany({
    where: { entityType, entityId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(attachments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const entityType = formData.get('entityType') as string | null;
  const entityId = formData.get('entityId') as string | null;

  if (!file || !entityType || !entityId) {
    return NextResponse.json({ error: 'file, entityType, and entityId are required' }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 15MB)' }, { status: 413 });
  }

  // Stored on local disk (see lib/localFiles.ts) instead of Vercel Blob --
  // this is the offline desktop build, so files never leave the machine.
  const { relPath, size } = await saveAttachmentFile(entityType, entityId, file);

  const attachment = await prisma.attachment.create({
    data: {
      entityType,
      entityId,
      fileName: file.name,
      fileUrl: relPath,
      fileSize: size,
      userId: (session.user as any).id
    },
    include: { user: { select: { name: true, email: true } } }
  });

  return NextResponse.json(attachment, { status: 201 });
}
