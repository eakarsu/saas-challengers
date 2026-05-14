import { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, Search, Bug, X, Edit2, Trash2, AlertCircle } from 'lucide-react';

interface Issue {
  id: number; project_id: number; sprint_id: number | null; assignee_id: number | null;
  title: string; description: string; status: string; priority: string;
  issue_type: string; story_points: number; due_date: string;
  project_name: string; sprint_name: string; assignee_name: string;
}

const statusColors: Record<string, string> = {
  backlog: 'bg-gray-700 text-gray-300', todo: 'bg-blue-900 text-blue-300',
  in_progress: 'bg-yellow-900 text-yellow-300', done: 'bg-green-900 text-green-300',
  cancelled: 'bg-red-900 text-red-300',
};
const priorityColors: Record<string, string> = {
  critical: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-gray-400',
};
const typeColors: Record<string, string> = {
  bug: 'bg-red-900 text-red-300', feature: 'bg-violet-900 text-violet-300',
  enhancement: 'bg-blue-900 text-blue-300', task: 'bg-gray-700 text-gray-300',
  design: 'bg-pink-900 text-pink-300',
};

function IssueForm({ issue, projects, sprints, team, onSave, onClose }: { issue?: Issue | null; projects: {id:number;name:string}[]; sprints: {id:number;name:string}[]; team: {id:number;name:string}[]; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    project_id: issue?.project_id || '', sprint_id: issue?.sprint_id || '',
    assignee_id: issue?.assignee_id || '', title: issue?.title || '',
    description: issue?.description || '', status: issue?.status || 'backlog',
    priority: issue?.priority || 'medium', issue_type: issue?.issue_type || 'task',
    story_points: issue?.story_points || 1, due_date: issue?.due_date?.split('T')[0] || '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (issue) await api.updateIssue(issue.id, form); else await api.createIssue(form);
      onSave();
    } catch (err) { console.error(err); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">{issue ? 'Edit Issue' : 'New Issue'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Title *</label>
              <input required value={form.title} onChange={e => setForm({...form,title:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Project *</label>
              <select required value={form.project_id} onChange={e => setForm({...form,project_id:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
                <option value="">Select...</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Sprint</label>
              <select value={form.sprint_id} onChange={e => setForm({...form,sprint_id:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
                <option value="">None</option>{sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Assignee</label>
              <select value={form.assignee_id} onChange={e => setForm({...form,assignee_id:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
                <option value="">Unassigned</option>{team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Type</label>
              <select value={form.issue_type} onChange={e => setForm({...form,issue_type:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
                {['bug','feature','enhancement','task','design'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form,status:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
                {['backlog','todo','in_progress','done','cancelled'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm({...form,priority:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
                {['critical','high','medium','low'].map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Story Points</label>
              <select value={form.story_points} onChange={e => setForm({...form,story_points:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
                {[1,2,3,5,8,13,21].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm({...form,due_date:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea rows={3} value={form.description} onChange={e => setForm({...form,description:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg text-sm font-medium">Save</button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [projects, setProjects] = useState<{id:number;name:string}[]>([]);
  const [sprints, setSprints] = useState<{id:number;name:string}[]>([]);
  const [team, setTeam] = useState<{id:number;name:string}[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Issue | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editIssue, setEditIssue] = useState<Issue | null>(null);

  const load = async () => {
    const [i, p, s, t] = await Promise.all([api.getIssues(), api.getProjects(), api.getSprints(), api.getTeam()]);
    setIssues(i); setProjects(p); setSprints(s); setTeam(t);
  };
  useEffect(() => { load(); }, []);

  const filtered = issues.filter(i => i.title?.toLowerCase().includes(search.toLowerCase()) || i.project_name?.toLowerCase().includes(search.toLowerCase()) || i.assignee_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Issues</h1>
          <p className="text-gray-400 text-sm mt-1">{issues.length} issues · {issues.filter(i => i.status === 'in_progress').length} in progress</p>
        </div>
        <button onClick={() => { setEditIssue(null); setShowForm(true); }} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Issue
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search issues..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-800">{['Issue','Project','Sprint','Assignee','Type','Status','Priority','Pts'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(i => (
              <tr key={i.id} onClick={() => setSelected(i)} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Bug className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <p className="text-white text-sm line-clamp-1 max-w-[200px]">{i.title}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{i.project_name}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{i.sprint_name || '—'}</td>
                <td className="px-4 py-3 text-gray-300 text-sm">{i.assignee_name || <span className="text-gray-600">Unassigned</span>}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[i.issue_type] || 'bg-gray-700 text-gray-300'}`}>{i.issue_type}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[i.status] || 'bg-gray-700 text-gray-300'}`}>{i.status.replace('_',' ')}</span></td>
                <td className="px-4 py-3"><span className={`text-xs font-medium ${priorityColors[i.priority] || 'text-gray-400'}`}>{i.priority}</span></td>
                <td className="px-4 py-3"><span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-300 font-medium">{i.story_points}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-600">No issues found</div>}
      </div>
      {selected && !showForm && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-gray-900 border-l border-gray-800 z-40 overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div><h2 className="text-white font-semibold text-lg leading-tight">{selected.title}</h2><p className="text-gray-400 text-sm">{selected.project_name}</p></div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              <button onClick={() => { setEditIssue(selected); setShowForm(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await api.deleteIssue(selected.id); setSelected(null); load(); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selected.status] || 'bg-gray-700 text-gray-300'}`}>{selected.status.replace('_',' ')}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[selected.issue_type] || 'bg-gray-700 text-gray-300'}`}>{selected.issue_type}</span>
              <span className="flex items-center gap-1 text-xs"><AlertCircle className="w-3 h-3" /><span className={priorityColors[selected.priority]}>{selected.priority}</span></span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Story Points', selected.story_points],['Assignee', selected.assignee_name || 'Unassigned'],['Sprint', selected.sprint_name || 'Backlog'],['Due Date', selected.due_date?.split('T')[0] || '—']].map(([l, v]) => (
                <div key={String(l)} className="bg-gray-800 rounded-lg p-3"><p className="text-gray-500 text-xs">{l}</p><p className="text-white font-medium mt-1 text-sm">{v}</p></div>
              ))}
            </div>
            {selected.description && <div><p className="text-gray-500 text-xs mb-1">Description</p><p className="text-gray-300 text-sm leading-relaxed">{selected.description}</p></div>}
          </div>
        </div>
      )}
      {showForm && <IssueForm issue={editIssue} projects={projects} sprints={sprints} team={team} onClose={() => { setShowForm(false); setEditIssue(null); }} onSave={() => { setShowForm(false); setEditIssue(null); setSelected(null); load(); }} />}
    </div>
  );
}
