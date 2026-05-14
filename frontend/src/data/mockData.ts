export type Priority = 'urgent' | 'high' | 'medium' | 'low'
export type Status = 'backlog' | 'todo' | 'in_progress' | 'done'

export interface Member {
  id: string
  name: string
  initials: string
  color: string
}

export interface Project {
  id: string
  name: string
  color: string
  issueCount: number
  lastActivity: string
}

export interface Issue {
  id: string
  projectId: string
  title: string
  description: string
  status: Status
  priority: Priority
  assigneeId: string | null
  labels: string[]
  cycleId: string | null
  createdAt: string
  activity: { text: string; ts: string; type: 'created' | 'status' | 'comment' }[]
}

export const members: Member[] = [
  { id: 'm1', name: 'Alex Kim', initials: 'AK', color: 'bg-indigo-500' },
  { id: 'm2', name: 'Sara Lee', initials: 'SL', color: 'bg-rose-500' },
  { id: 'm3', name: 'Dan Cho', initials: 'DC', color: 'bg-emerald-500' },
]

export const projects: Project[] = [
  { id: 'p1', name: 'Platform Core', color: 'bg-indigo-500', issueCount: 6, lastActivity: '5 min ago' },
  { id: 'p2', name: 'Mobile App', color: 'bg-rose-500', issueCount: 5, lastActivity: '1h ago' },
  { id: 'p3', name: 'Analytics Suite', color: 'bg-amber-500', issueCount: 4, lastActivity: '2h ago' },
]

export const issues: Issue[] = [
  // Platform Core
  {
    id: 'ENG-001',
    projectId: 'p1',
    title: 'Implement real-time collaboration cursors',
    description: 'Add presence indicators and live cursor tracking for multi-user document editing sessions. Should support up to 50 concurrent users without performance degradation.',
    status: 'in_progress',
    priority: 'urgent',
    assigneeId: 'm1',
    labels: ['Feature', 'Real-time'],
    cycleId: 'cycle-1',
    createdAt: 'Apr 28',
    activity: [
      { text: 'Issue created by Alex Kim', ts: 'Apr 28, 9:00am', type: 'created' },
      { text: 'Status changed to In Progress', ts: 'Apr 29, 2:15pm', type: 'status' },
      { text: 'Looked into using CRDTs — Yjs seems best fit. Will prototype this week.', ts: 'May 1, 10:30am', type: 'comment' },
    ],
  },
  {
    id: 'ENG-002',
    projectId: 'p1',
    title: 'SSO integration blocked by vendor API breaking change',
    description: 'Third-party SSO provider updated their OAuth callback spec. Our integration no longer works. Affects enterprise customers.',
    status: 'todo',
    priority: 'urgent',
    assigneeId: 'm2',
    labels: ['Bug', 'Enterprise', 'Blocked'],
    cycleId: 'cycle-1',
    createdAt: 'Apr 30',
    activity: [
      { text: 'Issue created by Sara Lee', ts: 'Apr 30, 11:00am', type: 'created' },
      { text: 'Vendor support ticket #48211 filed', ts: 'Apr 30, 11:30am', type: 'comment' },
      { text: 'Status changed to Todo', ts: 'May 1, 9:00am', type: 'status' },
    ],
  },
  {
    id: 'ENG-003',
    projectId: 'p1',
    title: 'Optimize database query performance for large workspaces',
    description: 'Workspaces with 10k+ issues experience slow loads. Need to add proper indexes and paginate the main workspace query.',
    status: 'backlog',
    priority: 'high',
    assigneeId: 'm3',
    labels: ['Performance', 'Database'],
    cycleId: null,
    createdAt: 'Apr 25',
    activity: [
      { text: 'Issue created by Dan Cho', ts: 'Apr 25, 3:00pm', type: 'created' },
      { text: 'Profiled queries — the workspace load is doing 47 sequential SELECTs. Need to join.', ts: 'Apr 26, 10:00am', type: 'comment' },
    ],
  },
  {
    id: 'ENG-004',
    projectId: 'p1',
    title: 'Add webhook support for issue events',
    description: 'Allow customers to subscribe to issue create/update/delete events via webhooks. Support retries with exponential backoff.',
    status: 'done',
    priority: 'medium',
    assigneeId: 'm1',
    labels: ['Feature', 'API'],
    cycleId: 'cycle-1',
    createdAt: 'Apr 15',
    activity: [
      { text: 'Issue created', ts: 'Apr 15, 9:00am', type: 'created' },
      { text: 'Status changed to Done', ts: 'Apr 27, 4:00pm', type: 'status' },
      { text: 'Shipped! Webhooks now live for all plans.', ts: 'Apr 27, 4:30pm', type: 'comment' },
    ],
  },
  {
    id: 'ENG-005',
    projectId: 'p1',
    title: 'Fix memory leak in WebSocket connection pool',
    description: 'Long-running sessions accumulate unreleased WebSocket handles. Causes gradual memory increase, eventual OOM after ~48h uptime.',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'm2',
    labels: ['Bug', 'Infrastructure'],
    cycleId: 'cycle-1',
    createdAt: 'May 1',
    activity: [
      { text: 'Issue created by Sara Lee', ts: 'May 1, 8:00am', type: 'created' },
      { text: 'Status changed to In Progress', ts: 'May 1, 9:30am', type: 'status' },
    ],
  },
  {
    id: 'ENG-006',
    projectId: 'p1',
    title: 'Improve onboarding flow for new workspaces',
    description: 'New users struggle with the blank slate. Add sample data, guided tour, and template picker on first login.',
    status: 'backlog',
    priority: 'medium',
    assigneeId: null,
    labels: ['UX', 'Onboarding'],
    cycleId: null,
    createdAt: 'Apr 20',
    activity: [
      { text: 'Issue created', ts: 'Apr 20, 2:00pm', type: 'created' },
    ],
  },
  // Mobile App
  {
    id: 'MOB-001',
    projectId: 'p2',
    title: 'Dark mode support for iOS and Android',
    description: 'System-level dark mode should propagate to all app screens. Currently only affects the home screen.',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'm3',
    labels: ['Feature', 'Design'],
    cycleId: 'cycle-1',
    createdAt: 'Apr 22',
    activity: [
      { text: 'Issue created', ts: 'Apr 22, 10:00am', type: 'created' },
      { text: 'Status changed to In Progress', ts: 'Apr 28, 1:00pm', type: 'status' },
      { text: 'About 70% done — notifications sheet is the last holdout.', ts: 'May 2, 11:00am', type: 'comment' },
    ],
  },
  {
    id: 'MOB-002',
    projectId: 'p2',
    title: 'Push notification delivery reliability <5% drop',
    description: 'Production monitoring shows 8.4% notification drop rate on Android. Investigate FCM retry logic.',
    status: 'todo',
    priority: 'urgent',
    assigneeId: 'm2',
    labels: ['Bug', 'Notifications'],
    cycleId: 'cycle-1',
    createdAt: 'Apr 30',
    activity: [
      { text: 'Issue created', ts: 'Apr 30, 3:00pm', type: 'created' },
    ],
  },
  {
    id: 'MOB-003',
    projectId: 'p2',
    title: 'Offline mode for issue viewing',
    description: 'Cache last 100 issues locally so users can browse when offline. Show staleness indicator.',
    status: 'backlog',
    priority: 'medium',
    assigneeId: null,
    labels: ['Feature', 'Offline'],
    cycleId: null,
    createdAt: 'Apr 18',
    activity: [
      { text: 'Issue created', ts: 'Apr 18, 9:00am', type: 'created' },
    ],
  },
  {
    id: 'MOB-004',
    projectId: 'p2',
    title: 'Gesture-based issue status swipe',
    description: 'Swipe right to advance status, left to move back. With haptic feedback.',
    status: 'done',
    priority: 'low',
    assigneeId: 'm1',
    labels: ['Feature', 'Gestures'],
    cycleId: null,
    createdAt: 'Apr 10',
    activity: [
      { text: 'Issue created', ts: 'Apr 10', type: 'created' },
      { text: 'Shipped in v2.3.1', ts: 'Apr 24', type: 'status' },
    ],
  },
  {
    id: 'MOB-005',
    projectId: 'p2',
    title: 'Biometric auth for app unlock',
    description: 'Support Face ID / fingerprint to re-authenticate after session timeout instead of full password entry.',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'm3',
    labels: ['Security', 'Feature'],
    cycleId: null,
    createdAt: 'Apr 26',
    activity: [
      { text: 'Issue created', ts: 'Apr 26', type: 'created' },
    ],
  },
  // Analytics Suite
  {
    id: 'ANA-001',
    projectId: 'p3',
    title: 'Cycle time breakdown chart',
    description: 'Show time spent in each status column as a stacked bar chart per cycle.',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'm1',
    labels: ['Feature', 'Charts'],
    cycleId: 'cycle-1',
    createdAt: 'Apr 29',
    activity: [
      { text: 'Issue created', ts: 'Apr 29, 8:00am', type: 'created' },
      { text: 'Status changed to In Progress', ts: 'May 1, 10:00am', type: 'status' },
    ],
  },
  {
    id: 'ANA-002',
    projectId: 'p3',
    title: 'Burndown chart for cycles',
    description: 'Classic burndown with ideal vs actual lines. Export as PNG.',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'm2',
    labels: ['Feature', 'Charts'],
    cycleId: 'cycle-1',
    createdAt: 'Apr 24',
    activity: [
      { text: 'Issue created', ts: 'Apr 24', type: 'created' },
    ],
  },
  {
    id: 'ANA-003',
    projectId: 'p3',
    title: 'Team throughput weekly summary email',
    description: 'Auto-generate and send a weekly digest showing issues completed, velocity trend, and top contributors.',
    status: 'backlog',
    priority: 'low',
    assigneeId: null,
    labels: ['Feature', 'Email'],
    cycleId: null,
    createdAt: 'Apr 12',
    activity: [
      { text: 'Issue created', ts: 'Apr 12', type: 'created' },
    ],
  },
  {
    id: 'ANA-004',
    projectId: 'p3',
    title: 'CSV export for all analytics views',
    description: 'Add export button to each chart/table that downloads data as CSV.',
    status: 'done',
    priority: 'medium',
    assigneeId: 'm3',
    labels: ['Feature'],
    cycleId: null,
    createdAt: 'Apr 8',
    activity: [
      { text: 'Issue created', ts: 'Apr 8', type: 'created' },
      { text: 'Shipped', ts: 'Apr 20', type: 'status' },
    ],
  },
]
