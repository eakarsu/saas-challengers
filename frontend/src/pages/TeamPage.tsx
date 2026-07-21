import { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, Search, X, Edit2, Trash2 } from 'lucide-react';

interface Member {
  id: number; name: string; email: string; role: string; avatar_color: string;
  department: string; time_zone: string; joined_date: string; active: boolean;
  github_handle: string; total_issues: number; open_issues: number;
}

const avatarColors = ['bg-violet-500','bg-blue-500','bg-green-500','bg-orange-500','bg-pink-500','bg-teal-500','bg-yellow-500','bg-red-500','bg-indigo-500','bg-purple-500','bg-cyan-500','bg-lime-500'];

function MemberForm({ member, onSave, onClose }: { member?: Member | null; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: member?.name || '', email: member?.email || '', role: member?.role || '',
    avatar_color: member?.avatar_color || 'bg-violet-500', department: member?.department || '',
    time_zone: member?.time_zone || '', joined_date: member?.joined_date?.split('T')[0] || '',
    active: member?.active !== false, github_handle: member?.github_handle || '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (member) await api.updateMember(member.id, form); else await api.createMember(form);
      onSave();
    } catch (err) { console.error(err); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">{member ? 'Edit Member' : 'New Team Member'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Name *</label>
              <input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Role</label>
              <input value={form.role} onChange={e => setForm({...form,role:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Department</label>
              <input value={form.department} onChange={e => setForm({...form,department:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Time Zone</label>
              <input value={form.time_zone} onChange={e => setForm({...form,time_zone:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Joined Date</label>
              <input type="date" value={form.joined_date} onChange={e => setForm({...form,joined_date:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">GitHub Handle</label>
              <input value={form.github_handle} onChange={e => setForm({...form,github_handle:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Avatar Color</label>
              <select value={form.avatar_color} onChange={e => setForm({...form,avatar_color:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
                {avatarColors.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="act" checked={form.active} onChange={e => setForm({...form,active:e.target.checked})} className="rounded bg-gray-800 border-gray-700" />
              <label htmlFor="act" className="text-sm text-gray-300">Active</label>
            </div>
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

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Member | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);

  const load = async () => { setMembers(await api.getTeam()); };
  useEffect(() => { load(); }, []);

  const filtered = members.filter(m => m.name?.toLowerCase().includes(search.toLowerCase()) || m.role?.toLowerCase().includes(search.toLowerCase()) || m.department?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Members</h1>
          <p className="text-gray-400 text-sm mt-1">{members.length} members · {members.filter(m => m.active).length} active</p>
        </div>
        <button onClick={() => { setEditMember(null); setShowForm(true); }} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team members..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(m => (
          <div key={m.id} onClick={() => setSelected(m)} className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-violet-600 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full ${m.avatar_color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                {m.name.split(' ').map(n => n[0]).join('').slice(0,2)}
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium text-sm">{m.name}</p>
                <p className="text-gray-500 text-xs truncate">{m.role}</p>
              </div>
              {m.active && <div className="ml-auto w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />}
            </div>
            <p className="text-gray-500 text-xs mb-2">{m.department} · {m.time_zone}</p>
            <div className="grid grid-cols-2 gap-1 text-center">
              <div className="bg-gray-800 rounded p-1.5"><p className="text-white font-bold text-xs">{m.total_issues}</p><p className="text-gray-600 text-xs">Total</p></div>
              <div className="bg-gray-800 rounded p-1.5"><p className="text-violet-300 font-bold text-xs">{m.open_issues}</p><p className="text-gray-600 text-xs">Open</p></div>
            </div>
          </div>
        ))}
      </div>
      {selected && !showForm && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-gray-900 border-l border-gray-800 z-40 overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${selected.avatar_color} flex items-center justify-center text-white font-bold`}>
                {selected.name.split(' ').map(n => n[0]).join('').slice(0,2)}
              </div>
              <div><h2 className="text-white font-semibold text-lg">{selected.name}</h2><p className="text-gray-400 text-sm">{selected.role}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditMember(selected); setShowForm(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await api.deleteMember(selected.id); setSelected(null); load(); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${selected.active ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>{selected.active ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Department', selected.department],['Time Zone', selected.time_zone],['Total Issues', selected.total_issues],['Open Issues', selected.open_issues],['GitHub', selected.github_handle ? `@${selected.github_handle}` : '—'],['Joined', selected.joined_date?.split('T')[0]]].map(([l, v]) => (
                <div key={String(l)} className="bg-gray-800 rounded-lg p-3"><p className="text-gray-500 text-xs">{l}</p><p className="text-white font-medium mt-1 text-sm">{v}</p></div>
              ))}
            </div>
            <div><p className="text-gray-500 text-xs mb-1">Email</p><p className="text-violet-400 text-sm">{selected.email}</p></div>
          </div>
        </div>
      )}
      {showForm && <MemberForm member={editMember} onClose={() => { setShowForm(false); setEditMember(null); }} onSave={() => { setShowForm(false); setEditMember(null); setSelected(null); load(); }} />}
    </div>
  );
}
