import { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, Search, Tag, X, Edit2, Trash2 } from 'lucide-react';

interface Label {
  id: number; name: string; color: string; description: string;
  project_id: number | null; project_name: string; usage_count: number;
}

const colorOptions = [
  'bg-red-500','bg-orange-500','bg-yellow-500','bg-green-500','bg-blue-500',
  'bg-violet-500','bg-purple-500','bg-pink-500','bg-teal-500','bg-cyan-500',
  'bg-indigo-500','bg-gray-500','bg-rose-600','bg-lime-500','bg-amber-500','bg-gray-600',
];

function LabelForm({ label, projects, onSave, onClose }: { label?: Label | null; projects: {id:number;name:string}[]; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: label?.name || '', color: label?.color || 'bg-gray-500',
    description: label?.description || '', project_id: label?.project_id || '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (label) await api.updateLabel(label.id, form); else await api.createLabel(form);
      onSave();
    } catch (err) { console.error(err); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">{label ? 'Edit Label' : 'New Label'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="block text-xs text-gray-400 mb-1">Name *</label>
            <input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
          <div><label className="block text-xs text-gray-400 mb-1">Project</label>
            <select value={form.project_id} onChange={e => setForm({...form,project_id:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
              <option value="">Global</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="block text-xs text-gray-400 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map(c => (
                <button key={c} type="button" onClick={() => setForm({...form,color:c})}
                  className={`w-7 h-7 rounded-full ${c} transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-110' : 'hover:scale-105'}`} />
              ))}
            </div>
          </div>
          <div><label className="block text-xs text-gray-400 mb-1">Description</label>
            <input value={form.description} onChange={e => setForm({...form,description:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg text-sm font-medium">Save</button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LabelsPage() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [projects, setProjects] = useState<{id:number;name:string}[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Label | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editLabel, setEditLabel] = useState<Label | null>(null);

  const load = async () => {
    const [l, p] = await Promise.all([api.getLabels(), api.getProjects()]);
    setLabels(l); setProjects(p);
  };
  useEffect(() => { load(); }, []);

  const filtered = labels.filter(l => l.name?.toLowerCase().includes(search.toLowerCase()) || l.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Labels</h1>
          <p className="text-gray-400 text-sm mt-1">{labels.length} labels defined</p>
        </div>
        <button onClick={() => { setEditLabel(null); setShowForm(true); }} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Label
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search labels..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(l => (
          <div key={l.id} onClick={() => setSelected(l)} className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-violet-600 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${l.color}`} />
                <span className="text-white font-medium text-sm">{l.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={e => { e.stopPropagation(); setEditLabel(l); setShowForm(true); }} className="p-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded"><Edit2 className="w-3 h-3" /></button>
                <button onClick={async e => { e.stopPropagation(); if (!confirm('Delete?')) return; await api.deleteLabel(l.id); load(); }} className="p-1 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
            <p className="text-gray-500 text-xs mb-2">{l.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{l.project_name || 'Global'}</span>
              <span>{l.usage_count} uses</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-3 text-center py-12 text-gray-600 bg-gray-900 rounded-xl border border-gray-800">No labels found</div>}
      </div>
      {selected && !showForm && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-gray-900 border-l border-gray-800 z-40 overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full ${selected.color}`} />
              <div><h2 className="text-white font-semibold text-lg">{selected.name}</h2><p className="text-gray-400 text-sm">{selected.project_name || 'Global label'}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditLabel(selected); setShowForm(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await api.deleteLabel(selected.id); setSelected(null); load(); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[['Usage Count', selected.usage_count],['Project', selected.project_name || 'Global']].map(([l, v]) => (
                <div key={String(l)} className="bg-gray-800 rounded-lg p-3"><p className="text-gray-500 text-xs">{l}</p><p className="text-white font-medium mt-1 text-sm">{v}</p></div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium text-white ${selected.color}`}>{selected.name}</span>
            </div>
            {selected.description && <div><p className="text-gray-500 text-xs mb-1">Description</p><p className="text-gray-300 text-sm">{selected.description}</p></div>}
          </div>
        </div>
      )}
      {showForm && <LabelForm label={editLabel} projects={projects} onClose={() => { setShowForm(false); setEditLabel(null); }} onSave={() => { setShowForm(false); setEditLabel(null); setSelected(null); load(); }} />}
    </div>
  );
}
