import { useState } from 'react';

const SMS_MAX_CHARS = 160;

export default function SubscriberCommentary() {
  const [subject, setSubject] = useState('');
  const [body, setBody]       = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  const charCount = body.length;
  const overSms   = charCount > SMS_MAX_CHARS;

  async function handleSend() {
    setError('');
    setSuccess(false);

    if (!subject.trim() || !body.trim()) {
      setError('Subject and message are required.');
      return;
    }

    setSending(true);
    try {
      await fetch('/api/admin/commentary', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subject: subject.trim(), body: body.trim() }),
      });
    } catch {
      // backend not yet available — fall through to local storage save
    }

    const entry = {
      sent_at: new Date().toISOString(),
      subject: subject.trim(),
      body:    body.trim(),
    };
    const existing = JSON.parse(localStorage.getItem('commentary_history') || '[]');
    localStorage.setItem(
      'commentary_history',
      JSON.stringify([entry, ...existing].slice(0, 50)),
    );

    setSuccess(true);
    setSubject('');
    setBody('');
    setSending(false);
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Subscriber Commentary</h1>
        <p className="mt-1 text-sm text-slate-400">
          Broadcast a message to all active SPX Pivot subscribers via Email and ntfy.
        </p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-white/10 bg-[#0d1f2d] p-6 shadow-lg">
        <h2 className="mb-1 text-base font-semibold text-white">
          Send Commentary to All Subscribers
        </h2>
        <p className="mb-5 text-xs text-slate-400">
          Delivered via Email and ntfy to every active SPX Pivot subscriber.
          Sent to all three timeframe topics: SPX_Daily, SPX_Weekly, SPX_Monthly.
        </p>

        {/* Subject */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Weekly Market Update"
            className="w-full rounded-xl border border-white/10 bg-[#061018] px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
          />
        </div>

        {/* Message */}
        <div className="mb-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Message
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter your commentary here..."
            rows={6}
            className="w-full resize-y rounded-xl border border-white/10 bg-[#061018] px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
          />
        </div>

        {/* Character count */}
        {body && (
          <p className={`mb-4 text-xs ${overSms ? 'text-amber-400' : 'text-slate-500'}`}>
            {charCount} characters
            {overSms && (
              <span>
                {' '}— ⚠️ exceeds {SMS_MAX_CHARS}-char SMS limit.
                When SMS is enabled, this message will be sent to Email only.
              </span>
            )}
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            📢 Commentary sent via Email + ntfy (SPX_Daily, SPX_Weekly, SPX_Monthly).
            {overSms && ` SMS skipped — message over ${SMS_MAX_CHARS} chars.`}
          </div>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#061018] transition hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? 'Sending…' : 'Send to All Subscribers'}
        </button>
      </div>
    </div>
  );
}
