import fs from 'fs';
import path from 'path';

// Local-disk replacement for Vercel Blob storage in the desktop build.
// electron/main.js sets ATTACHMENTS_DIR to a folder inside the OS's
// per-user app-data directory before starting the Next server, so every
// install keeps its own files locally -- nothing is uploaded anywhere.
// Falls back to a project-local folder for `next dev`/testing outside
// Electron.
const ATTACHMENTS_DIR = process.env.ATTACHMENTS_DIR || path.join(process.cwd(), 'local-data', 'attachments');

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

// Writes a File/Blob to disk under entityType/entityId/<uniquePrefix>-<name>
// and returns the relative path to store in Attachment.fileUrl.
export async function saveAttachmentFile(
  entityType: string,
  entityId: string,
  file: File
): Promise<{ relPath: string; size: number }> {
  const dir = path.join(ATTACHMENTS_DIR, entityType, entityId);
  ensureDir(dir);

  const safeName = file.name.replace(/[/\\]/g, '_');
  const fileName = `${Date.now()}-${safeName}`;
  const fullPath = path.join(dir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(fullPath, buffer);

  const relPath = path.posix.join(entityType, entityId, fileName);
  return { relPath, size: buffer.length };
}

export function deleteAttachmentFile(relPath: string) {
  const fullPath = path.join(ATTACHMENTS_DIR, relPath);
  try {
    fs.unlinkSync(fullPath);
  } catch {
    // already gone -- fine, DB row cleanup is what matters
  }
}

export function resolveAttachmentPath(relPath: string): string {
  return path.join(ATTACHMENTS_DIR, relPath);
}
