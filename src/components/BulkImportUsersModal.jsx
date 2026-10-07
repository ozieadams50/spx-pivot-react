import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { apiFetch } from '../lib/api';

// Spreadsheet column → API field. Headers are matched case/space/punctuation-insensitively.
const COLUMNS = [
  { header: 'First Name',    field: 'firstName',         aliases: ['firstname', 'fname', 'first'] },
  { header: 'Last Name',     field: 'lastName',          aliases: ['lastname', 'lname', 'last'] },
  { header: 'Email',         field: 'email',             aliases: ['email', 'emailaddress'] },
  { header: 'Phone',         field: 'phone',             aliases: ['phone', 'phonenumber', 'mobile'] },
  { header: 'Password',      field: 'password',          aliases: ['password'] },
  { header: 'Access Level',  field: 'subscriptionLevel', aliases: ['accesslevel', 'access', 'subscription', 'subscriptionlevel'] },
  { header: 'Trading Style', field: 'tradingStyle',      aliases: ['tradingstyle', 'style'] },
  { header: 'Role',          field: 'role',              aliases: ['role', 'userrole'] },
];

const normKey = (s) => String(s).toLowerCase().replace(/[^a-z]/g, '');

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    COLUMNS.map((c) => c.header),
    ['Jane', 'Smith', 'jane@example.com', '+15551234567', 'ChangeMe123', 'Monthly', 'Moderate', 'Subscriber'],
  ]);
  ws['!cols'] = COLUMNS.map(() => ({ wch: 18 }));
  const notes = XLSX.utils.aoa_to_sheet([
    ['Column', 'Allowed values'],
    ['Access Level', 'No Access, Trial, Monthly, Annual (blank = No Access)'],
    ['Trading Style', 'Aggressive, Moderate, Conservative (blank = Moderate)'],
    ['Role', 'Subscriber, Admin, Super User (blank = Subscriber)'],
    ['Phone', 'Optional'],
    ['Password', 'Required, at least 6 characters'],
  ]);
  notes['!cols'] = [{ wch: 16 }, { wch: 60 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Users');
  XLSX.utils.book_append_sheet(wb, notes, 'Instructions');
  XLSX.writeFile(wb, 'user_import_template.xlsx');
}

async function parseFile(file) {
  const wb = XLSX.read(await file.arrayBuffer());
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  if (raw.length === 0) throw new Error('The first sheet has no data rows.');

  const headerMap = {};
  for (const h of Object.keys(raw[0])) {
    const col = COLUMNS.find((c) => c.aliases.includes(normKey(h)));
    if (col) headerMap[h] = col.field;
  }
  const missing = COLUMNS.filter((c) => c.field !== 'phone' && !Object.values(headerMap).includes(c.field));
  if (missing.length) throw new Error(`Missing column(s): ${missing.map((c) => c.header).join(', ')}`);

  return raw
    .map((r) => {
      const row = Object.fromEntries(COLUMNS.map((c) => [c.field, '']));
      for (const [h, field] of Object.entries(headerMap)) row[field] = String(r[h] ?? '').trim();
      return row;
    })
    .filter((row) => Object.values(row).some((v) => v !== '')); // drop blank rows
}

export default function BulkImportUsersModal({ onClose, onImported }) {
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [rows,     setRows]     = useState([]);
  const [preview,  setPreview]  = useState(null);  // dry-run response
  const [done,     setDone]     = useState(null);  // import response
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setPreview(null); setDone(null); setRows([]); setFileName(file.name);
    setBusy(true);
    try {
      const parsed = await parseFile(file);
      setRows(parsed);
      const res = await apiFetch('/users/bulk', { method: 'POST', body: JSON.stringify({ users: parsed, dryRun: true }) });
      setPreview(res);
    } catch (err) {
      setError(err.message ?? 'Could not read file.');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  async function handleImport() {
    setError(''); setBusy(true);
    try {
      const res = await apiFetch('/users/bulk', { method: 'POST', body: JSON.stringify({ users: rows, dryRun: false }) });
      setDone(res);
      setPreview(res);
      onImported?.();
    } catch (err) {
      setError(err.message ?? 'Import failed.');
    } finally {
      setBusy(false);
    }
  }

  const results = preview?.results ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-[28px] border border-[var(--c-border)] bg-[var(--c-bg-dropdown)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--c-border)] px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-[var(--c-text-primary)]">Bulk Import Users</h2>
            <p className="mt-0.5 text-xs text-[var(--c-text-muted)]">Upload an Excel file. Rows are checked first — nothing is saved until you click Import.</p>
          </div>
          <button onClick={onClose} className="text-[var(--c-text-dimmed)] hover:text-[var(--c-text-secondary)]">✕</button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={downloadTemplate}
              className="rounded-xl border border-[var(--c-border)] bg-[var(--c-hover)] px-4 py-2 text-sm text-[var(--c-text-secondary)] transition hover:bg-[var(--c-hover-strong)]"
            >
              Download Template
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="rounded-xl border border-cyan-500/50 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-[var(--c-cyan)] transition hover:bg-cyan-500/25 disabled:opacity-50"
            >
              Choose File…
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
            {fileName && <span className="text-sm text-[var(--c-text-muted)]">{fileName}</span>}
            {busy && <span className="text-sm text-[var(--c-text-dimmed)]">Working…</span>}
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-[var(--c-rose-strong)]">{error}</div>
          )}

          {preview && (
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-lg bg-[var(--c-hover)] px-3 py-1 text-[var(--c-text-secondary)]">{preview.total} rows</span>
              <span className="rounded-lg bg-emerald-500/15 px-3 py-1 text-[var(--c-emerald-strong)]">
                {done ? `${done.created} created` : `${preview.valid} ready`}
              </span>
              {preview.invalid > 0 && (
                <span className="rounded-lg bg-rose-500/15 px-3 py-1 text-[var(--c-rose-strong)]">
                  {preview.invalid} {done ? 'skipped' : 'with errors'}
                </span>
              )}
            </div>
          )}

          {results.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-[var(--c-border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--c-border)] text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Access</th>
                    <th className="px-3 py-2 text-left">Style</th>
                    <th className="px-3 py-2 text-left">Role</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const src = rows[r.row] ?? {};
                    return (
                      <tr key={r.row} className="border-b border-[var(--c-border-subtle)] align-top">
                        <td className="px-3 py-2 text-[var(--c-text-dimmed)]">{r.row + 2}</td>
                        <td className="px-3 py-2 text-[var(--c-text-primary)]">{`${src.firstName ?? ''} ${src.lastName ?? ''}`.trim() || '—'}</td>
                        <td className="px-3 py-2 text-[var(--c-text-secondary)]">{src.email || '—'}</td>
                        <td className="px-3 py-2 text-[var(--c-text-muted)]">{src.subscriptionLevel || 'No Access'}</td>
                        <td className="px-3 py-2 text-[var(--c-text-muted)]">{src.tradingStyle || 'Moderate'}</td>
                        <td className="px-3 py-2 text-[var(--c-text-muted)]">{src.role || 'Subscriber'}</td>
                        <td className="px-3 py-2">
                          {r.status === 'error' ? (
                            <ul className="space-y-0.5 text-xs text-[var(--c-rose-strong)]">
                              {r.errors.map((e) => <li key={e}>✕ {e}</li>)}
                            </ul>
                          ) : (
                            <span className="text-xs font-medium text-[var(--c-emerald-strong)]">
                              {r.status === 'created' ? '✓ Created' : '✓ Ready'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-[var(--c-border)] px-6 py-5">
          {!done && (
            <button
              onClick={handleImport}
              disabled={busy || !preview || preview.valid === 0}
              className="flex-1 rounded-xl bg-[var(--c-btn-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--c-btn-text)] transition hover:bg-[var(--c-btn-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {preview?.valid
                ? `Import ${preview.valid} User${preview.valid === 1 ? '' : 's'}${preview.invalid ? ` (skip ${preview.invalid})` : ''}`
                : 'Import'}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--c-border)] bg-[var(--c-hover)] px-4 py-2.5 text-sm text-[var(--c-text-secondary)] transition hover:bg-[var(--c-hover-strong)]"
          >
            {done ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
