'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import CommentsSection from '@/components/CommentsSection';
import AttachmentsSection from '@/components/AttachmentsSection';
import { exportToExcel, parseExcelFile } from '@/lib/excel';

type Row = {
  id: string;
  period: string;
  returnType: string;
  status: string;
  gstin: string | null;
  dueDate: string | null;
  filedBy: string | null;
  amountBooks: number | null;
  amountGst: number | null;
  notes: string | null;
  createdBy: { name: string; email: string };
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  matched: 'Matched',
  mismatch: 'Mismatch'
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  matched: 'bg-green-100 text-green-700',
  mismatch: 'bg-red-100 text-red-700'
};

const RETURN_TYPES = ['GSTR-1', 'GSTR-3B', 'GSTR-2B', 'Annual'];

export default function GstReconciliationPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    period: '',
    returnType: 'GSTR-3B',
    gstin: '',
    dueDate: '',
    filedBy: '',
    amountBooks: '',
    amountGst: '',
    notes: ''
  });

  async function load() {
    setLoading(true);
    const res = await fetch('/api/gst-reconciliation');
    setRows(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addRow(e: React.FormEvent) {
    e.preventDefault();
    if (!form.period.trim()) return;
    setSaving(true);
    await fetch('/api/gst-reconciliation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setForm({
      period: '',
      returnType: 'GSTR-3B',
      gstin: '',
      dueDate: '',
      filedBy: '',
      amountBooks: '',
      amountGst: '',
      notes: ''
    });
    setSaving(false);
    load();
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/gst-reconciliation/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    load();
  }

  async function removeRow(id: string) {
    await fetch(`/api/gst-reconciliation/${id}`, { method: 'DELETE' });
    load();
  }

  function exportRows() {
    exportToExcel(
      rows.map((r) => ({
        Period: r.period,
        'Return Type': r.returnType,
        Status: STATUS_LABEL[r.status] ?? r.status,
        GSTIN: r.gstin ?? '',
        'Due Date': r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '',
        'Filed By': r.filedBy ?? '',
        'Amount (Books)': r.amountBooks ?? '',
        'Amount (GST Portal)': r.amountGst ?? '',
        Notes: r.notes ?? ''
      })),
      'gst-reconciliation-export.xlsx'
    );
  }

  async function importRows(file: File) {
    setImporting(true);
    setImportMsg('');
    try {
      const parsed = await parseExcelFile(file);
      let count = 0;
      for (const row of parsed) {
        const period = row['Period'];
        if (!period) continue;
        await fetch('/api/gst-reconciliation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            period,
            returnType: row['Return Type'] || 'GSTR-3B',
            gstin: row['GSTIN'] || '',
            dueDate: row['Due Date'] ? new Date(row['Due Date']).toISOString() : null,
            filedBy: row['Filed By'] || '',
            amountBooks: row['Amount (Books)'] || '',
            amountGst: row['Amount (GST Portal)'] || '',
            notes: row['Notes'] || ''
          })
        });
        count++;
      }
      setImportMsg(`Imported ${count} period${count === 1 ? '' : 's'}.`);
      load();
    } catch {
      setImportMsg('Could not read that file — make sure it is a valid .xlsx or .csv export.');
    }
    setImporting(false);
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (
        search &&
        !r.period.toLowerCase().includes(search.toLowerCase()) &&
        !r.returnType.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [rows, search, statusFilter]);

  const counts = useMemo(() => {
    return {
      pending: rows.filter((r) => r.status === 'pending').length,
      matched: rows.filter((r) => r.status === 'matched').length,
      mismatch: rows.filter((r) => r.status === 'mismatch').length
    };
  }, [rows]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">GST Reconciliation</h1>
      <p className="mb-6 text-sm text-slate-500">
        Track GST filing periods and reconcile books figures against the GST portal. Prototype --
        no auto-import from the GST portal yet.
      </p>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Pending</p>
          <p className="text-xl font-semibold text-slate-900">{counts.pending}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Matched</p>
          <p className="text-xl font-semibold text-slate-900">{counts.matched}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Mismatch</p>
          <p className="text-xl font-semibold text-slate-900">{counts.mismatch}</p>
        </div>
      </div>

      <form
        onSubmit={addRow}
        className="mb-8 space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Period (e.g. Jul 2026)
            </label>
            <input
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Return type</label>
            <select
              value={form.returnType}
              onChange={(e) => setForm({ ...form, returnType: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              {RETURN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              GSTIN (optional)
            </label>
            <input
              value={form.gstin}
              onChange={(e) => setForm({ ...form, gstin: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Due date (optional)
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Filed by (optional)
            </label>
            <input
              value={form.filedBy}
              onChange={(e) => setForm({ ...form, filedBy: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Amount as per books (₹, optional)
            </label>
            <input
              type="number"
              value={form.amountBooks}
              onChange={(e) => setForm({ ...form, amountBooks: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Amount as per GST portal (₹, optional)
            </label>
            <input
              type="number"
              value={form.amountGst}
              onChange={(e) => setForm({ ...form, amountGst: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Notes (optional)
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add period'}
        </button>
      </form>

      <div className="mb-4 flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by period or return type…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="matched">Matched</option>
          <option value="mismatch">Mismatch</option>
        </select>
        <button onClick={exportRows} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
          Export
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importRows(file);
            e.target.value = '';
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          {importing ? 'Importing…' : 'Import'}
        </button>
      </div>
      {importMsg && <p className="mb-3 text-xs text-slate-500">{importMsg}</p>}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => (<div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />))}</div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">
          {rows.length === 0 ? 'No periods yet -- add one above.' : 'No periods match your search.'}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const diff =
              r.amountBooks !== null && r.amountGst !== null
                ? r.amountBooks - r.amountGst
                : null;
            return (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className="font-medium text-slate-900 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    >
                      {r.period} · {r.returnType}
                      {r.gstin ? ` · ${r.gstin}` : ''}
                    </p>
                    <p className="text-xs text-slate-500">
                      {r.dueDate ? `Due ${new Date(r.dueDate).toLocaleDateString()}` : ''}
                      {r.filedBy ? ` · Filed by ${r.filedBy}` : ''}
                      {r.amountBooks !== null ? ` · Books: ₹${r.amountBooks.toLocaleString()}` : ''}
                      {r.amountGst !== null ? ` · GST: ₹${r.amountGst.toLocaleString()}` : ''}
                      {diff !== null ? ` · Diff: ₹${diff.toLocaleString()}` : ''}
                    </p>
                    {r.notes && <p className="mt-1 text-sm text-slate-600">{r.notes}</p>}
                    <p className="mt-1 text-xs text-slate-400">
                      Added by {r.createdBy?.name ?? r.createdBy?.email}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[r.status]}`}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <select
                    value={r.status}
                    onChange={(e) => updateStatus(r.id, e.target.value)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="matched">Matched</option>
                    <option value="mismatch">Mismatch</option>
                  </select>
                  <button
                    onClick={() => removeRow(r.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
                {expandedId === r.id && (
                  <div className="mt-3 space-y-4 border-t border-slate-100 pt-3">
                    <AttachmentsSection entityType="gst" entityId={r.id} />
                    <CommentsSection entityType="gst" entityId={r.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
