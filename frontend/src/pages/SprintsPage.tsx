import { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, Search, Zap, X, Edit2, Trash2 } from 'lucide-react';

interface Sprint {
  id: number; project_id: number; name: string; goal: string; status: string;
  start_date: string; end_date: string; velocity: number; project_name: string;
  issue_count: number; total_points: number; completed_points: number;
}

const statusColors: Record<string, string> = {
  planned: 'bg-blue-900 text-blue-300', active: 'bg-green-900 text-green-300',
  completed: 'bg-gray-700 text-gray-400', cancelled: 'bg-red-900 text-red-300',
};

function SprintForm({ sprint, projects, onSave, onClose }: { sprint?: Sprint | null; projects: {id:number;name:string}[]; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    project_id: sprint?.project_id || '', name: sprint?.name || '', goal: sprint?.goal || '',
    status: sprint?.status || 'planned', start_date: sprint?.start_date?.split('T')[0] || '',
    end_date: sprint?.end_date?.split('T')[0] || '', velocity: sprint?.velocity || 0,
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (sprint) await api.updateSprint(sprint.id, form); else await api.createSprint(form);
      onSave();
    } catch (err) { console.error(err); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">{sprint ? 'Edit Sprint' : 'New Sprint'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Project *</label>
              <select required value={form.project_id} onChange={e => setForm({...form,project_id:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
                <option value="">Select project...</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Sprint Name *</label>
              <input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form,status:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
                {['planned','active','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Velocity</label>
              <input type="number" value={form.velocity} onChange={e => setForm({...form,velocity:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm({...form,start_date:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">End Date</label>
              <input type="date" value={form.end_date} onChange={e => setForm({...form,end_date:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Sprint Goal</label>
              <textarea rows={2} value={form.goal} onChange={e => setForm({...form,goal:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
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

export default function SprintsPage() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projects, setProjects] = useState<{id:number;name:string}[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Sprint | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editSprint, setEditSprint] = useState<Sprint | null>(null);

  const load = async () => {
    const [s, p] = await Promise.all([api.getSprints(), api.getProjects()]);
    setSprints(s); setProjects(p);
  };
  useEffect(() => { load(); }, []);

  const filtered = sprints.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.project_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sprints</h1>
          <p className="text-gray-400 text-sm mt-1">{sprints.length} sprints · {sprints.filter(s => s.status === 'active').length} active</p>
        </div>
        <button onClick={() => { setEditSprint(null); setShowForm(true); }} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Sprint
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sprints..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-800">{['Sprint','Project','Status','Start','End','Issues','Points','Velocity'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} onClick={() => setSelected(s)} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><Zap className="w-4 h-4 text-violet-400" /><p className="text-white text-sm">{s.name}</p></div></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{s.project_name}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[s.status] || 'bg-gray-700 text-gray-300'}`}>{s.status}</span></td>
                <td className="px-4 py-3 text-gray-500 text-sm">{s.start_date?.split('T')[0]}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{s.end_date?.split('T')[0]}</td>
                <td className="px-4 py-3 text-gray-300 text-sm">{s.issue_count}</td>
                <td className="px-4 py-3 text-gray-300 text-sm"><span className="text-violet-300">{s.completed_points}</span>/{s.total_points}</td>
                <td className="px-4 py-3 text-green-400 text-sm font-medium">{s.velocity > 0 ? s.velocity : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-600">No sprints found</div>}
      </div>
      {selected && !showForm && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-gray-900 border-l border-gray-800 z-40 overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div><h2 className="text-white font-semibold text-lg">{selected.name}</h2><p className="text-gray-400 text-sm">{selected.project_name}</p></div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditSprint(selected); setShowForm(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await api.deleteSprint(selected.id); setSelected(null); load(); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selected.status] || 'bg-gray-700 text-gray-300'}`}>{selected.status}</span>
            <div className="grid grid-cols-2 gap-3">
              {[['Issues', selected.issue_count],['Total Points', selected.total_points],['Completed', selected.completed_points],['Velocity', selected.velocity || '—'],['Start', selected.start_date?.split('T')[0]],['End', selected.end_date?.split('T')[0]]].map(([l, v]) => (
                <div key={String(l)} className="bg-gray-800 rounded-lg p-3"><p className="text-gray-500 text-xs">{l}</p><p className="text-white font-medium mt-1 text-sm">{v}</p></div>
              ))}
            </div>
            {selected.goal && <div><p className="text-gray-500 text-xs mb-1">Sprint Goal</p><p className="text-gray-300 text-sm">{selected.goal}</p></div>}
          </div>
        </div>
      )}
      {showForm && <SprintForm sprint={editSprint} projects={projects} onClose={() => { setShowForm(false); setEditSprint(null); }} onSave={() => { setShowForm(false); setEditSprint(null); setSelected(null); load(); }} />}
    </div>
  );
}
