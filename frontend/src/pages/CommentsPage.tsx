import { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, Search, X, Edit2, Trash2 } from 'lucide-react';

interface Comment {
  id: number; issue_id: number; author_id: number | null; content: string;
  created_at: string; author_name: string; avatar_color: string; issue_title: string; project_id: number;
}

function CommentForm({ comment, issues, team, onSave, onClose }: { comment?: Comment | null; issues: {id:number;title:string}[]; team: {id:number;name:string}[]; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    issue_id: comment?.issue_id || '', author_id: comment?.author_id || '', content: comment?.content || '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (comment) await api.updateComment(comment.id, form); else await api.createComment(form);
      onSave();
    } catch (err) { console.error(err); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">{comment ? 'Edit Comment' : 'New Comment'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Issue *</label>
            <select required value={form.issue_id} onChange={e => setForm({...form,issue_id:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
              <option value="">Select issue...</option>{issues.map(i => <option key={i.id} value={i.id}>{i.title.slice(0,60)}</option>)}</select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Author</label>
            <select value={form.author_id} onChange={e => setForm({...form,author_id:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
              <option value="">Anonymous</option>{team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Content *</label>
            <textarea required rows={4} value={form.content} onChange={e => setForm({...form,content:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" />
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

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [issues, setIssues] = useState<{id:number;title:string}[]>([]);
  const [team, setTeam] = useState<{id:number;name:string}[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Comment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editComment, setEditComment] = useState<Comment | null>(null);

  const load = async () => {
    const [c, i, t] = await Promise.all([api.getComments(), api.getIssues(), api.getTeam()]);
    setComments(c); setIssues(i); setTeam(t);
  };
  useEffect(() => { load(); }, []);

  const filtered = comments.filter(c => c.content?.toLowerCase().includes(search.toLowerCase()) || c.author_name?.toLowerCase().includes(search.toLowerCase()) || c.issue_title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Comments</h1>
          <p className="text-gray-400 text-sm mt-1">{comments.length} comments across all issues</p>
        </div>
        <button onClick={() => { setEditComment(null); setShowForm(true); }} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Comment
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search comments..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
      </div>
      <div className="space-y-3">
        {filtered.map(c => (
          <div key={c.id} onClick={() => setSelected(c)} className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-violet-600 transition-colors">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full ${c.avatar_color || 'bg-gray-600'} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>
                {c.author_name ? c.author_name.split(' ').map((n: string) => n[0]).join('').slice(0,2) : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white text-sm font-medium">{c.author_name || 'Anonymous'}</span>
                  <span className="text-gray-600 text-xs">·</span>
                  <span className="text-gray-500 text-xs">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-400 text-xs mb-2 truncate">on: {c.issue_title}</p>
                <p className="text-gray-300 text-sm line-clamp-2">{c.content}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={e => { e.stopPropagation(); setEditComment(c); setShowForm(true); }} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded"><Edit2 className="w-3 h-3" /></button>
                <button onClick={async e => { e.stopPropagation(); if (!confirm('Delete?')) return; await api.deleteComment(c.id); load(); }} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-gray-600 bg-gray-900 rounded-xl border border-gray-800">No comments found</div>}
      </div>
      {selected && !showForm && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-gray-900 border-l border-gray-800 z-40 overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${selected.avatar_color || 'bg-gray-600'} flex items-center justify-center text-white font-bold`}>
                {selected.author_name ? selected.author_name.split(' ').map(n => n[0]).join('').slice(0,2) : '?'}
              </div>
              <div><h2 className="text-white font-semibold">{selected.author_name || 'Anonymous'}</h2><p className="text-gray-400 text-sm">{new Date(selected.created_at).toLocaleString()}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditComment(selected); setShowForm(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await api.deleteComment(selected.id); setSelected(null); load(); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-500 text-xs mb-1">Issue</p><p className="text-white text-sm">{selected.issue_title}</p></div>
            <div><p className="text-gray-500 text-xs mb-2">Comment</p><p className="text-gray-300 text-sm leading-relaxed">{selected.content}</p></div>
          </div>
        </div>
      )}
      {showForm && <CommentForm comment={editComment} issues={issues} team={team} onClose={() => { setShowForm(false); setEditComment(null); }} onSave={() => { setShowForm(false); setEditComment(null); setSelected(null); load(); }} />}
    </div>
  );
}
