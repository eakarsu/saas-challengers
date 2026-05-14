import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api';
import {
  FolderKanban, Bug, Zap, Users, MessageSquare, Sparkles, Database,
  Activity, TrendingUp, AlertCircle, ArrowRight,
} from 'lucide-react';

interface SprintRow {
  id: number; name: string; goal: string; status: string;
  start_date: string; end_date: string; project_name: string;
  total_issues: number; done_issues: number;
  total_points: number; done_points: number;
}
interface AuditRow {
  id: number; user_email: string; action: string;
  entity_type: string; entity_id: number | null;
  details: string | null; created_at: string;
}
interface DashboardStats {
  kpis: {
    active_projects: number; open_issues: number; team_members: number;
    recent_comments: number; active_sprints: number; sprint_progress_pct: number;
  };
  current_sprints: SprintRow[];
  recent_activity: AuditRow[];
  issues_by_status: { status: string; count: number }[];
  issues_by_priority: { priority: string; count: number }[];
}

const priorityColors: Record<string, string> = {
  critical: 'bg-red-900 text-red-300', high: 'bg-orange-900 text-orange-300',
  medium: 'bg-yellow-900 text-yellow-300', low: 'bg-gray-700 text-gray-400',
};

function KpiCard({ icon: Icon, label, value, accent, sub }: {
  icon: React.ComponentType<{ className?: string }>; label: string;
  value: string | number; accent: string; sub?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const actionColors: Record<string, string> = {
  create: 'bg-green-900/40 text-green-300',
  update: 'bg-blue-900/40 text-blue-300',
  delete: 'bg-red-900/40 text-red-300',
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/dashboard/stats')
      .then((d: DashboardStats) => setStats(d))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-8 text-gray-400">Loading dashboard...</div>
  );
  if (error || !stats) return (
    <div className="p-8">
      <div className="bg-red-900/30 border border-red-900 text-red-300 rounded-lg p-4 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />Failed to load dashboard: {error}
      </div>
    </div>
  );

  const k = stats.kpis;

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-black">Dashboard</h1>
          <p className="text-gray-400 text-sm">Project momentum at a glance</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Activity className="w-4 h-4" />Live snapshot
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard icon={FolderKanban} label="Active Projects" value={k.active_projects} accent="bg-violet-600" />
        <KpiCard icon={Bug} label="Open Issues" value={k.open_issues} accent="bg-orange-600" />
        <KpiCard icon={Zap} label="Sprint Progress" value={`${k.sprint_progress_pct}%`} accent="bg-emerald-600"
          sub={`${k.active_sprints} active sprint${k.active_sprints === 1 ? '' : 's'}`} />
        <KpiCard icon={Users} label="Team Members" value={k.team_members} accent="bg-blue-600" />
        <KpiCard icon={MessageSquare} label="Recent Comments" value={k.recent_comments} accent="bg-pink-600" sub="last 7 days" />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-white text-sm font-semibold uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/ai', label: 'AI Center', icon: Sparkles, accent: 'from-violet-600 to-fuchsia-600' },
            { to: '/issues', label: 'Issues', icon: Bug, accent: 'from-orange-600 to-red-600' },
            { to: '/sprints', label: 'Sprints', icon: Zap, accent: 'from-emerald-600 to-teal-600' },
            { to: '/sample-data', label: 'Sample Data', icon: Database, accent: 'from-blue-600 to-cyan-600' },
          ].map(({ to, label, icon: Icon, accent }) => (
            <Link key={to} to={to}
              className={`bg-gradient-to-br ${accent} rounded-xl p-4 flex items-center justify-between text-white hover:opacity-90 transition-opacity`}>
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="font-semibold text-sm">{label}</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current sprints */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />Current Sprint Progress
            </h2>
            <Link to="/sprints" className="text-xs text-violet-400 hover:text-violet-300">View all</Link>
          </div>
          {stats.current_sprints.length === 0 ? (
            <p className="text-gray-500 text-sm">No active sprints. Start one from the Sprints page.</p>
          ) : (
            <div className="space-y-4">
              {stats.current_sprints.map(s => {
                const pct = s.total_points > 0
                  ? Math.round((s.done_points / s.total_points) * 100)
                  : (s.total_issues > 0 ? Math.round((s.done_issues / s.total_issues) * 100) : 0);
                return (
                  <div key={s.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <div className="text-white text-sm font-medium">{s.name}</div>
                        <div className="text-xs text-gray-500">{s.project_name} - {s.done_issues}/{s.total_issues} issues - {s.done_points}/{s.total_points} pts</div>
                      </div>
                      <span className="text-emerald-300 text-sm font-semibold">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Issue breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-violet-400" />Issue Breakdown
          </h2>
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-2">By Priority</div>
            <div className="flex flex-wrap gap-2">
              {stats.issues_by_priority.map(p => (
                <span key={p.priority} className={`px-2 py-1 rounded-md text-xs ${priorityColors[p.priority] || 'bg-gray-700 text-gray-300'}`}>
                  {p.priority}: {p.count}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-2">By Status</div>
            <div className="space-y-1.5">
              {stats.issues_by_status.map(s => (
                <div key={s.status} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 capitalize">{s.status.replace(/_/g, ' ')}</span>
                  <span className="text-gray-500 font-mono">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-400" />Recent Activity
          </h2>
          <Link to="/audit" className="text-xs text-violet-400 hover:text-violet-300">View audit log</Link>
        </div>
        {stats.recent_activity.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent activity.</p>
        ) : (
          <ul className="divide-y divide-gray-800">
            {stats.recent_activity.map(a => (
              <li key={a.id} className="py-2.5 flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${actionColors[a.action] || 'bg-gray-700 text-gray-300'}`}>
                  {a.action}
                </span>
                <span className="text-gray-300 text-sm flex-1 truncate">
                  <span className="text-violet-300">{a.entity_type}</span>
                  {a.entity_id ? ` #${a.entity_id}` : ''}
                  {a.details ? <span className="text-gray-500"> - {a.details}</span> : null}
                </span>
                <span className="text-xs text-gray-500 whitespace-nowrap">{a.user_email}</span>
                <span className="text-xs text-gray-600 whitespace-nowrap">{timeAgo(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
