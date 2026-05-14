const router = require('express').Router();
const pool = require('../db');
const verifyToken = require('../middleware/auth');

// Domain-realistic sample data for a SaaS PM tool (Momentum)

const PROJECTS = [
  { name: 'Momentum Web Platform', description: 'Core web application for project management', status: 'active', priority: 'high', owner: 'Priya Raman', tech_stack: 'React, Node.js, PostgreSQL', repository_url: 'https://github.com/momentum/web' },
  { name: 'Mobile iOS Companion', description: 'Native iOS client with offline-first sync', status: 'active', priority: 'high', owner: 'Diego Alvarez', tech_stack: 'Swift, GRDB, CloudKit', repository_url: 'https://github.com/momentum/ios' },
  { name: 'Realtime Collaboration Service', description: 'CRDT-based document sync and presence', status: 'active', priority: 'critical', owner: 'Mei Tanaka', tech_stack: 'Rust, Yjs, Redis', repository_url: 'https://github.com/momentum/collab' },
  { name: 'Billing & Subscriptions', description: 'Stripe integration, dunning, invoicing', status: 'planned', priority: 'medium', owner: 'Liam O\'Connor', tech_stack: 'Node.js, Stripe API', repository_url: 'https://github.com/momentum/billing' },
  { name: 'Analytics Pipeline', description: 'Event ingestion and dashboards', status: 'active', priority: 'medium', owner: 'Aisha Mensah', tech_stack: 'Kafka, ClickHouse, dbt', repository_url: 'https://github.com/momentum/analytics' },
  { name: 'Onboarding Redesign', description: 'New user activation funnel revamp', status: 'planned', priority: 'high', owner: 'Hugo Bertrand', tech_stack: 'React, Framer Motion', repository_url: 'https://github.com/momentum/onboarding' },
  { name: 'Compliance & SOC2', description: 'SOC2 Type II audit prep and controls', status: 'active', priority: 'critical', owner: 'Sara Cohen', tech_stack: 'Vanta, Terraform', repository_url: 'https://github.com/momentum/compliance' },
];

const TEAM = [
  { name: 'Priya Raman', email: 'priya.raman@momentum.dev', role: 'Senior Engineer', avatar_color: 'bg-violet-500', department: 'Platform', time_zone: 'Asia/Kolkata', github_handle: 'priyaraman' },
  { name: 'Diego Alvarez', email: 'diego.alvarez@momentum.dev', role: 'iOS Lead', avatar_color: 'bg-emerald-500', department: 'Mobile', time_zone: 'Europe/Madrid', github_handle: 'dalvarez' },
  { name: 'Mei Tanaka', email: 'mei.tanaka@momentum.dev', role: 'Staff Engineer', avatar_color: 'bg-rose-500', department: 'Realtime', time_zone: 'Asia/Tokyo', github_handle: 'meitanaka' },
  { name: 'Liam O\'Connor', email: 'liam.oconnor@momentum.dev', role: 'Backend Engineer', avatar_color: 'bg-blue-500', department: 'Billing', time_zone: 'Europe/Dublin', github_handle: 'liamoc' },
  { name: 'Aisha Mensah', email: 'aisha.mensah@momentum.dev', role: 'Data Engineer', avatar_color: 'bg-amber-500', department: 'Analytics', time_zone: 'Africa/Accra', github_handle: 'aishamensah' },
  { name: 'Hugo Bertrand', email: 'hugo.bertrand@momentum.dev', role: 'Product Designer', avatar_color: 'bg-pink-500', department: 'Design', time_zone: 'Europe/Paris', github_handle: 'hbertrand' },
  { name: 'Sara Cohen', email: 'sara.cohen@momentum.dev', role: 'Security Engineer', avatar_color: 'bg-teal-500', department: 'Security', time_zone: 'Asia/Jerusalem', github_handle: 'saracohen' },
  { name: 'Noah Whitford', email: 'noah.whitford@momentum.dev', role: 'QA Engineer', avatar_color: 'bg-indigo-500', department: 'QA', time_zone: 'America/New_York', github_handle: 'nwhitford' },
];

const LABELS = [
  { name: 'bug', color: 'bg-red-500', description: 'Something isn\'t working' },
  { name: 'feature', color: 'bg-emerald-500', description: 'New capability' },
  { name: 'tech-debt', color: 'bg-amber-500', description: 'Refactor or cleanup' },
  { name: 'security', color: 'bg-rose-500', description: 'Security-sensitive work' },
  { name: 'performance', color: 'bg-blue-500', description: 'Latency or throughput' },
  { name: 'ux', color: 'bg-pink-500', description: 'User experience polish' },
  { name: 'docs', color: 'bg-gray-500', description: 'Documentation updates' },
  { name: 'infra', color: 'bg-slate-500', description: 'Infrastructure / DevOps' },
];

const ISSUE_TITLES = [
  { title: 'Implement OAuth2 PKCE flow for SSO providers', type: 'feature', priority: 'high', points: 8 },
  { title: 'Fix memory leak in WebSocket reconnection handler', type: 'bug', priority: 'critical', points: 5 },
  { title: 'Reduce p95 latency on /api/issues list endpoint', type: 'task', priority: 'high', points: 5 },
  { title: 'Migrate audit_log table to partitioned schema', type: 'task', priority: 'medium', points: 8 },
  { title: 'Add Stripe webhook idempotency keys', type: 'feature', priority: 'high', points: 3 },
  { title: 'Sprint board drag-and-drop drops on Safari', type: 'bug', priority: 'high', points: 3 },
  { title: 'Refactor legacy notification dispatcher', type: 'task', priority: 'medium', points: 5 },
  { title: 'Add rate limiting to public API endpoints', type: 'feature', priority: 'high', points: 5 },
  { title: 'Investigate flaky e2e tests on CI', type: 'bug', priority: 'medium', points: 3 },
  { title: 'Document onboarding email templates', type: 'task', priority: 'low', points: 1 },
  { title: 'Implement keyboard shortcuts on issue detail view', type: 'feature', priority: 'medium', points: 3 },
  { title: 'Upgrade Postgres driver to v8 (BigInt support)', type: 'task', priority: 'medium', points: 2 },
];

const COMMENT_TEMPLATES = [
  'Pushed a draft PR — would appreciate a review when you have a minute.',
  'Reproduced this on staging with Chrome 134. Stack trace attached in Slack.',
  'I think we can ship this behind a feature flag first and ramp slowly.',
  'Linking the design spec from Hugo: https://figma.com/momentum/onboarding-v2',
  'Moving to In Progress — should be done by EOD Thursday.',
  'Blocked on infra ticket INF-482; pinged the platform team.',
  'Closing as duplicate of issue #214 which has more context.',
  'Added benchmarks: p95 went from 412ms to 88ms after the index change.',
  'QA pass complete, no regressions found in the smoke suite.',
  'Reopening — saw the same crash in production logs this morning.',
];

function pick(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

function randInt(lo, hi) { return Math.floor(Math.random() * (hi - lo + 1)) + lo; }

function suffix() { return ' [sample-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6) + ']'; }

router.post('/sample-data/:entity', verifyToken, async (req, res) => {
  const { entity } = req.params;
  const tag = suffix();

  try {
    if (entity === 'projects') {
      const sel = pick(PROJECTS, randInt(5, 7));
      let inserted = 0;
      for (const p of sel) {
        const start = new Date(); start.setDate(start.getDate() - randInt(10, 90));
        const end = new Date(start); end.setDate(end.getDate() + randInt(60, 180));
        await pool.query(
          `INSERT INTO projects(name,description,status,priority,start_date,end_date,owner,tech_stack,repository_url)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [p.name + tag, p.description, p.status, p.priority, start, end, p.owner, p.tech_stack, p.repository_url]
        );
        inserted++;
      }
      return res.json({ inserted, entity });
    }

    if (entity === 'team') {
      const sel = pick(TEAM, randInt(5, 8));
      let inserted = 0;
      for (const m of sel) {
        const joined = new Date(); joined.setDate(joined.getDate() - randInt(30, 800));
        const uniqEmail = m.email.replace('@', '+' + tag.replace(/[^a-z0-9]/gi, '').slice(0, 8) + '@');
        await pool.query(
          `INSERT INTO team_members(name,email,role,avatar_color,department,time_zone,joined_date,active,github_handle)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (email) DO NOTHING`,
          [m.name, uniqEmail, m.role, m.avatar_color, m.department, m.time_zone, joined, true, m.github_handle]
        );
        inserted++;
      }
      return res.json({ inserted, entity });
    }

    if (entity === 'labels') {
      const { rows: pr } = await pool.query('SELECT id FROM projects ORDER BY created_at DESC LIMIT 1');
      const pid = pr[0]?.id || null;
      const sel = pick(LABELS, randInt(5, 8));
      let inserted = 0;
      for (const l of sel) {
        await pool.query(
          `INSERT INTO labels(name,color,description,project_id) VALUES($1,$2,$3,$4)`,
          [l.name + tag, l.color, l.description, pid]
        );
        inserted++;
      }
      return res.json({ inserted, entity });
    }

    if (entity === 'sprints') {
      const { rows: pr } = await pool.query('SELECT id FROM projects ORDER BY created_at DESC LIMIT 5');
      if (!pr.length) return res.status(400).json({ error: 'No projects exist; insert projects first.' });
      const count = randInt(5, 8);
      const sprintNames = ['Sprint 23 — Auth Hardening', 'Sprint 24 — Realtime Sync', 'Sprint 25 — Billing GA', 'Sprint 26 — Mobile Polish', 'Sprint 27 — Analytics MVP', 'Sprint 28 — Compliance', 'Sprint 29 — Onboarding', 'Sprint 30 — Performance'];
      const goals = [
        'Ship SSO across all enterprise customers',
        'Reduce realtime sync latency below 80ms p95',
        'GA Stripe billing with usage-based pricing',
        'Polish iOS UX, fix top crashers',
        'Land first analytics dashboards for admins',
        'Pass SOC2 Type II audit interim review',
        'Increase activation rate to 38%',
        'Cut homepage TTFB by 40%',
      ];
      let inserted = 0;
      for (let i = 0; i < count; i++) {
        const proj = pr[i % pr.length];
        const start = new Date(); start.setDate(start.getDate() + i * 14 - 14);
        const end = new Date(start); end.setDate(end.getDate() + 13);
        await pool.query(
          `INSERT INTO sprints(project_id,name,goal,status,start_date,end_date,velocity)
           VALUES($1,$2,$3,$4,$5,$6,$7)`,
          [proj.id, sprintNames[i % sprintNames.length] + tag, goals[i % goals.length], i === 0 ? 'active' : 'planned', start, end, randInt(18, 42)]
        );
        inserted++;
      }
      return res.json({ inserted, entity });
    }

    if (entity === 'issues') {
      const { rows: pr } = await pool.query('SELECT id FROM projects ORDER BY created_at DESC LIMIT 5');
      if (!pr.length) return res.status(400).json({ error: 'No projects exist; insert projects first.' });
      const { rows: tm } = await pool.query('SELECT id FROM team_members ORDER BY created_at DESC LIMIT 8');
      const { rows: sp } = await pool.query('SELECT id, project_id FROM sprints ORDER BY created_at DESC LIMIT 8');
      const sel = pick(ISSUE_TITLES, randInt(6, 10));
      const statuses = ['backlog', 'todo', 'in_progress', 'review', 'done'];
      let inserted = 0;
      for (const it of sel) {
        const proj = pr[randInt(0, pr.length - 1)];
        const sprint = sp.find(s => s.project_id === proj.id) || null;
        const assignee = tm.length ? tm[randInt(0, tm.length - 1)].id : null;
        const due = new Date(); due.setDate(due.getDate() + randInt(3, 30));
        await pool.query(
          `INSERT INTO issues(project_id,sprint_id,assignee_id,title,description,status,priority,issue_type,story_points,due_date)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [proj.id, sprint?.id || null, assignee, it.title + tag, 'Auto-generated sample issue. ' + it.title, statuses[randInt(0, statuses.length - 1)], it.priority, it.type, it.points, due]
        );
        inserted++;
      }
      return res.json({ inserted, entity });
    }

    if (entity === 'comments') {
      const { rows: iss } = await pool.query('SELECT id FROM issues ORDER BY created_at DESC LIMIT 20');
      if (!iss.length) return res.status(400).json({ error: 'No issues exist; insert issues first.' });
      const { rows: tm } = await pool.query('SELECT id FROM team_members ORDER BY created_at DESC LIMIT 8');
      const count = randInt(6, 10);
      let inserted = 0;
      for (let i = 0; i < count; i++) {
        const issue = iss[randInt(0, iss.length - 1)];
        const author = tm.length ? tm[randInt(0, tm.length - 1)].id : null;
        const content = COMMENT_TEMPLATES[randInt(0, COMMENT_TEMPLATES.length - 1)] + tag;
        await pool.query(
          `INSERT INTO comments(issue_id,author_id,content) VALUES($1,$2,$3)`,
          [issue.id, author, content]
        );
        inserted++;
      }
      return res.json({ inserted, entity });
    }

    return res.status(400).json({ error: `Unknown entity: ${entity}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
