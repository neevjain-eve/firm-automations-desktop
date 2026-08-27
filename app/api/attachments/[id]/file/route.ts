import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import fs from 'fs';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveAttachmentPath } from '@/lib/localFiles';

// Streams an attachment's bytes back from local disk. Replaces the public
// Vercel Blob URL the original attachment card used to link to -- files
// never leave this machine, so downloads have to go through this app
// instead of a CDN URL.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const attachment = await prisma.attachment.findUnique({ where: { id: params.id } });
  if (!attachment) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const fullPath = resolveAttachmentPath(attachment.fileUrl);
  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ error: 'file missing on disk' }, { status: 404 });
  }

  const data = fs.readFileSync(fullPath);
  return new NextResponse(data, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.fileName)}"`
    }
  });
}
