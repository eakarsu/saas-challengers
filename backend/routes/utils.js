const router = require('express').Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// 1. CSV export of issues with optional filters
router.get('/issues/export.csv', verifyToken, async (req, res) => {
  try {
    const { project_id, sprint_id, assignee_id, status, priority, issue_type } = req.query;
    const where = [];
    const params = [];
    const add = (sql, val) => { if (val !== undefined && val !== '') { params.push(val); where.push(`${sql}=$${params.length}`); } };
    add('i.project_id', project_id);
    add('i.sprint_id', sprint_id);
    add('i.assignee_id', assignee_id);
    add('i.status', status);
    add('i.priority', priority);
    add('i.issue_type', issue_type);
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const { rows } = await pool.query(`
      SELECT i.id, i.title, i.description, i.status, i.priority, i.issue_type,
             i.story_points, i.due_date, i.created_at,
             p.name AS project_name, s.name AS sprint_name, tm.name AS assignee_name
      FROM issues i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN sprints s ON i.sprint_id = s.id
      LEFT JOIN team_members tm ON i.assignee_id = tm.id
      ${whereSql}
      ORDER BY i.created_at DESC`, params);
    const headers = ['id','title','description','status','priority','issue_type','story_points','due_date','created_at','project_name','sprint_name','assignee_name'];
    const lines = [headers.join(',')];
    for (const r of rows) lines.push(headers.map(h => csvEscape(r[h])).join(','));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="issues-${Date.now()}.csv"`);
    res.send(lines.join('\n'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Search + filter across issues with text query and structured filters
router.get('/search/issues', verifyToken, async (req, res) => {
  try {
    const { q, project_id, sprint_id, assignee_id, status, priority, issue_type, min_points, max_points, limit } = req.query;
    const where = [];
    const params = [];
    if (q) { params.push(`%${q.toLowerCase()}%`); where.push(`(LOWER(i.title) LIKE $${params.length} OR LOWER(COALESCE(i.description,'')) LIKE $${params.length})`); }
    const add = (sql, val) => { if (val !== undefined && val !== '') { params.push(val); where.push(`${sql}=$${params.length}`); } };
    add('i.project_id', project_id);
    add('i.sprint_id', sprint_id);
    add('i.assignee_id', assignee_id);
    add('i.status', status);
    add('i.priority', priority);
    add('i.issue_type', issue_type);
    if (min_points !== undefined && min_points !== '') { params.push(parseInt(min_points)); where.push(`i.story_points >= $${params.length}`); }
    if (max_points !== undefined && max_points !== '') { params.push(parseInt(max_points)); where.push(`i.story_points <= $${params.length}`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const lim = Math.min(parseInt(limit || '100'), 500);
    params.push(lim);
    const { rows } = await pool.query(`
      SELECT i.*, p.name AS project_name, s.name AS sprint_name, tm.name AS assignee_name
      FROM issues i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN sprints s ON i.sprint_id = s.id
      LEFT JOIN team_members tm ON i.assignee_id = tm.id
      ${whereSql}
      ORDER BY i.created_at DESC
      LIMIT $${params.length}`, params);
    res.json({ count: rows.length, results: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Audit log: list and create entries
router.get('/audit', verifyToken, async (req, res) => {
  try {
    const { entity_type, entity_id, action, limit } = req.query;
    const where = [];
    const params = [];
    const add = (sql, val) => { if (val !== undefined && val !== '') { params.push(val); where.push(`${sql}=$${params.length}`); } };
    add('entity_type', entity_type);
    add('entity_id', entity_id);
    add('action', action);
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const lim = Math.min(parseInt(limit || '100'), 500);
    params.push(lim);
    const { rows } = await pool.query(
      `SELECT * FROM audit_log ${whereSql} ORDER BY created_at DESC LIMIT $${params.length}`,
      params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/audit', verifyToken, async (req, res) => {
  const { action, entity_type, entity_id, details } = req.body;
  try {
    const userEmail = req.user?.email || 'unknown';
    const { rows } = await pool.query(
      `INSERT INTO audit_log(user_email, action, entity_type, entity_id, details)
       VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [userEmail, action, entity_type, entity_id || null, details || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
