import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Layers, FolderKanban, Bug, Zap, Users, MessageSquare, Tag, Sparkles, LogOut, Search, ScrollText, Database, LayoutDashboard, Building2, Swords, AlertOctagon, CircleDollarSign, Shield, Eye, Bot, GitPullRequest, LifeBuoy, Clock, GitGraph, GitBranch, Keyboard, KeyRound, FileText, Webhook, Radio, FileCheck2, RotateCcw, Copy, Github, ClipboardList } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/incumbents', label: 'Incumbents', icon: Building2 },
  { to: '/challengers', label: 'Challengers', icon: Swords },
  { to: '/displacement', label: 'Displacement', icon: Users },
  { to: '/switching', label: 'Switching Costs', icon: AlertOctagon },
  { to: '/pricing', label: 'Pricing Models', icon: CircleDollarSign },
  { to: '/moats', label: 'Moats', icon: Shield },
  { to: '/custom-views', label: 'Challenger Views', icon: Eye },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/issues', label: 'Issues', icon: Bug },
  { to: '/sprints', label: 'Sprints', icon: Zap },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/comments', label: 'Comments', icon: MessageSquare },
  { to: '/labels', label: 'Labels', icon: Tag },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/audit', label: 'Audit Log', icon: ScrollText },
  { to: '/sample-data', label: 'Sample Data', icon: Database },
];

const gapItems = [
  { to: '/gap/agent-executor', label: 'Agent Executor', icon: Bot },
  { to: '/gap/auto-pr-from-issue', label: 'Auto PR from Issue', icon: GitPullRequest },
  { to: '/gap/standup-summarizer', label: 'Standup Summarizer', icon: ClipboardList },
  { to: '/gap/cycle-time-explainer', label: 'Cycle Time Explainer', icon: Clock },
  { to: '/gap/dependency-graph', label: 'Dependency Graph', icon: GitGraph },
  { to: '/gap/customer-portal', label: 'Customer Portal', icon: LifeBuoy },
  { to: '/gap/git-integration', label: 'Git Integration', icon: GitBranch },
  { to: '/gap/keyboard-palette', label: 'Keyboard Palette', icon: Keyboard },
  { to: '/gap/sso-integration', label: 'SSO Integration', icon: KeyRound },
  { to: '/gap/webhook-ingest', label: 'Webhook Ingest', icon: Webhook },
  { to: '/gap/websocket-events', label: 'WebSocket Events', icon: Radio },
];

const cfItems = [
  { to: '/cf/agent-executable-spec', label: 'Agent Spec', icon: FileCheck2 },
  { to: '/cf/plan-from-brief', label: 'Plan from Brief', icon: FileText },
  { to: '/cf/auto-retros', label: 'Auto Retros', icon: RotateCcw },
  { to: '/cf/code-aware-similarity', label: 'Code-Aware Similarity', icon: Copy },
  { to: '/cf/github-sync', label: 'GitHub Sync', icon: Github },
];

export default function Layout() {
  const navigate = useNavigate();
  const logout = () => { localStorage.removeItem('token'); navigate('/login'); };
  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center"><Layers className="w-5 h-5 text-white" /></div>
            <div><h1 className="text-white font-black text-lg leading-tight">SaaS Challengers</h1><p className="text-violet-400 text-xs">AI-native vs legacy</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-violet-600/20 text-violet-300 font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Icon className="w-4 h-4" />{label}
            </NavLink>
          ))}
          <div className="pt-3 mt-3 border-t border-gray-800">
            <NavLink to="/ai" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-violet-600/20 text-violet-300 font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Sparkles className="w-4 h-4" />AI Intelligence
            </NavLink>
          </div>
          <div className="pt-3 mt-3 border-t border-gray-800">
            <p className="px-3 pb-1 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Gap Features</p>
            {gapItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-violet-600/20 text-violet-300 font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                <Icon className="w-4 h-4" />{label}
              </NavLink>
            ))}
          </div>
          <div className="pt-3 mt-3 border-t border-gray-800">
            <p className="px-3 pb-1 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Custom Features</p>
            {cfItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-violet-600/20 text-violet-300 font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                <Icon className="w-4 h-4" />{label}
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="p-3 border-t border-gray-800">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 w-full transition-colors">
            <LogOut className="w-4 h-4" />Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-950"><Outlet /></main>
    </div>
  );
}
