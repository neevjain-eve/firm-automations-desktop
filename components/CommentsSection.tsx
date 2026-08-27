'use client';

import { useEffect, useState } from 'react';

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  user: { name: string; email: string };
};

export default function CommentsSection({
  entityType,
  entityId,
  accentClass = 'bg-slate-900 hover:bg-slate-700'
}: {
  entityType: string;
  entityId: string;
  accentClass?: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/comments?entityType=${entityType}&entityId=${entityId}`);
    setComments(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  async function addComment() {
    if (!draft.trim()) return;
    setPosting(true);
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType, entityId, body: draft })
    });
    setDraft('');
    setPosting(false);
    load();
  }

  async function removeComment(id: string) {
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280' }}>
        Comments {comments.length > 0 ? `(${comments.length})` : ''}
      </p>
      {loading ? (
        <p style={{ fontSize: 12, color: '#9ca3af' }}>Loading…</p>
      ) : comments.length === 0 ? (
        <p style={{ fontSize: 12, color: '#9ca3af' }}>No comments yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto', marginBottom: 10 }}>
          {comments.map((c) => (
            <div key={c.id} style={{ background: '#f8fafc', borderRadius: 10, padding: '8px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#111827' }}>{c.user?.name ?? c.user?.email}</span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <p style={{ fontSize: 13, color: '#374151', margin: '2px 0 0' }}>{c.body}</p>
              <button
                onClick={() => removeComment(c.id)}
                style={{ marginTop: 4, fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') addComment();
          }}
          style={{ flex: 1, borderRadius: 8, border: '1px solid #cbd5e1', padding: '8px 12px', fontSize: 13 }}
        />
        <button
          onClick={addComment}
          disabled={posting}
          className={accentClass}
          style={{ borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          Post
        </button>
      </div>
    </div>
  );
}
