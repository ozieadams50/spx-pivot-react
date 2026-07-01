import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL;

const PERIOD_UNITS = ['minutes', 'hours', 'days', 'months'];

function badge(status) {
  const map = {
    active:    'bg-green-600',
    pending:   'bg-yellow-600',
    grace:     'bg-orange-600',
    suspended: 'bg-red-700',
    cancelled: 'bg-gray-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${map[status] ?? 'bg-gray-500'}`}>
      {status}
    </span>
  );
}

function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString();
}

// ── Signal Admin ─────────────────────────────────────────────────────────────
function SignalAdmin({ token }) {
  const [form, setForm]       = useState({ gex: '', spx_moc: '', mag7_moc: '', direction: '', notes: '' });
  const [tradeDay, setTradeDay] = useState(null);   // null=not set, true=yes, false=no
  const [current, setCurrent] = useState(null);
  const [msg, setMsg]         = useState('');

  const load = useCallback(async () => {
    const r = await fetch(`${API}/cp/admin/signal/current`, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) setCurrent(await r.json());
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function broadcast() {
    setMsg('');
    const body = {
      gex:       form.gex       ? parseFloat(form.gex)   : null,
      spx_moc:   form.spx_moc   ? parseInt(form.spx_moc)  : null,
      mag7_moc:  form.mag7_moc  ? parseInt(form.mag7_moc) : null,
      direction: form.direction || null,
      trade_day: tradeDay,
      notes:     form.notes     || null,
    };
    const r = await fetch(`${API}/cp/admin/signal`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      setMsg('Signal broadcast to all connected desktop apps.');
      load();
    } else {
      setMsg('Error: ' + (await r.text()));
    }
  }

  return (
    <div className="space-y-6">
      {/* Current signal */}
      {current && current.id && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400 mb-2">Current Signal — {current.signal_date}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'GEX',     value: current.gex      ?? '—' },
              { label: 'SPX MOC', value: current.spx_moc  != null ? `$${current.spx_moc.toLocaleString()}` : '—' },
              { label: 'MAG7 MOC',value: current.mag7_moc != null ? `$${current.mag7_moc.toLocaleString()}` : '—' },
              { label: 'Direction',value: current.direction ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-900 rounded p-3">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-lg font-semibold text-white">{String(value)}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm">
            Trade Day:{' '}
            {current.trade_day === 1
              ? <span className="text-green-400 font-bold">YES</span>
              : current.trade_day === 0
              ? <span className="text-red-400 font-bold">NO</span>
              : <span className="text-gray-400">—</span>}
          </p>
        </div>
      )}

      {/* Input form */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-white font-semibold mb-4">Set &amp; Broadcast Signal</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {[
            { key: 'gex',      label: 'GEX',      placeholder: '-0.35' },
            { key: 'spx_moc',  label: 'SPX MOC ($)', placeholder: '1500000000' },
            { key: 'mag7_moc', label: 'MAG7 MOC ($)', placeholder: '200000000' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1">{label}</label>
              <input
                className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm"
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Direction</label>
            <select
              className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm"
              value={form.direction}
              onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}
            >
              <option value="">— not set —</option>
              <option value="CALL">CALL</option>
              <option value="PUT">PUT</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes</label>
            <input
              className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optional notes"
            />
          </div>
        </div>

        {/* Trade day toggle */}
        <div className="flex gap-3 mb-4">
          <span className="text-sm text-gray-300 self-center">Trade Day:</span>
          {[{ label: 'Not Set', val: null }, { label: 'YES', val: true }, { label: 'NO', val: false }].map(({ label, val }) => (
            <button
              key={label}
              onClick={() => setTradeDay(val)}
              className={`px-4 py-1.5 rounded text-sm font-semibold border transition
                ${tradeDay === val
                  ? val === true  ? 'bg-green-600 border-green-500 text-white'
                  : val === false ? 'bg-red-700 border-red-600 text-white'
                  : 'bg-gray-600 border-gray-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={broadcast}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition"
        >
          Broadcast Signal to All Connected Apps
        </button>
        {msg && <p className="mt-2 text-sm text-green-400">{msg}</p>}
      </div>
    </div>
  );
}

// ── EOD Config Editor (inline per subscriber) ─────────────────────────────────
function EODConfigEditor({ token, sub, onSaved }) {
  const [form, setForm] = useState({
    default_debit:  sub.default_debit  ?? 1.00,
    take_profit:    sub.take_profit    ?? 3.00,
    stop_loss:      sub.stop_loss      ?? 0.40,
    stop_limit:     sub.stop_limit     ?? 0.00,
    risk_type:      sub.risk_type      ?? 'contracts',
    risk_value:     sub.risk_value     ?? 1,
    strike_offset:  sub.strike_offset  ?? 0,
    one_trade_max:  sub.one_trade_max  ?? 1,
  });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');

  async function save() {
    setSaving(true); setMsg('');
    const r = await fetch(`${API}/cp/admin/subscribers/${sub.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        default_debit:  parseFloat(form.default_debit)  || 0,
        take_profit:    parseFloat(form.take_profit)     || 0,
        stop_loss:      parseFloat(form.stop_loss)       || 0,
        stop_limit:     parseFloat(form.stop_limit)      || 0,
        risk_type:      form.risk_type,
        risk_value:     parseFloat(form.risk_value)      || 1,
        strike_offset:  parseInt(form.strike_offset)     || 0,
        one_trade_max:  parseInt(form.one_trade_max)     || 1,
      }),
    });
    if (r.ok) { setMsg('Saved'); onSaved?.(); }
    else setMsg('Error: ' + await r.text());
    setSaving(false);
  }

  function Inp({ field, label, step = '0.01', min = '0' }) {
    return (
      <div>
        <label className="block text-xs text-gray-400 mb-1">{label}</label>
        <input
          type="number" step={step} min={min}
          className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm"
          value={form[field]}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        />
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-700">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">End of Day Configuration</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <Inp field="default_debit" label="Default Entry ($)" />
        <Inp field="take_profit"   label="Take Profit ($)" />
        <Inp field="stop_loss"     label="Stop Loss Trigger ($)" />
        <Inp field="stop_limit"    label="Stop Loss Limit ($)" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Position Size Type</label>
          <select
            className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm"
            value={form.risk_type}
            onChange={e => setForm(f => ({ ...f, risk_type: e.target.value }))}
          >
            <option value="contracts">Contracts</option>
            <option value="dollar">Dollar at Risk</option>
          </select>
        </div>
        <Inp field="risk_value"    label={form.risk_type === 'contracts' ? 'Num Contracts' : 'Dollar at Risk ($)'}
             step={form.risk_type === 'contracts' ? '1' : '100'} min="1" />
        <Inp field="strike_offset" label="Strike Offset (ATM=0)" step="1" min="0" />
        <Inp field="one_trade_max" label="Max Trades / Day" step="1" min="1" />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={save} disabled={saving}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded transition"
        >
          {saving ? 'Saving…' : 'Save EOD Config'}
        </button>
        {msg && <span className={`text-sm ${msg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{msg}</span>}
      </div>
    </div>
  );
}

// ── Subscriber list ───────────────────────────────────────────────────────────
function SubscriberList({ token, refresh }) {
  const [subs,    setSubs]    = useState([]);
  const [code,    setCode]    = useState({});   // sid → code string after purchase sim
  const [msg,     setMsg]     = useState({});
  const [showEod, setShowEod] = useState({});   // sid → bool

  const load = useCallback(async () => {
    const r = await fetch(`${API}/cp/admin/subscribers`, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) setSubs(await r.json());
  }, [token]);

  useEffect(() => { load(); }, [load, refresh]);

  async function simulate(action, sid) {
    setMsg(m => ({ ...m, [sid]: '' }));
    const r = await fetch(`${API}/cp/admin/simulate/${action}/${sid}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await r.json();
    if (r.ok) {
      if (action === 'purchase' && data.registration_code) {
        setCode(c => ({ ...c, [sid]: data.registration_code }));
      }
      setMsg(m => ({ ...m, [sid]: JSON.stringify(data) }));
      load();
    } else {
      setMsg(m => ({ ...m, [sid]: 'Error: ' + JSON.stringify(data) }));
    }
  }

  if (!subs.length) return <p className="text-gray-400 text-sm">No subscribers yet.</p>;

  return (
    <div className="space-y-3">
      {subs.map(s => (
        <div key={s.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div>
              <span className="text-white font-semibold mr-2">{s.email}</span>
              {badge(s.status)}
            </div>
            <span className="text-xs text-gray-400">
              {s.period_value} {s.period_unit} &nbsp;|&nbsp; ends {fmt(s.subscription_end)}
            </span>
          </div>

          {code[s.id] && (
            <div className="mb-2 bg-yellow-900/40 border border-yellow-700 rounded px-3 py-2">
              <p className="text-xs text-yellow-400 mb-0.5">Registration Code (share with subscriber):</p>
              <p className="text-xl font-mono font-bold text-yellow-300 tracking-widest">{code[s.id]}</p>
              <p className="text-xs text-gray-400 mt-0.5">Single-use · expires 48h</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { label: 'Simulate Purchase',   action: 'purchase'  },
              { label: 'Simulate Renewal',    action: 'renewal'   },
              { label: 'Simulate Grace',      action: 'grace'     },
              { label: 'Simulate Cancel',     action: 'cancel'    },
            ].map(({ label, action }) => (
              <button
                key={action}
                onClick={() => simulate(action, s.id)}
                className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600 transition"
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setShowEod(x => ({ ...x, [s.id]: !x[s.id] }))}
              className="px-3 py-1 text-xs bg-indigo-800 hover:bg-indigo-700 text-white rounded border border-indigo-600 transition"
            >
              {showEod[s.id] ? 'Hide EOD Config' : 'EOD Config'}
            </button>
          </div>
          {msg[s.id] && <p className="mt-2 text-xs text-gray-300 font-mono break-all">{msg[s.id]}</p>}
          {showEod[s.id] && (
            <EODConfigEditor token={token} sub={s} onSaved={load} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Create subscriber form ────────────────────────────────────────────────────
function CreateSubscriber({ token, onCreated }) {
  const [form, setForm] = useState({ email: '', period_unit: 'months', period_value: 1, notes: '' });
  const [msg,  setMsg]  = useState('');

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    const r = await fetch(`${API}/cp/admin/subscribers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, period_value: parseInt(form.period_value) }),
    });
    const data = await r.json();
    if (r.ok) {
      setMsg(`Created: ${data.email}`);
      setForm({ email: '', period_unit: 'months', period_value: 1, notes: '' });
      onCreated();
    } else {
      setMsg('Error: ' + JSON.stringify(data));
    }
  }

  return (
    <form onSubmit={submit} className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-3">
      <h3 className="text-white font-semibold">Add Test Subscriber</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-400 mb-1">Email</label>
          <input
            required
            type="email"
            className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="subscriber@email.com"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Period</label>
          <select
            className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm"
            value={form.period_unit}
            onChange={e => setForm(f => ({ ...f, period_unit: e.target.value }))}
          >
            {PERIOD_UNITS.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Value</label>
          <input
            type="number"
            min="1"
            className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm"
            value={form.period_value}
            onChange={e => setForm(f => ({ ...f, period_value: e.target.value }))}
          />
        </div>
      </div>
      <input
        className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm"
        value={form.notes}
        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        placeholder="Notes (optional)"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition"
      >
        Create Subscriber
      </button>
      {msg && <p className="text-sm text-green-400">{msg}</p>}
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS = ['Signal Admin', 'Subscribers', 'Simulator'];

export default function ClosingPrintAdmin() {
  const { token } = useAuth();
  const [tab, setTab]       = useState('Signal Admin');
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Closing Print Admin</h1>
        <p className="text-gray-400 text-sm mt-1">Manage subscribers, subscription lifecycle, and signal broadcasts.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition
              ${tab === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Signal Admin' && <SignalAdmin token={token} />}

      {tab === 'Subscribers' && (
        <SubscriberList token={token} refresh={refresh} />
      )}

      {tab === 'Simulator' && (
        <div className="space-y-6">
          <CreateSubscriber token={token} onCreated={() => setRefresh(r => r + 1)} />
          <div>
            <h3 className="text-white font-semibold mb-3">All Subscribers</h3>
            <SubscriberList token={token} refresh={refresh} />
          </div>
        </div>
      )}
    </div>
  );
}
