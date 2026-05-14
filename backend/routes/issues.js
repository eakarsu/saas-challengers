const router = require('express').Router();
const pool = require('../db');
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT i.*, p.name AS project_name, s.name AS sprint_name, tm.name AS assignee_name
      FROM issues i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN sprints s ON i.sprint_id = s.id
      LEFT JOIN team_members tm ON i.assignee_id = tm.id
      ORDER BY i.created_at DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT i.*, p.name AS project_name, s.name AS sprint_name, tm.name AS assignee_name
      FROM issues i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN sprints s ON i.sprint_id = s.id
      LEFT JOIN team_members tm ON i.assignee_id = tm.id
      WHERE i.id=$1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', verifyToken, async (req, res) => {
  const { project_id, sprint_id, assignee_id, title, description, status, priority, issue_type, story_points, due_date } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO issues(project_id,sprint_id,assignee_id,title,description,status,priority,issue_type,story_points,due_date)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [project_id, sprint_id||null, assignee_id||null, title, description, status||'backlog', priority||'medium', issue_type||'task', story_points||1, due_date||null]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', verifyToken, async (req, res) => {
  const { project_id, sprint_id, assignee_id, title, description, status, priority, issue_type, story_points, due_date } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE issues SET project_id=$1,sprint_id=$2,assignee_id=$3,title=$4,description=$5,status=$6,priority=$7,issue_type=$8,story_points=$9,due_date=$10 WHERE id=$11 RETURNING *`,
      [project_id, sprint_id||null, assignee_id||null, title, description, status, priority, issue_type, story_points||1, due_date||null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM issues WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
