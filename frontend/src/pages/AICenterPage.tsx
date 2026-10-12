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

  // Presets select saved records and preserve the other current selections.
  const presetRecords = ['sprint-planning', 'sprint-risk', 'retro-insights'].includes(activeTab)
    ? sprints.map(sprint => ({ label: sprint.name, project: projects.find(project => project.name === sprint.project_name), sprint, issue: undefined as Issue | undefined }))
    : ['velocity-analysis', 'project-health'].includes(activeTab)
      ? projects.map(project => ({ label: project.name, project, sprint: undefined as Sprint | undefined, issue: undefined as Issue | undefined }))
      : issues.map(issue => ({ label: issue.title, project: projects.find(project => project.name === issue.project_name), sprint: undefined as Sprint | undefined, issue }));
  const tabSamples = presetRecords.slice(0, 3);
  const applySample = (sample: typeof tabSamples[number]) => {
    setResult(''); setErrorMsg('');
    if (sample.project) setSelectedProjectId(String(sample.project.id));
    if (sample.sprint) setSelectedSprintId(String(sample.sprint.id));
    if (sample.issue) setSelectedIssueId(String(sample.issue.id));
  };

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
        {tabSamples.length < 2 && <p className="text-sm text-amber-300">Multiple examples require at least two saved {needsSprint ? 'sprints' : needsIssue ? 'issues' : 'projects'}. Create those records first.</p>}
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
        <button onClick={run} disabled={loading || (needsProject && !selectedProject) || (needsSprint && !selectedSprint) || (needsIssue && !selectedIssue)} className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
          {loading ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
        {errorMsg && <div className="bg-red-900/40 border border-red-700 text-red-300 text-xs rounded-lg p-3">{errorMsg}</div>}
      </div>

      <AIResponse content={result} loading={loading} timestamp={timestamp} />
    </div>
  );
}
