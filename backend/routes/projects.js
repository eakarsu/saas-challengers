const router = require('express').Router();
const pool = require('../db');
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM issues i WHERE i.project_id = p.id) AS issue_count,
        (SELECT COUNT(*) FROM sprints s WHERE s.project_id = p.id) AS sprint_count
      FROM projects p ORDER BY p.created_at DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM projects WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', verifyToken, async (req, res) => {
  const { name, description, status, priority, start_date, end_date, owner, tech_stack, repository_url } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO projects(name,description,status,priority,start_date,end_date,owner,tech_stack,repository_url)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, description, status||'active', priority||'medium', start_date||null, end_date||null, owner, tech_stack, repository_url]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', verifyToken, async (req, res) => {
  const { name, description, status, priority, start_date, end_date, owner, tech_stack, repository_url } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE projects SET name=$1,description=$2,status=$3,priority=$4,start_date=$5,end_date=$6,owner=$7,tech_stack=$8,repository_url=$9 WHERE id=$10 RETURNING *`,
      [name, description, status, priority, start_date||null, end_date||null, owner, tech_stack, repository_url, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
