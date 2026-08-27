'use client';

import { useEffect, useRef, useState } from 'react';

type Attachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
  user: { name: string; email: string };
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentsSection({
  entityType,
  entityId,
  accentClass = 'bg-slate-900 hover:bg-slate-700'
}: {
  entityType: string;
  entityId: string;
  accentClass?: string;
}) {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/attachments?entityType=${entityType}&entityId=${entityId}`);
    setFiles(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  async function upload(file: File) {
    setError('');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    const res = await fetch('/api/attachments', { method: 'POST', body: formData });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error ?? 'Upload failed.');
      return;
    }
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/attachments/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280' }}>
        Attachments {files.length > 0 ? `(${files.length})` : ''}
      </p>
      {loading ? (
        <p style={{ fontSize: 12, color: '#9ca3af' }}>Loading…</p>
      ) : files.length === 0 ? (
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>No files attached yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {files.map((f) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', borderRadius: 8, padding: '7px 10px' }}>
              <span style={{ fontSize: 16 }}>📎</span>
              <a href={`/api/attachments/${f.id}/file`} target="_blank" rel="noreferrer" style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#111827', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.fileName}
              </a>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatSize(f.fileSize)}</span>
              <button
                onClick={() => remove(f.id)}
                style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 6 }}>{error}</p>}
      <input
        ref={inputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = '';
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={accentClass}
        style={{ borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}
      >
        {uploading ? 'Uploading…' : '+ Attach file'}
      </button>
    </div>
  );
}
