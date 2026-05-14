import { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, Search, FolderKanban, X, Edit2, Trash2 } from 'lucide-react';

interface Project {
  id: number; name: string; description: string; status: string; priority: string;
  start_date: string; end_date: string; owner: string; tech_stack: string;
  repository_url: string; issue_count: number; sprint_count: number;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-900 text-green-300', planned: 'bg-blue-900 text-blue-300',
  paused: 'bg-yellow-900 text-yellow-300', completed: 'bg-gray-700 text-gray-400',
  cancelled: 'bg-red-900 text-red-300',
};
const priorityColors: Record<string, string> = {
  critical: 'bg-red-900 text-red-300', high: 'bg-orange-900 text-orange-300',
  medium: 'bg-yellow-900 text-yellow-300', low: 'bg-gray-700 text-gray-400',
};

function ProjectForm({ project, onSave, onClose }: { project?: Project | null; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: project?.name || '', description: project?.description || '',
    status: project?.status || 'active', priority: project?.priority || 'medium',
    start_date: project?.start_date?.split('T')[0] || '', end_date: project?.end_date?.split('T')[0] || '',
    owner: project?.owner || '', tech_stack: project?.tech_stack || '', repository_url: project?.repository_url || '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (project) await api.updateProject(project.id, form); else await api.createProject(form);
      onSave();
    } catch (err) { console.error(err); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Name *</label>
              <input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form,status:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
                {['active','planned','paused','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm({...form,priority:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
                {['critical','high','medium','low'].map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm({...form,start_date:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">End Date</label>
              <input type="date" value={form.end_date} onChange={e => setForm({...form,end_date:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Owner</label>
              <input value={form.owner} onChange={e => setForm({...form,owner:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Tech Stack</label>
              <input value={form.tech_stack} onChange={e => setForm({...form,tech_stack:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Repository URL</label>
              <input value={form.repository_url} onChange={e => setForm({...form,repository_url:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm({...form,description:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  const load = async () => { setProjects(await api.getProjects()); };
  useEffect(() => { load(); }, []);

  const filtered = projects.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.owner?.toLowerCase().includes(search.toLowerCase()) || p.tech_stack?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 text-sm mt-1">{projects.length} projects · {projects.filter(p => p.status === 'active').length} active</p>
        </div>
        <button onClick={() => { setEditProject(null); setShowForm(true); }} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.id} onClick={() => setSelected(p)} className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-violet-600 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <p className="text-white font-medium text-sm leading-tight">{p.name}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ml-2 ${priorityColors[p.priority] || 'bg-gray-700 text-gray-300'}`}>{p.priority}</span>
            </div>
            <p className="text-gray-500 text-xs mb-3 line-clamp-2">{p.description}</p>
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[p.status] || 'bg-gray-700 text-gray-300'}`}>{p.status}</span>
              <span className="text-gray-500 text-xs">{p.owner}</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-center">
              <div className="bg-gray-800 rounded p-1.5"><p className="text-white font-bold text-xs">{p.issue_count}</p><p className="text-gray-600 text-xs">Issues</p></div>
              <div className="bg-gray-800 rounded p-1.5"><p className="text-violet-300 font-bold text-xs">{p.sprint_count}</p><p className="text-gray-600 text-xs">Sprints</p></div>
            </div>
          </div>
        ))}
      </div>
      {selected && !showForm && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-gray-900 border-l border-gray-800 z-40 overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div><h2 className="text-white font-semibold text-lg">{selected.name}</h2><p className="text-gray-400 text-sm">{selected.owner}</p></div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditProject(selected); setShowForm(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await api.deleteProject(selected.id); setSelected(null); load(); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selected.status] || 'bg-gray-700 text-gray-300'}`}>{selected.status}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[selected.priority] || 'bg-gray-700 text-gray-300'}`}>{selected.priority}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Issues', selected.issue_count],['Sprints', selected.sprint_count],['Start', selected.start_date?.split('T')[0]],['End', selected.end_date?.split('T')[0]]].map(([l, v]) => (
                <div key={String(l)} className="bg-gray-800 rounded-lg p-3"><p className="text-gray-500 text-xs">{l}</p><p className="text-white font-medium mt-1 text-sm">{v}</p></div>
              ))}
            </div>
            {selected.tech_stack && <div><p className="text-gray-500 text-xs mb-1">Tech Stack</p><p className="text-gray-300 text-sm font-mono">{selected.tech_stack}</p></div>}
            {selected.repository_url && <div><p className="text-gray-500 text-xs mb-1">Repository</p><a href={selected.repository_url} target="_blank" rel="noreferrer" className="text-violet-400 text-sm hover:underline">{selected.repository_url}</a></div>}
            {selected.description && <div><p className="text-gray-500 text-xs mb-1">Description</p><p className="text-gray-300 text-sm">{selected.description}</p></div>}
          </div>
        </div>
      )}
      {showForm && <ProjectForm project={editProject} onClose={() => { setShowForm(false); setEditProject(null); }} onSave={() => { setShowForm(false); setEditProject(null); setSelected(null); load(); }} />}
    </div>
  );
}
