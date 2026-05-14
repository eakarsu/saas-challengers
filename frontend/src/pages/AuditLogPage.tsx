import { useEffect, useState } from 'react';
import { api } from '../api';
import { ScrollText, Plus, X, RefreshCw } from 'lucide-react';

interface AuditEntry {
  id: number; user_email: string; action: string; entity_type: string;
  entity_id: number | null; details: string | null; created_at: string;
}

const actionColors: Record<string, string> = {
  create: 'bg-green-900 text-green-300',
  update: 'bg-blue-900 text-blue-300',
  delete: 'bg-red-900 text-red-300',
  view: 'bg-gray-700 text-gray-300',
  export: 'bg-violet-900 text-violet-300',
};

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ entity_type: '', action: '' });
  const [form, setForm] = useState({ action: 'create', entity_type: 'issue', entity_id: '', details: '' });

  const load = async () => {
    setLoading(true); setError('');
    try {
      const data = await api.getAuditLog(filters);
      setEntries(data);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAuditEntry({
        action: form.action,
        entity_type: form.entity_type,
        entity_id: form.entity_id ? parseInt(form.entity_id) : null,
        details: form.details || null,
      });
      setShowForm(false);
      setForm({ action: 'create', entity_type: 'issue', entity_id: '', details: '' });
      load();
    } catch (err) { setError(String(err)); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-gray-400 text-sm mt-1">{entries.length} recorded event{entries.length === 1 ? '' : 's'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg text-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Record Event
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <select value={filters.entity_type} onChange={e => setFilters(f => ({ ...f, entity_type: e.target.value }))} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
          <option value="">All Entity Types</option>
          {['issue','project','sprint','team_member','comment','label','export','login'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
          <option value="">All Actions</option>
          {['create','update','delete','view','export'].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button onClick={load} className="bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg text-sm font-medium">Apply Filters</button>
      </div>

      {error && <div className="mb-3 text-red-400 text-xs bg-red-900/20 border border-red-800 rounded p-3">{error}</div>}

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              {['When','Who','Action','Entity','Entity ID','Details'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(e.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-300 text-sm">{e.user_email || 'unknown'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColors[e.action] || 'bg-gray-700 text-gray-300'}`}>{e.action}</span></td>
                <td className="px-4 py-3 text-gray-300 text-sm">{e.entity_type}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{e.entity_id ?? '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-md truncate">{e.details || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-600">
            <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No audit entries yet
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-white font-semibold">Record Audit Event</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Action *</label>
                <select required value={form.action} onChange={e => setForm({ ...form, action: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
                  {['create','update','delete','view','export'].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Entity Type *</label>
                <select required value={form.entity_type} onChange={e => setForm({ ...form, entity_type: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
                  {['issue','project','sprint','team_member','comment','label','export','login'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Entity ID</label>
                <input type="number" value={form.entity_id} onChange={e => setForm({ ...form, entity_id: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Details</label>
                <textarea rows={3} value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg text-sm font-medium">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
