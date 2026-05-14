const BASE = '/api';
function getToken() { return localStorage.getItem('token'); }

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw new Error(err.error || res.statusText); }
  return res.json();
}

export const api = {
  login: (email: string, password: string) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getProjects: () => apiFetch('/projects'),
  getProject: (id: number) => apiFetch(`/projects/${id}`),
  createProject: (d: unknown) => apiFetch('/projects', { method: 'POST', body: JSON.stringify(d) }),
  updateProject: (id: number, d: unknown) => apiFetch(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteProject: (id: number) => apiFetch(`/projects/${id}`, { method: 'DELETE' }),
  getIssues: () => apiFetch('/issues'),
  getIssue: (id: number) => apiFetch(`/issues/${id}`),
  createIssue: (d: unknown) => apiFetch('/issues', { method: 'POST', body: JSON.stringify(d) }),
  updateIssue: (id: number, d: unknown) => apiFetch(`/issues/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteIssue: (id: number) => apiFetch(`/issues/${id}`, { method: 'DELETE' }),
  getSprints: () => apiFetch('/sprints'),
  getSprint: (id: number) => apiFetch(`/sprints/${id}`),
  createSprint: (d: unknown) => apiFetch('/sprints', { method: 'POST', body: JSON.stringify(d) }),
  updateSprint: (id: number, d: unknown) => apiFetch(`/sprints/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteSprint: (id: number) => apiFetch(`/sprints/${id}`, { method: 'DELETE' }),
  getTeam: () => apiFetch('/team'),
  getMember: (id: number) => apiFetch(`/team/${id}`),
  createMember: (d: unknown) => apiFetch('/team', { method: 'POST', body: JSON.stringify(d) }),
  updateMember: (id: number, d: unknown) => apiFetch(`/team/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteMember: (id: number) => apiFetch(`/team/${id}`, { method: 'DELETE' }),
  getComments: () => apiFetch('/comments'),
  getComment: (id: number) => apiFetch(`/comments/${id}`),
  createComment: (d: unknown) => apiFetch('/comments', { method: 'POST', body: JSON.stringify(d) }),
  updateComment: (id: number, d: unknown) => apiFetch(`/comments/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteComment: (id: number) => apiFetch(`/comments/${id}`, { method: 'DELETE' }),
  getLabels: () => apiFetch('/labels'),
  getLabel: (id: number) => apiFetch(`/labels/${id}`),
  createLabel: (d: unknown) => apiFetch('/labels', { method: 'POST', body: JSON.stringify(d) }),
  updateLabel: (id: number, d: unknown) => apiFetch(`/labels/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteLabel: (id: number) => apiFetch(`/labels/${id}`, { method: 'DELETE' }),
  aiSprintPlanning: (d: unknown) => apiFetch('/ai/sprint-planning', { method: 'POST', body: JSON.stringify(d) }),
  aiIssueTriage: (d: unknown) => apiFetch('/ai/issue-triage', { method: 'POST', body: JSON.stringify(d) }),
  aiVelocityAnalysis: (d: unknown) => apiFetch('/ai/velocity-analysis', { method: 'POST', body: JSON.stringify(d) }),
  aiProjectHealth: (d: unknown) => apiFetch('/ai/project-health', { method: 'POST', body: JSON.stringify(d) }),
  // New AI features
  aiSprintRisk: (d: unknown) => apiFetch('/ai/sprint-risk', { method: 'POST', body: JSON.stringify(d) }),
  aiStoryPointEstimate: (d: unknown) => apiFetch('/ai/story-point-estimate', { method: 'POST', body: JSON.stringify(d) }),
  aiSimilarIssues: (d: unknown) => apiFetch('/ai/similar-issues', { method: 'POST', body: JSON.stringify(d) }),
  aiBlockerClassify: (d: unknown) => apiFetch('/ai/blocker-classify', { method: 'POST', body: JSON.stringify(d) }),
  aiRetroInsights: (d: unknown) => apiFetch('/ai/retro-insights', { method: 'POST', body: JSON.stringify(d) }),
  // Utility features
  exportIssuesCsvUrl: (filters: Record<string, string | number | undefined> = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)); });
    const qs = params.toString();
    return `/api/utils/issues/export.csv${qs ? `?${qs}` : ''}`;
  },
  searchIssues: (filters: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)); });
    return apiFetch(`/utils/search/issues${params.toString() ? `?${params}` : ''}`);
  },
  getAuditLog: (filters: Record<string, string | number | undefined> = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)); });
    return apiFetch(`/utils/audit${params.toString() ? `?${params}` : ''}`);
  },
  createAuditEntry: (d: unknown) => apiFetch('/utils/audit', { method: 'POST', body: JSON.stringify(d) }),
};
