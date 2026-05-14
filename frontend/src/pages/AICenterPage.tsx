import { useEffect, useState } from 'react';
import { api } from '../api';
import AIResponse from '../components/AIResponse';
import { Zap, Bug, TrendingUp, Activity, AlertTriangle, Calculator, GitMerge, Lock, ClipboardList, Sparkles } from 'lucide-react';

const tabs = [
  { key: 'sprint-planning', label: 'Sprint Planning', icon: Zap },
  { key: 'issue-triage', label: 'Issue Triage', icon: Bug },
  { key: 'velocity-analysis', label: 'Velocity Analysis', icon: TrendingUp },
  { key: 'project-health', label: 'Project Health', icon: Activity },
  { key: 'sprint-risk', label: 'Sprint Risk', icon: AlertTriangle },
  { key: 'story-point-estimate', label: 'Story Point Estimator', icon: Calculator },
  { key: 'similar-issues', label: 'Similar Issues', icon: GitMerge },
  { key: 'blocker-classify', label: 'Blocker Classifier', icon: Lock },
  { key: 'retro-insights', label: 'Retro Insights', icon: ClipboardList },
];

// ----- Sample prefills per AI tab (realistic SaaS PM data) -----
type SampleProject = { id: number; name: string; status: string; description: string };
type SampleSprint = { id: number; name: string; status: string; goal: string; velocity: number; total_points: number; completed_points: number; project_name: string; project_id?: number };
type SampleIssue = { id: number; title: string; status: string; priority: string; issue_type: string; story_points: number; assignee_name: string; project_name: string; project_id?: number; sprint_id?: number; description?: string };
type SampleComment = { id: number; issue_id: number; content: string; author_name: string; created_at: string };
type Sample = {
  label: string;
  project?: SampleProject;
  sprint?: SampleSprint;
  issue?: SampleIssue;
  comments?: SampleComment[];
};

const SAMPLE_ID_BASE = 900000; // synthetic IDs won't collide with DB

const SAMPLES: Record<string, Sample[]> = {
  'sprint-planning': [
    {
      label: 'Q2 Auth & Billing',
      sprint: { id: SAMPLE_ID_BASE + 11, name: 'Sprint 24 — Auth & Billing', status: 'planning', goal: 'Ship OAuth2 PKCE login + Stripe usage-based billing GA', velocity: 42, total_points: 0, completed_points: 0, project_name: 'Momentum Platform' },
    },
    {
      label: 'Mobile Onboarding',
      sprint: { id: SAMPLE_ID_BASE + 12, name: 'Sprint 18 — Mobile Onboarding', status: 'planning', goal: 'Reduce Day-1 drop-off by 25% via revamped mobile onboarding', velocity: 36, total_points: 0, completed_points: 0, project_name: 'Mobile App' },
    },
    {
      label: 'Perf Hardening',
      sprint: { id: SAMPLE_ID_BASE + 13, name: 'Sprint 31 — Perf Hardening', status: 'planning', goal: 'Cut p95 dashboard TTI under 1.5s for 10k-issue workspaces', velocity: 48, total_points: 0, completed_points: 0, project_name: 'Momentum Platform' },
    },
  ],
  'issue-triage': [
    {
      label: 'OAuth2 PKCE',
      issue: { id: SAMPLE_ID_BASE + 21, title: 'Implement OAuth2 PKCE flow for SPA login', status: 'backlog', priority: 'p1', issue_type: 'feature', story_points: 0, assignee_name: 'Unassigned', project_name: 'Momentum Platform', description: 'Replace the implicit grant on the web SPA with OAuth2 Authorization Code + PKCE. Must keep refresh-token rotation, support SSO IdPs, and pass our SOC2 auth review.' },
    },
    {
      label: 'Checkout race',
      issue: { id: SAMPLE_ID_BASE + 22, title: 'Fix race condition in checkout double-charge', status: 'backlog', priority: 'p0', issue_type: 'bug', story_points: 0, assignee_name: 'Unassigned', project_name: 'Billing', description: 'Concurrent submit clicks within ~150ms cause two Stripe PaymentIntents to be created. Repro on slow 3G. Need idempotency key + client-side debouncing + server-side dedup window.' },
    },
    {
      label: 'Webhook dedup',
      issue: { id: SAMPLE_ID_BASE + 23, title: 'Webhook delivery dedup + replay UI', status: 'backlog', priority: 'p2', issue_type: 'tech-debt', story_points: 0, assignee_name: 'Unassigned', project_name: 'Integrations', description: 'Customers get duplicate webhook deliveries on retries. Add HMAC-keyed dedup table (24h TTL) and an admin UI to replay or skip stuck events.' },
    },
  ],
  'velocity-analysis': [
    {
      label: 'Platform Q1',
      project: { id: SAMPLE_ID_BASE + 31, name: 'Momentum Platform', status: 'active', description: 'Core issue-tracking SaaS, 4-engineer team, 2-week sprints. Last 6 sprints velocities: 38, 41, 44, 29, 47, 42. Sprint 4 included a P0 incident week.' },
    },
    {
      label: 'Mobile App',
      project: { id: SAMPLE_ID_BASE + 32, name: 'Mobile App', status: 'active', description: 'iOS + Android client, 3-engineer team, 1-week sprints. Velocity has trended down from 22 to 16 over 8 sprints — suspected onboarding scope creep + flaky CI.' },
    },
  ],
  'project-health': [
    {
      label: 'Platform health',
      project: { id: SAMPLE_ID_BASE + 41, name: 'Momentum Platform', status: 'active', description: 'B2B SaaS issue tracker. 187 open issues (23 p0/p1), 6 sprints behind on tech-debt epic, 2 engineers on PTO next sprint, last release had 3 rollback tickets.' },
    },
    {
      label: 'Billing health',
      project: { id: SAMPLE_ID_BASE + 42, name: 'Billing', status: 'at-risk', description: 'Stripe-backed billing service. Migrating from monthly to usage-based pricing for GA in 5 weeks. 4 open p0 bugs, ownership unclear after recent re-org, no on-call runbook.' },
    },
    {
      label: 'Integrations',
      project: { id: SAMPLE_ID_BASE + 43, name: 'Integrations', status: 'active', description: 'Slack/GitHub/Linear connectors. Healthy velocity, but bus-factor risk: one engineer owns 70% of webhook code. Customer-reported bugs trending up 15% MoM.' },
    },
  ],
  'sprint-risk': [
    {
      label: 'Mid-sprint slip',
      sprint: { id: SAMPLE_ID_BASE + 51, name: 'Sprint 24 — Auth & Billing', status: 'active', goal: 'Ship OAuth2 PKCE + Stripe usage-based billing GA', velocity: 42, total_points: 52, completed_points: 14, project_name: 'Momentum Platform' },
    },
    {
      label: 'Over-committed',
      sprint: { id: SAMPLE_ID_BASE + 52, name: 'Sprint 31 — Perf Hardening', status: 'active', goal: 'Cut p95 dashboard TTI under 1.5s for 10k-issue workspaces', velocity: 48, total_points: 71, completed_points: 22, project_name: 'Momentum Platform' },
    },
    {
      label: 'PTO-heavy',
      sprint: { id: SAMPLE_ID_BASE + 53, name: 'Sprint 18 — Mobile Onboarding', status: 'active', goal: 'Reduce Day-1 drop-off via mobile onboarding revamp', velocity: 36, total_points: 38, completed_points: 8, project_name: 'Mobile App' },
    },
  ],
  'story-point-estimate': [
    {
      label: 'OAuth2 PKCE',
      issue: { id: SAMPLE_ID_BASE + 61, title: 'Implement OAuth2 PKCE flow for SPA login', status: 'backlog', priority: 'p1', issue_type: 'feature', story_points: 0, assignee_name: 'Unassigned', project_name: 'Momentum Platform', description: 'Replace implicit grant on SPA with Auth Code + PKCE. Refresh-token rotation, SSO IdP support, SOC2 review. Touches frontend auth client, backend token exchange, and session middleware.' },
    },
    {
      label: 'CSV export',
      issue: { id: SAMPLE_ID_BASE + 62, title: 'CSV export with filter + saved-view support', status: 'backlog', priority: 'p2', issue_type: 'feature', story_points: 0, assignee_name: 'Unassigned', project_name: 'Momentum Platform', description: 'Stream up to 100k rows server-side honoring active filters. Add saved-view export. Stretch: scheduled email export.' },
    },
    {
      label: 'Race-cond fix',
      issue: { id: SAMPLE_ID_BASE + 63, title: 'Fix race condition in checkout double-charge', status: 'in-progress', priority: 'p0', issue_type: 'bug', story_points: 0, assignee_name: 'Unassigned', project_name: 'Billing', description: 'Two PaymentIntents on rapid double-click. Add idempotency key + 5s server dedup. Verify with k6 load test.' },
    },
  ],
  'similar-issues': [
    {
      label: 'Slow dashboard',
      issue: { id: SAMPLE_ID_BASE + 71, title: 'Dashboard slow for workspaces with 10k+ issues', status: 'backlog', priority: 'p1', issue_type: 'bug', story_points: 5, assignee_name: 'Unassigned', project_name: 'Momentum Platform', description: 'Customers with large workspaces see 8-12s TTI on dashboard load. Likely N+1 in /api/dashboard and missing virtual scroll.' },
    },
    {
      label: 'OAuth login',
      issue: { id: SAMPLE_ID_BASE + 72, title: 'Implement OAuth2 PKCE flow for SPA login', status: 'backlog', priority: 'p1', issue_type: 'feature', story_points: 8, assignee_name: 'Unassigned', project_name: 'Momentum Platform', description: 'Replace implicit grant with Auth Code + PKCE.' },
    },
    {
      label: 'Webhook dups',
      issue: { id: SAMPLE_ID_BASE + 73, title: 'Webhook delivery duplicates on retry', status: 'backlog', priority: 'p2', issue_type: 'bug', story_points: 3, assignee_name: 'Unassigned', project_name: 'Integrations', description: 'Retries cause downstream consumers to see duplicate events.' },
    },
  ],
  'blocker-classify': [
    {
      label: 'Legal review',
      issue: { id: SAMPLE_ID_BASE + 81, title: 'Add data-residency selector to workspace settings', status: 'in-progress', priority: 'p1', issue_type: 'feature', story_points: 5, assignee_name: 'Unassigned', project_name: 'Momentum Platform', description: 'Allow EU customers to pin data to eu-west-1.' },
      comments: [
        { id: SAMPLE_ID_BASE + 811, issue_id: SAMPLE_ID_BASE + 81, content: 'Backend ready to ship — waiting on legal review of the updated DPA before we expose the toggle.', author_name: 'eng-lead', created_at: new Date(Date.now() - 6 * 86400000).toISOString() },
        { id: SAMPLE_ID_BASE + 812, issue_id: SAMPLE_ID_BASE + 81, content: 'Pinged @legal again, no ETA. This has been stuck 6 days.', author_name: 'pm', created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
      ],
    },
    {
      label: 'Upstream API',
      issue: { id: SAMPLE_ID_BASE + 82, title: 'Sync GitHub PR status to Momentum issues', status: 'in-progress', priority: 'p2', issue_type: 'feature', story_points: 3, assignee_name: 'Unassigned', project_name: 'Integrations', description: 'Subscribe to GitHub PR webhooks and reflect status on linked issues.' },
      comments: [
        { id: SAMPLE_ID_BASE + 821, issue_id: SAMPLE_ID_BASE + 82, content: 'Blocked: API contract change in upstream — GitHub deprecated the v3 review event payload we depend on. Need to migrate to v4 GraphQL events.', author_name: 'eng', created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
      ],
    },
    {
      label: 'Unclear req',
      issue: { id: SAMPLE_ID_BASE + 83, title: 'Add saved filter views to issue list', status: 'in-progress', priority: 'p2', issue_type: 'feature', story_points: 5, assignee_name: 'Unassigned', project_name: 'Momentum Platform', description: 'Let users save filter combos and share them.' },
      comments: [
        { id: SAMPLE_ID_BASE + 831, issue_id: SAMPLE_ID_BASE + 83, content: 'Should saved views be per-user or per-workspace? Spec is ambiguous and design has both flows.', author_name: 'eng', created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
        { id: SAMPLE_ID_BASE + 832, issue_id: SAMPLE_ID_BASE + 83, content: 'Need PM decision before I keep building — paused for now.', author_name: 'eng', created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
      ],
    },
  ],
  'retro-insights': [
    {
      label: 'Auth sprint',
      sprint: { id: SAMPLE_ID_BASE + 91, name: 'Sprint 24 — Auth & Billing', status: 'completed', goal: 'Ship OAuth2 PKCE + Stripe usage-based billing GA', velocity: 38, total_points: 52, completed_points: 38, project_name: 'Momentum Platform' },
    },
    {
      label: 'Perf sprint',
      sprint: { id: SAMPLE_ID_BASE + 92, name: 'Sprint 31 — Perf Hardening', status: 'completed', goal: 'Cut p95 dashboard TTI under 1.5s', velocity: 51, total_points: 48, completed_points: 51, project_name: 'Momentum Platform' },
    },
    {
      label: 'Mobile sprint',
      sprint: { id: SAMPLE_ID_BASE + 93, name: 'Sprint 18 — Mobile Onboarding', status: 'completed', goal: 'Reduce Day-1 drop-off by 25%', velocity: 24, total_points: 36, completed_points: 24, project_name: 'Mobile App' },
    },
  ],
};

interface Project { id: number; name: string; status: string; description: string; }
interface Sprint { id: number; name: string; status: string; goal: string; velocity: number; total_points: number; completed_points: number; project_name: string; project_id?: number; }
interface Issue { id: number; title: string; status: string; priority: string; issue_type: string; story_points: number; assignee_name: string; project_name: string; project_id?: number; sprint_id?: number; description?: string; }
interface Member { id: number; name: string; role: string; department: string; open_issues: number; }
interface Comment { id: number; issue_id: number; content: string; author_name: string; created_at: string; }

export default function AICenterPage() {
  const [activeTab, setActiveTab] = useState('sprint-planning');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [timestamp, setTimestamp] = useState('');

  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [team, setTeam] = useState<Member[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [selectedIssueId, setSelectedIssueId] = useState('');

  useEffect(() => {
    Promise.all([api.getProjects(), api.getSprints(), api.getIssues(), api.getTeam(), api.getComments().catch(() => [])]).then(([p, s, i, t, c]) => {
      setProjects(p); setSprints(s); setIssues(i); setTeam(t); setComments(c);
      if (p.length) setSelectedProjectId(String(p[0].id));
      if (s.length) setSelectedSprintId(String(s[0].id));
      if (i.length) setSelectedIssueId(String(i[0].id));
    });
  }, []);

  const selectedProject = projects.find(p => String(p.id) === selectedProjectId);
  const selectedSprint = sprints.find(s => String(s.id) === selectedSprintId);
  const selectedIssue = issues.find(i => String(i.id) === selectedIssueId);
  const projectIssues = issues.filter(i => selectedProject && i.project_name === selectedProject.name);
  const projectSprints = sprints.filter(s => selectedProject && s.project_name === selectedProject.name);

  const run = async () => {
    setLoading(true); setResult(''); setErrorMsg('');
    try {
      let res: { result: string };
      if (activeTab === 'sprint-planning') {
        res = await api.aiSprintPlanning({ sprint: selectedSprint, issues: projectIssues.filter(i => i.status === 'backlog'), team });
      } else if (activeTab === 'issue-triage') {
        res = await api.aiIssueTriage({ issue: selectedIssue, project: selectedProject, team });
      } else if (activeTab === 'velocity-analysis') {
        res = await api.aiVelocityAnalysis({ sprints: projectSprints, team });
      } else if (activeTab === 'project-health') {
        res = await api.aiProjectHealth({ project: selectedProject, issues: projectIssues, sprints: projectSprints, team });
      } else if (activeTab === 'sprint-risk') {
        const sprintIssues = issues.filter(i => selectedSprint && (i as Issue).sprint_id === selectedSprint.id);
        res = await api.aiSprintRisk({ sprint: selectedSprint, issues: sprintIssues.length ? sprintIssues : projectIssues.slice(0, 20), team });
      } else if (activeTab === 'story-point-estimate') {
        const similar = projectIssues.filter(i => i.id !== selectedIssue?.id).slice(0, 10);
        res = await api.aiStoryPointEstimate({ issue: selectedIssue, similarIssues: similar, project: selectedProject });
      } else if (activeTab === 'similar-issues') {
        const candidates = issues.filter(i => i.id !== selectedIssue?.id).slice(0, 30);
        res = await api.aiSimilarIssues({ issue: selectedIssue, candidates });
      } else if (activeTab === 'blocker-classify') {
        const issueComments = comments.filter(c => c.issue_id === selectedIssue?.id);
        const related = issues.filter(i => i.id !== selectedIssue?.id && i.project_name === selectedIssue?.project_name).slice(0, 10);
        res = await api.aiBlockerClassify({ issue: selectedIssue, comments: issueComments, related });
      } else { // retro-insights
        const sprintIssues = issues.filter(i => selectedSprint && (i as Issue).sprint_id === selectedSprint.id);
        const recentComments = comments.slice(0, 15);
        res = await api.aiRetroInsights({ sprint: selectedSprint, issues: sprintIssues.length ? sprintIssues : projectIssues.slice(0, 25), comments: recentComments, team });
      }
      setResult(res.result);
      setTimestamp(new Date().toLocaleTimeString());
    } catch (e) {
      const msg = String(e);
      setErrorMsg(msg.includes('503') || msg.toLowerCase().includes('unavailable') ? 'AI service is currently unavailable. Please configure OPENROUTER_API_KEY in .env and try again.' : msg);
    } finally { setLoading(false); }
  };

  const applySample = (s: Sample) => {
    setResult(''); setErrorMsg('');
    if (s.project) {
      setProjects(prev => prev.some(p => p.id === s.project!.id) ? prev : [s.project!, ...prev]);
      setSelectedProjectId(String(s.project.id));
    }
    if (s.sprint) {
      setSprints(prev => prev.some(p => p.id === s.sprint!.id) ? prev : [s.sprint!, ...prev]);
      setSelectedSprintId(String(s.sprint.id));
    }
    if (s.issue) {
      setIssues(prev => prev.some(p => p.id === s.issue!.id) ? prev : [s.issue!, ...prev]);
      setSelectedIssueId(String(s.issue.id));
    }
    if (s.comments && s.comments.length) {
      setComments(prev => {
        const ids = new Set(prev.map(c => c.id));
        const fresh = s.comments!.filter(c => !ids.has(c.id));
        return fresh.length ? [...fresh, ...prev] : prev;
      });
    }
  };

  const tabSamples = SAMPLES[activeTab] || [];

  const needsProject = ['project-health', 'velocity-analysis', 'sprint-risk', 'retro-insights'].includes(activeTab);
  const needsSprint = ['sprint-planning', 'sprint-risk', 'retro-insights'].includes(activeTab);
  const needsIssue = ['issue-triage', 'story-point-estimate', 'similar-issues', 'blocker-classify'].includes(activeTab);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI Intelligence Center</h1>
        <p className="text-gray-400 text-sm mt-1">Sprint planning, risk, estimation, blocker analysis, retros and more</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setResult(''); setErrorMsg(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}>
              <Icon className="w-4 h-4" />{t.label}
            </button>
          );
        })}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4 space-y-4">
        {tabSamples.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Try a sample:</span>
            {tabSamples.map(s => (
              <button
                key={s.label}
                type="button"
                onClick={() => applySample(s)}
                className="text-xs px-2.5 py-1 rounded-md bg-violet-900/30 border border-violet-700/60 text-violet-200 hover:bg-violet-800/50 hover:text-white transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
        {needsProject && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Project</label>
            <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
              {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.status})</option>)}
            </select>
            {activeTab === 'velocity-analysis' && projectSprints.length > 0 && (
              <p className="text-gray-500 text-xs mt-1">{projectSprints.length} sprints in this project · avg velocity: {Math.round(projectSprints.filter(s => s.velocity > 0).reduce((acc, s) => acc + s.velocity, 0) / Math.max(1, projectSprints.filter(s => s.velocity > 0).length))}</p>
            )}
          </div>
        )}
        {needsSprint && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Sprint</label>
            <select value={selectedSprintId} onChange={e => setSelectedSprintId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
              {sprints.map(s => <option key={s.id} value={s.id}>{s.name} ({s.project_name}) — {s.status}</option>)}
            </select>
            {selectedSprint && <p className="text-gray-500 text-xs">Goal: {selectedSprint.goal || 'No goal set'} · {selectedSprint.total_points || 0} points planned</p>}
          </div>
        )}
        {needsIssue && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Issue</label>
            <select value={selectedIssueId} onChange={e => setSelectedIssueId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
              {issues.map(i => <option key={i.id} value={i.id}>{i.title.slice(0, 60)} ({i.project_name})</option>)}
            </select>
            {selectedIssue && <p className="text-gray-500 text-xs mt-1">Current: {selectedIssue.status} · {selectedIssue.priority} · {selectedIssue.story_points} pts</p>}
          </div>
        )}
        <button onClick={run} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
          {loading ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
        {errorMsg && <div className="bg-red-900/40 border border-red-700 text-red-300 text-xs rounded-lg p-3">{errorMsg}</div>}
      </div>

      <AIResponse content={result} loading={loading} timestamp={timestamp} />
    </div>
  );
}
