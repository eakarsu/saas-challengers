import { useState } from 'react';
import { Database, FolderKanban, Bug, Zap, Users, MessageSquare, Tag, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const ENTITIES = [
  { key: 'projects', label: 'Projects', icon: FolderKanban, hint: 'Realistic SaaS PM projects (Momentum Web, Realtime Collab, Billing, ...)' },
  { key: 'team', label: 'Team Members', icon: Users, hint: 'Engineers, designers, QA across departments and time zones' },
  { key: 'labels', label: 'Labels', icon: Tag, hint: 'bug / feature / tech-debt / security / performance / ux' },
  { key: 'sprints', label: 'Sprints', icon: Zap, hint: 'Two-week sprints with goals (SSO, latency, billing GA, ...)' },
  { key: 'issues', label: 'Issues', icon: Bug, hint: 'Tickets like "Implement OAuth2 PKCE flow", linked to sprints + assignees' },
  { key: 'comments', label: 'Comments', icon: MessageSquare, hint: 'Realistic engineer comments on existing issues' },
];

interface Toast { kind: 'ok' | 'err'; msg: string; }

export default function SampleDataPage() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<Toast | null>(null);

  const insert = async (entity: string) => {
    setLoading(l => ({ ...l, [entity]: true }));
    setToast(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/sample-data/${entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || res.statusText);
      }
      const data = await res.json();
      setCounts(c => ({ ...c, [entity]: (c[entity] || 0) + (data.inserted || 0) }));
      setToast({ kind: 'ok', msg: `Inserted ${data.inserted} ${data.entity}.` });
    } catch (e) {
      setToast({ kind: 'err', msg: (e as Error).message });
    } finally {
      setLoading(l => ({ ...l, [entity]: false }));
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center">
          <Database className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Sample Data</h1>
          <p className="text-gray-400 text-sm">Seed the database with domain-realistic rows. Each click inserts 5-10 rows.</p>
        </div>
      </div>

      {toast && (
        <div className={`my-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm border ${toast.kind === 'ok' ? 'bg-emerald-900/30 border-emerald-700 text-emerald-300' : 'bg-red-900/30 border-red-700 text-red-300'}`}>
          {toast.kind === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {ENTITIES.map(({ key, label, icon: Icon, hint }) => (
          <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <Icon className="w-5 h-5 text-violet-400" />
              <h3 className="text-white font-semibold">{label}</h3>
              {counts[key] > 0 && (
                <span className="ml-auto bg-violet-600/20 text-violet-300 text-xs font-medium px-2 py-0.5 rounded">
                  +{counts[key]}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-xs mb-4 flex-1">{hint}</p>
            <button
              onClick={() => insert(key)}
              disabled={loading[key]}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {loading[key] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {loading[key] ? 'Inserting...' : `Insert ${label}`}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-400">
        <p className="text-gray-300 font-medium mb-1">Order matters</p>
        <p>Sprints, issues and comments depend on existing projects/team members. If you start from an empty DB, click in this order: Projects -&gt; Team Members -&gt; Labels -&gt; Sprints -&gt; Issues -&gt; Comments.</p>
      </div>
    </div>
  );
}
