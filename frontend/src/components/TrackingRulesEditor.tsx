import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Bell, Plus, Trash2, Save, RefreshCw } from 'lucide-react';

interface Rule {
  id: number; name: string; metric: string; operator: string;
  threshold: number | null; severity: string; enabled: boolean; notes: string | null;
}

const METRICS = ['arr_millions', 'total_funding_millions', 'capital_efficiency', 'vulnerability_index', 'list_price_per_seat_usd', 'fte_per_million_arr', 'customer_count'];
const OPERATORS = ['>', '>=', '<', '<=', '='];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];

export default function TrackingRulesEditor() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [draft, setDraft] = useState({ name: '', metric: 'arr_millions', operator: '>', threshold: 0, severity: 'medium', enabled: true, notes: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true); setErr('');
    try {
      const r = await apiFetch('/custom-views/tracking-rules');
      setRules(r.rules || []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!draft.name) { setErr('Name required'); return; }
    setErr('');
    try {
      await apiFetch('/custom-views/tracking-rules', { method: 'POST', body: JSON.stringify(draft) });
      setDraft({ name: '', metric: 'arr_millions', operator: '>', threshold: 0, severity: 'medium', enabled: true, notes: '' });
      load();
    } catch (e: any) { setErr(e.message); }
  }

  async function update(r: Rule) {
    try {
      await apiFetch(`/custom-views/tracking-rules/${r.id}`, { method: 'PUT', body: JSON.stringify(r) });
      load();
    } catch (e: any) { setErr(e.message); }
  }

  async function remove(id: number) {
    try {
      await apiFetch(`/custom-views/tracking-rules/${id}`, { method: 'DELETE' });
      load();
    } catch (e: any) { setErr(e.message); }
  }

  function patch(id: number, p: Partial<Rule>) {
    setRules(rs => rs.map(r => r.id === id ? { ...r, ...p } : r));
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-bold text-white">Tracking Rules Editor</h2>
          <span className="text-xs text-gray-500">{rules.length} rules</span>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {err && <div className="text-red-400 text-sm mb-2 p-2 bg-red-950 border border-red-900 rounded">{err}</div>}
      {loading && <div className="text-gray-400 text-sm mb-2">Loading…</div>}

      <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 mb-4">
        <div className="text-xs text-gray-400 mb-2 font-bold">New rule</div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
          <input placeholder="Name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white col-span-2" />
          <select value={draft.metric} onChange={e => setDraft({ ...draft, metric: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white">
            {METRICS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={draft.operator} onChange={e => setDraft({ ...draft, operator: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white">
            {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <input type="number" placeholder="Threshold" value={draft.threshold}
            onChange={e => setDraft({ ...draft, threshold: Number(e.target.value) })}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white" />
          <select value={draft.severity} onChange={e => setDraft({ ...draft, severity: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white">
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={create} className="mt-2 bg-violet-600 hover:bg-violet-700 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1">
          <Plus className="w-3 h-3" />Add Rule
        </button>
      </div>

      <div className="space-y-2">
        {rules.map(r => (
          <div key={r.id} className="grid grid-cols-2 md:grid-cols-8 gap-2 items-center bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs">
            <input value={r.name} onChange={e => patch(r.id, { name: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white col-span-2" />
            <select value={r.metric} onChange={e => patch(r.id, { metric: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white">
              {METRICS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={r.operator} onChange={e => patch(r.id, { operator: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white">
              {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <input type="number" value={r.threshold ?? 0} onChange={e => patch(r.id, { threshold: Number(e.target.value) })}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white" />
            <select value={r.severity} onChange={e => patch(r.id, { severity: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white">
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className="flex items-center gap-1 text-gray-300">
              <input type="checkbox" checked={!!r.enabled} onChange={e => patch(r.id, { enabled: e.target.checked })} />
              on
            </label>
            <div className="flex gap-1 justify-end">
              <button onClick={() => update(r)} className="bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1"><Save className="w-3 h-3" /></button>
              <button onClick={() => remove(r.id)} className="bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
        {!rules.length && !loading && <div className="text-gray-500 text-sm text-center py-4">No rules yet.</div>}
      </div>
    </div>
  );
}
