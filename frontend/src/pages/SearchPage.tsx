import { useEffect, useState } from 'react';
import { api } from '../api';
import { Search, Download, Filter } from 'lucide-react';

interface Issue {
  id: number; title: string; description: string; status: string; priority: string;
  issue_type: string; story_points: number; due_date: string;
  project_id: number; sprint_id: number | null; assignee_id: number | null;
  project_name: string; sprint_name: string; assignee_name: string;
}
interface Project { id: number; name: string; }
interface Sprint { id: number; name: string; }
interface Member { id: number; name: string; }

const statusColors: Record<string, string> = {
  backlog: 'bg-gray-700 text-gray-300', todo: 'bg-blue-900 text-blue-300',
  in_progress: 'bg-yellow-900 text-yellow-300', done: 'bg-green-900 text-green-300',
  cancelled: 'bg-red-900 text-red-300',
};

export default function SearchPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [team, setTeam] = useState<Member[]>([]);
  const [results, setResults] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    q: '', project_id: '', sprint_id: '', assignee_id: '',
    status: '', priority: '', issue_type: '', min_points: '', max_points: '',
  });

  useEffect(() => {
    Promise.all([api.getProjects(), api.getSprints(), api.getTeam()]).then(([p, s, t]) => {
      setProjects(p); setSprints(s); setTeam(t);
    });
    runSearch({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = async (override?: Partial<typeof filters>) => {
    setLoading(true); setError('');
    try {
      const f = { ...filters, ...(override || {}) };
      const data = await api.searchIssues(f as Record<string, string>);
      setResults(data.results || []);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  const exportCsv = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (k.startsWith('min_') || k.startsWith('max_') || k === 'q') return;
      if (v) params.set(k, v);
    });
    const url = `/api/utils/issues/export.csv${params.toString() ? `?${params}` : ''}`;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Export failed: ' + res.status);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `issues-${Date.now()}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(objUrl);
    } catch (e) { setError(String(e)); }
  };

  const set = (k: keyof typeof filters, v: string) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Search & Filter</h1>
          <p className="text-gray-400 text-sm mt-1">Advanced search across issues with structured filters and CSV export</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={filters.q} onChange={e => set('q', e.target.value)} placeholder="Search title or description..."
            onKeyDown={e => { if (e.key === 'Enter') runSearch(); }}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={filters.project_id} onChange={e => set('project_id', e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filters.sprint_id} onChange={e => set('sprint_id', e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
            <option value="">All Sprints</option>
            {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filters.assignee_id} onChange={e => set('assignee_id', e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
            <option value="">Any Assignee</option>
            {team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={filters.status} onChange={e => set('status', e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
            <option value="">Any Status</option>
            {['backlog','todo','in_progress','done','cancelled'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
          <select value={filters.priority} onChange={e => set('priority', e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
            <option value="">Any Priority</option>
            {['critical','high','medium','low'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filters.issue_type} onChange={e => set('issue_type', e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
            <option value="">Any Type</option>
            {['bug','feature','enhancement','task','design'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="number" placeholder="Min points" value={filters.min_points} onChange={e => set('min_points', e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          <input type="number" placeholder="Max points" value={filters.max_points} onChange={e => set('max_points', e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={() => runSearch()} disabled={loading} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Filter className="w-4 h-4" /> {loading ? 'Searching...' : 'Apply Filters'}
          </button>
          <button onClick={() => { setFilters({ q: '', project_id: '', sprint_id: '', assignee_id: '', status: '', priority: '', issue_type: '', min_points: '', max_points: '' }); runSearch({ q: '', project_id: '', sprint_id: '', assignee_id: '', status: '', priority: '', issue_type: '', min_points: '', max_points: '' }); }} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm">
            Clear
          </button>
        </div>
        {error && <div className="mt-3 text-red-400 text-xs">{error}</div>}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 text-gray-400 text-xs">{results.length} result{results.length === 1 ? '' : 's'}</div>
        <table className="w-full">
          <thead><tr className="border-b border-gray-800">{['Issue','Project','Sprint','Assignee','Status','Priority','Pts'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {results.map(i => (
              <tr key={i.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-4 py-3"><p className="text-white text-sm line-clamp-1 max-w-[260px]">{i.title}</p></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{i.project_name}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{i.sprint_name || '—'}</td>
                <td className="px-4 py-3 text-gray-300 text-sm">{i.assignee_name || <span className="text-gray-600">Unassigned</span>}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[i.status] || 'bg-gray-700 text-gray-300'}`}>{i.status.replace('_',' ')}</span></td>
                <td className="px-4 py-3 text-gray-300 text-xs">{i.priority}</td>
                <td className="px-4 py-3"><span className="w-6 h-6 rounded-full bg-gray-800 inline-flex items-center justify-center text-xs text-gray-300 font-medium">{i.story_points}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {results.length === 0 && !loading && <div className="text-center py-12 text-gray-600">No issues match these filters</div>}
      </div>
    </div>
  );
}
